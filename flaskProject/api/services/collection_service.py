from config import CompanyConfig, get_aws_clients, logger
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import json
import time


class CollectionService:
    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.kb_collection_name = self.config.kb_collection_name
        self.kb_vectorField = self.config.kb_vectorField
        self.kb_textField = self.config.kb_textField
        self.kb_metadataField = self.config.kb_metadataField
        self.kb_vector_index_name = self.config.kb_vector_index_name
        self.network_policy_json = self.config.network_policy_json
        self.security_policy_json = self.config.security_policy_json
        self.data_policy_json = self.config.data_policy_json
        self.region = self.aws.region
    
    def get_security_policy(self, policy_name, type):
        try:
            response = self.aws.open_search_serverless.list_security_policies(type=type)
            for policy in response['securityPolicySummaries']:
                if policy['name'] == policy_name:
                    return policy
            logger.info(f"Security policy for collection '{self.kb_collection_name}' created successfully")
            return None
        except Exception as e:
            logger.error(f"Error creating security policy for collection '{self.kb_collection_name}': {str(e)}")
            raise e
    
    def create_policy(self, policy_name, type, policy_json, description):
        try:
            existing_policy = self.get_security_policy(policy_name, type)
            if existing_policy: 
                logger.info(f"Security policy for collection '{self.kb_collection_name}' already exists")
                return existing_policy
            else:
                response = self.aws.open_search_serverless.create_security_policy(
                    description=description,
                    name=policy_name,
                    type=type,
                    policy=json.dumps(policy_json)
                )
            logger.info(f"Security policy for collection '{self.kb_collection_name}' created successfully")
            return response
        except Exception as e:
            logger.error(f"Error creating security policy for collection '{self.kb_collection_name}': {str(e)}")
            raise e

    def create_network_policy(self):
        return self.create_policy(
            self.kb_collection_name, 
            'network', 
            self.network_policy_json, 
            'Network policy for financial knowledge base'
        )

    def create_security_policy(self):
        return self.create_policy(
            self.kb_collection_name, 
            'encryption', 
            self.security_policy_json, 
            'Security policy for financial knowledge base'
        )
    
    def get_access_policy(self, policy_name, type):
        try:
            response = self.aws.open_search_serverless.list_access_policies(type=type)
            for policy in response['accessPolicySummaries']:
                if policy['name'] == policy_name:
                    return policy
            logger.info(f"Access policy for collection '{self.kb_collection_name}' created successfully")
            return None
        except Exception as e:
            logger.error(f"Error creating access policy for collection '{self.kb_collection_name}': {str(e)}")
            raise e
        
    def create_access_policy(self, policy_name, type, policy_json, description):
        try:
            existing_policy = self.get_access_policy(policy_name, type)
            if existing_policy:
                logger.info(f"Access policy for collection '{self.kb_collection_name}' already exists")
                return existing_policy
            else:
                response = self.aws.open_search_serverless.create_access_policy(
                    description=description,
                    name=policy_name,
                    type=type,
                    policy=json.dumps(policy_json)
                )
            logger.info(f"Access policy for collection '{self.kb_collection_name}' created successfully")
            return response
        except Exception as e:
            logger.error(f"Error creating access policy for collection '{self.kb_collection_name}': {str(e)}")
            raise e
        
    def create_data_policy(self):
        self.config.update_data_policy_json(self.config.kb_role_arn, self.config.current_role)
        return self.create_access_policy(self.kb_collection_name, 'data', self.config.data_policy_json, 'Data policy for financial knowledge base')

    def get_current_role(self):
        try:
            response = self.aws.sts_client.get_caller_identity()
            self.config.update_current_role(response['Arn'])
            return response['Arn']
        except Exception as e:
            logger.error(f"Error getting current role: {str(e)}")
            
    def get_collection(self):
        try:
            response = self.aws.open_search_serverless.list_collections()
            for collection in response['collectionSummaries']:
                if collection['name'] == self.kb_collection_name:
                    return collection
            logger.info(f"Collection '{self.kb_collection_name}' created successfully")
            return None
        except Exception as e:
            logger.error(f"Error creating collection '{self.kb_collection_name}': {str(e)}")
            raise e
            
    def create_collection(self):
        try:
            existing_collection = self.get_collection()
            if existing_collection:
                logger.info(f"Collection '{self.kb_collection_name}' already exists")
                self.config.update_collection_arn(existing_collection["arn"])
                return True
            else:
                response = self.aws.open_search_serverless.create_collection(
                    description='OpenSearch collection for Financial Analysis Base',
                    name=self.kb_collection_name,
                    standbyReplicas='DISABLED',
                    type='VECTORSEARCH'
                )
            logger.info(f"Collection '{self.kb_collection_name}' created successfully")
            self.config.update_collection_arn(response["createCollectionDetail"]["arn"])
            return False
        except Exception as e:
            logger.error(f"Error creating collection '{self.kb_collection_name}': {str(e)}")
            raise e
        
    def wait_collection_creation(self):
        try:
            response = self.aws.open_search_serverless.batch_get_collection(names=[self.kb_collection_name])
            status = response['collectionDetails'][0]['status']
            while status == 'CREATING':
                time.sleep(30)
                response = self.aws.open_search_serverless.batch_get_collection(names=[self.kb_collection_name])
                status = response['collectionDetails'][0]['status']
            logger.info(f"Collection '{self.kb_collection_name}' is active")
            host = (response['collectionDetails'][0]['collectionEndpoint'])
            final_host = host.replace("https://", "")
            return final_host
        except Exception as e:
            logger.error(f"Error waiting for collection '{self.kb_collection_name}' to be active: {str(e)}")
            raise e
            
    def create_index(self, final_host):
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, self.region, 'aoss', session_token=credentials.token)
        client = OpenSearch(
            hosts=[{'host': final_host, 'port': 443}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=300
        )
        # It can take up to a minute for data access rules to be enforced
        time.sleep(45)
        index_body = {
            "settings": {
                "index.knn": True,
                "number_of_shards": 1,
                "knn.algo_param.ef_search": 512,
                "number_of_replicas": 0,
            },
            "mappings": {
                "properties": {}
            }
        }

        index_body["mappings"]["properties"][self.kb_vectorField] = {
            "type": "knn_vector",
            "dimension": 1536,
            "method": {
                "name": "hnsw",
                "engine": "faiss"
            },
        }

        index_body["mappings"]["properties"][self.kb_textField] = {
            "type": "text"
        }

        index_body["mappings"]["properties"][self.kb_metadataField] = {
            "type": "text"
        }

        # Create index
        response = client.indices.create(self.kb_vector_index_name, body=index_body)
        logger.info(f"Index '{self.kb_vector_index_name}' created successfully")
        return response


    def process_collection_creation(self):
        try:
            self.create_network_policy()
            self.create_security_policy()
            self.get_current_role()
            self.create_data_policy()
            exists = self.create_collection()
            if not exists:
                final_host = self.wait_collection_creation()
                self.create_index(final_host)
        except Exception as e:
            logger.error(f"Error creating collection '{self.kb_collection_name}': {str(e)}")
            raise e
        return self.kb_collection_name