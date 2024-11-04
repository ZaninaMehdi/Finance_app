import logging
import threading
import boto3
from functools import lru_cache



logging.basicConfig(format='[%(asctime)s] p%(process)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

class AWSClients:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AWSClients, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            logger.info("Initializing AWS clients")
            self.session = boto3.session.Session()
            self._initialize_clients()
            self._initialized = True

    def _initialize_clients(self):
        self.sts_client = self.session.client('sts')
        self.account_id = self.sts_client.get_caller_identity()["Account"]
        self.region = self.session.region_name

        self.iam_client = None
        self.s3_client = None
        self.lambda_client = None
        self.bedrock_agent_client = None
        self.bedrock_agent_runtime_client = None
        self.open_search_serverless_client = None

    @property
    def iam(self):
        if not self.iam_client:
            self.iam_client = self.session.client('iam')
        return self.iam_client
    
    @property
    def s3(self):
        if not self.s3_client:
            self.s3_client = self.session.client('s3')
        return self.s3_client
    
    @property
    def lambda_(self):
        if not self.lambda_client:
            self.lambda_client = self.session.client('lambda')
        return self.lambda_client
    
    @property
    def bedrock_agent(self):
        if not self.bedrock_agent_client:
            self.bedrock_agent_client = self.session.client('bedrock-agent')
        return self.bedrock_agent_client
    
    @property
    def bedrock_agent_runtime(self):
        if not self.bedrock_agent_runtime_client:
            self.bedrock_agent_runtime_client = self.session.client('bedrock-agent-runtime')
        return self.bedrock_agent_runtime_client
    
    @property
    def open_search_serverless(self):
        if not self.open_search_serverless_client:
            self.open_search_serverless_client = self.session.client('opensearchserverless')
        return self.open_search_serverless_client
    
@lru_cache()
def get_aws_clients():  
    return AWSClients()

class CompanyConfig:
    _instances = {}
    _lock = threading.Lock()

    def __new__(cls, company_name: str):
        with cls._lock:
            if company_name not in cls._instances:
                logger.info(f"Creating new CompanyConfig instance for {company_name}")
                instance = super(CompanyConfig, cls).__new__(cls)
                instance._initialized = False
                cls._instances[company_name] = instance
            return cls._instances[company_name]

    def __init__(self, company_name: str):
        if not getattr(self, '_initialized', False):
            self.aws = get_aws_clients()
            self._initialize_config(company_name)
            self._initialized = True
    
    @classmethod
    def get_instance(cls, company_name: str):
        """Get or create a CompanyConfig instance for a specific company"""
        return cls(company_name)
    
    @classmethod
    def get_all_instances(cls):
        """Get all active CompanyConfig instances"""
        return cls._instances
        
    def update_knowledge_base_arn(self, new_arn):
        """Thread-safe update of knowledge_base_arn"""
        with self._lock:
            self.knowledge_base_arn = new_arn
            logger.info(f"Updated knowledge_base_arn for {self.company_name} to {new_arn}")
            return self.knowledge_base_arn
            
    def update_agent_id(self, agent_id):
        """Thread-safe update of agent_id"""
        with self._lock:
            self.agent_id = agent_id
            logger.info(f"Updated agent_id for {self.company_name} to {agent_id}")
            return self.kb_role_arn
            
    def update_agent_alias_id(self, agent_alias_id):
        """Thread-safe update of agent_alias_id"""
        with self._lock:
            self.agent_alias_id = agent_alias_id
            logger.info(f"Updated agent_alias_id for {self.company_name} to {agent_alias_id}")
            return self.kb_role_arn
            
    def update_kb_role_arn(self, new_arn):
        """Thread-safe update of kb_role_arn"""
        with self._lock:
            self.kb_role_arn = new_arn
            logger.info(f"Updated kb_role_arn for {self.company_name} to {new_arn}")
            return self.kb_role_arn
    
    def update_current_role(self, new_role):
        """Thread-safe update of current_role"""
        with self._lock:
            self.current_role = new_role
            logger.info(f"Updated current_role for {self.company_name} to {new_role}")
            return self.current_role
    
    def update_collection_arn(self, new_arn):
        """Thread-safe update of collection_arn"""
        with self._lock:
            self.collection_arn = new_arn
            logger.info(f"Updated collection_arn for {self.company_name} to {new_arn}")
            return self.collection_arn
            
    def update_data_policy_json(self, kb_role_arn, current_role):
        """Thread-safe update of data_policy_json"""
        with self._lock:
            self.data_policy_json = [
                {
                    "Rules": [
                    {
                        "Resource": [
                        f"collection/{self.kb_collection_name}"
                        ],
                        "Permission": [
                        "aoss:DescribeCollectionItems",
                        "aoss:CreateCollectionItems",
                        "aoss:UpdateCollectionItems",
                        "aoss:DeleteCollectionItems"
                        ],
                        "ResourceType": "collection"
                    },
                    {
                        "Resource": [
                        f"index/{self.kb_collection_name}/*"
                        ],
                        "Permission": [
                            "aoss:CreateIndex",
                            "aoss:DeleteIndex",
                            "aoss:UpdateIndex",
                            "aoss:DescribeIndex",
                            "aoss:ReadDocument",
                            "aoss:WriteDocument"
                        ],
                        "ResourceType": "index"
                    }
                    ],
                    "Principal": [
                        kb_role_arn,
                        f"arn:aws:sts::{self.aws.account_id}:assumed-role/Admin/*",
                        current_role
                    ],
                    "Description": ""
                }
            ]

    def update_storage_configuration(self, collection_arn):
        """Thread-safe update of storage_configuration"""
        with self._lock:
            self.storage_configuration = {
            'opensearchServerlessConfiguration': {
                'collectionArn': collection_arn, 
                'fieldMapping': {
                    'metadataField': self.kb_metadataField,
                    'textField': self.kb_textField,
                    'vectorField': self.kb_vectorField
                },
                'vectorIndexName': self.kb_vector_index_name
            },
            'type': 'OPENSEARCH_SERVERLESS'
            }

    def update_agent_kb_retrival_policy_statement(self, knowledge_base_arn):
        """Thread-safe update of bedrock_agent_kb_retrival_policy_statement"""
        with self._lock:
            self.bedrock_agent_kb_retrival_policy_statement = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "bedrock:Retrieve"
                        ],
                        "Resource": [
                            knowledge_base_arn
                        ]
                    }
                ]
            }
    
    def _initialize_config(self, company_name):
        self.company_name = company_name
        self.suffix = f"{self.aws.region}-{self.aws.account_id}"
        self.agent_name = f"financial-analyst-{self.company_name}-agents"
        self.agent_alias_name = f"financial-analyst-{self.company_name}-alias"
        self.bucket_name = f'{self.agent_name}-{self.suffix}'
        self.bucket_arn = f"arn:aws:s3:::{self.bucket_name}"
        self.bedrock_agent_bedrock_allow_policy_name = f"bda-bedrock-allow-{self.suffix}"
        self.bedrock_agent_s3_allow_policy_name = f"bda-s3-allow-{self.suffix}"
        self.bedrock_agent_kb_allow_policy_name = f"bda-kb-allow-{self.suffix}"
        self.agent_role_name = f'AmazonBedrockExecutionRoleForAgents_financial_docs'
        self.kb_name = f'financial-docs-kb-{company_name}-{self.suffix}'
        self.data_source_name = f'financial-docs-kb-docs-{company_name}-{self.suffix}'
        self.kb_collection_name = f'bd-kbc-{company_name}-{self.suffix}'
        self.kb_files_path = f'kb_documents-{company_name}'
        self.kb_key =f'kb_documents-{company_name}'
        self.kb_role_name = f'AmazonBedrockExecutionRoleForKnowledgeBase_financial_docs'
        self.kb_bedrock_allow_policy_name = f"bd-kb-bedrock-allow-{self.suffix}"
        self.kb_aoss_allow_policy_name = f"bd-kb-aoss-allow-{self.suffix}"
        self.kb_s3_allow_policy_name = f"bd-kb-s3-allow-{self.suffix}"
        self.embedding_model_arn = f'arn:aws:bedrock:{self.aws.region}::foundation-model/amazon.titan-embed-text-v1'
        self.kb_vector_index_name = "financial-knowledge-base-index"
        self.kb_metadataField = 'financial-knowledge-base-metadata'
        self.kb_textField = 'financial-knowledge-base-text'
        self.kb_vectorField = 'financial-knowledge-base-vector'
        self.model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        self.kb_role_arn = None
        self.current_role = None
        self.collection_arn = None
        self.knowledge_base_arn = None
        self.agent_id = None
        self.agent_alias_id = None
        self.agent_instruction = """
        You are an agent that support users working with Financial Annual Reports or other financial data. You have access to Financial Annual Reports and Data in form of a JSON in a Knowledge Base
        and you can Answer questions from this documentation. Only answer questions based on the documentation and reply with
        "There is no information about your question on the Financial Report at the moment, sorry! Do you want to ask another question?"
        If the answer to the question is not available in the documentation
        """
        self.bedrock_kb_allow_fm_model_policy_statement = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AmazonBedrockAgentBedrockFoundationModelPolicy",
                    "Effect": "Allow",
                    "Action": "bedrock:InvokeModel",
                    "Resource": [
                        self.embedding_model_arn
                    ]
                }
            ]
        }

        self.bedrock_kb_allow_aoss_policy_statement = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "aoss:APIAccessAll",
                "Resource": [
                    f"arn:aws:aoss:{self.aws.region}:{self.aws.account_id}:collection/*"
                ]
            }
        ]
    }

        self.kb_s3_allow_policy_statement = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowKBAccessDocuments",
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.bucket_name}/*",
                        f"arn:aws:s3:::{self.bucket_name}"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "aws:ResourceAccount": f"{self.aws.account_id}"
                        }
                    }
                }
            ]
        }

        self.assume_role_policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        self.security_policy_json = {
            "Rules": [
                {
                    "ResourceType": "collection",
                    "Resource":[
                        f"collection/{self.kb_collection_name}"
                    ]
                }
            ],
            "AWSOwnedKey": True
        }
        self.network_policy_json = [
        {
            "Rules": [
            {
                "Resource": [
                f"collection/{self.kb_collection_name}"
                ],
                "ResourceType": "dashboard"
            },
            {
                "Resource": [
                f"collection/{self.kb_collection_name}"
                ],
                "ResourceType": "collection"
            }
            ],
            "AllowFromPublic": True
        }
        ]

        self.data_policy_json = [
        {
            "Rules": [
            {
                "Resource": [
                f"collection/{self.kb_collection_name}"
                ],
                "Permission": [
                "aoss:DescribeCollectionItems",
                "aoss:CreateCollectionItems",
                "aoss:UpdateCollectionItems",
                "aoss:DeleteCollectionItems"
                ],
                "ResourceType": "collection"
            },
            {
                "Resource": [
                f"index/{self.kb_collection_name}/*"
                ],
                "Permission": [
                    "aoss:CreateIndex",
                    "aoss:DeleteIndex",
                    "aoss:UpdateIndex",
                    "aoss:DescribeIndex",
                    "aoss:ReadDocument",
                    "aoss:WriteDocument"
                ],
                "ResourceType": "index"
            }
            ],
            "Principal": [
                self.kb_role_arn,
                f"arn:aws:sts::{self.aws.account_id}:assumed-role/Admin/*",
                self.current_role
            ],
            "Description": ""
        }
        ]

        self.storage_configuration = {
        'opensearchServerlessConfiguration': {
            'collectionArn': self.collection_arn, 
            'fieldMapping': {
                'metadataField': self.kb_metadataField,
                'textField': self.kb_textField,
                'vectorField': self.kb_vectorField
            },
            'vectorIndexName': self.kb_vector_index_name
        },
        'type': 'OPENSEARCH_SERVERLESS'
        }

        self.s3_configuration = {
        'bucketArn': self.bucket_arn,
        'inclusionPrefixes': [self.kb_key]  
        }

        # Define the data source configuration
        self.data_source_configuration = {
            's3Configuration': self.s3_configuration,
            'type': 'S3'
        }

        self.chunking_strategy_configuration = {
        "chunkingStrategy": "FIXED_SIZE",
        "fixedSizeChunkingConfiguration": {
            "maxTokens": 512,
            "overlapPercentage": 20
            }
        }

        self.bedrock_agent_bedrock_allow_policy_statement = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AmazonBedrockAgentBedrockFoundationModelPolicy",
                    "Effect": "Allow",
                    "Action": "bedrock:InvokeModel",
                    "Resource": [
                        f"arn:aws:bedrock:{self.aws.region}::foundation-model/{self.model_id}"
                    ]
                }
            ]
        }

        self.bedrock_agent_kb_retrival_policy_statement = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:Retrieve"
                    ],
                    "Resource": [
                        self.knowledge_base_arn
                    ]
                }
            ]
        }

        self.assume_role_policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }