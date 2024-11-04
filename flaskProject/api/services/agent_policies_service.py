import json
import time
from config import CompanyConfig, get_aws_clients, logger

class AgentPoliciesService:
    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.bedrock_agent_bedrock_allow_policy_name = self.config.bedrock_agent_bedrock_allow_policy_name
        self.bedrock_agent_kb_retrival_policy_statement = self.config.bedrock_agent_kb_retrival_policy_statement
        self.bedrock_agent_kb_allow_policy_name = self.config.bedrock_agent_kb_allow_policy_name
        self.assume_role_policy_document = self.config.assume_role_policy_document
        self.bedrock_agent_bedrock_allow_policy_statement = self.config.bedrock_agent_bedrock_allow_policy_statement
        self.agent_role_name = self.config.agent_role_name
        
    def get_agent_policy_arn(self, policy_name):
        try:
            response = self.aws.iam.list_policies(
                Scope='Local',
                OnlyAttached=False
            )
            for policy in response['Policies']:
                if policy['PolicyName'] == policy_name:
                    return policy['Arn']
            return None
        except Exception as e:
            logger.error(f"Error getting agent policy ARN: {str(e)}")
            raise e
        
    def is_policy_versions_max(self, policy_arn):
        try:
            response = self.aws.iam.list_policy_versions(
                PolicyArn=policy_arn
            )
            # The maximum number of policy versions is 5
            return len(response['Versions']) >= 5
        except Exception as e:
            logger.error(f"Error checking if policy versions are at the maximum: {str(e)}")
            raise e
    
    def delete_policy_versions(self, policy_arn):
        try:
            response = self.aws.iam.list_policy_versions(
                PolicyArn=policy_arn
            )
            # Delete all non-default policy versions
            for version in response['Versions']:
                if not version['IsDefaultVersion']:
                    self.aws.iam.delete_policy_version(
                        PolicyArn=policy_arn,
                        VersionId=version['VersionId']
                    )
                    logger.info(f"Deleted policy version {version['VersionId']} for policy {policy_arn}")
        except Exception as e:
            logger.error(f"Error deleting policy versions: {str(e)}")
            raise e
            
    def create_agent_policy(self, policy_name, policy_json, description=None):
        try:
            existing_policy_arn = self.get_agent_policy_arn(policy_name)
            if existing_policy_arn:
                logger.info(f"Agent policy '{policy_name}' already exists")
                if self.is_policy_versions_max(existing_policy_arn):
                    self.delete_policy_versions(existing_policy_arn)
                self.aws.iam.create_policy_version(
                    PolicyArn=existing_policy_arn,
                    PolicyDocument=json.dumps(policy_json),
                    SetAsDefault=True
                )
                return existing_policy_arn
            else:
                response = self.aws.iam.create_policy(
                    PolicyName=policy_name,
                    PolicyDocument=json.dumps(policy_json),
                    Description=description if description else ""
                )
                logger.info(f"Agent policy '{policy_name}' created successfully")
                return response['Policy']['Arn']
        except Exception as e:
            logger.error(f"Error creating agent policy '{policy_name}': {str(e)}")
            raise e
        
    def create_bedrock_policy(self):
        return self.create_agent_policy(self.bedrock_agent_bedrock_allow_policy_name, self.bedrock_agent_bedrock_allow_policy_statement)

    def create_agent_kb_schema_policy(self):
        self.config.update_agent_kb_retrival_policy_statement(self.config.knowledge_base_arn)
        return self.create_agent_policy(self.bedrock_agent_kb_allow_policy_name, self.config.bedrock_agent_kb_retrival_policy_statement, "Policy to allow agent to retrieve documents from knowledge base." )

    def attach_policy_to_role(self, policy_arn, role_name):
        try:
            response = self.aws.iam.attach_role_policy(
                PolicyArn=policy_arn,
                RoleName=role_name
            )
            logger.info(f"Policy '{policy_arn}' attached to role '{role_name}' successfully")
        except Exception as e:
            logger.error(f"Error attaching policy '{policy_arn}' to role '{role_name}': {str(e)}")
            raise e

    def create_role(self, role_name, policy_arns):
        try:
            existing_role = self.get_role(role_name)
            if existing_role:
                logger.info(f"Role '{role_name}' already exists")
                return existing_role
            else:
                response = self.aws.iam.create_role(
                    RoleName=role_name,
                    AssumeRolePolicyDocument=json.dumps(self.assume_role_policy_document)
                )
                logger.info(f"Role '{role_name}' created successfully")
                time.sleep(10)
                for policy_arn in policy_arns:
                    self.attach_policy_to_role(policy_arn, role_name)
                return response['Role']
        except Exception as e:
            logger.error(f"Error creating role '{role_name}': {str(e)}")
            raise e


    def get_role(self, role_name):
        try:
            response = self.aws.iam.get_role(
                RoleName=role_name
            )
            return response['Role']
        except self.aws.iam.exceptions.NoSuchEntityException:
            return None
        except Exception as e:
            logger.error(f"Error getting role '{role_name}': {str(e)}")
            raise e
    
    def role_process(self):
        bedrock_policy_arn = self.create_bedrock_policy()
        kb_policy_arn = self.create_agent_kb_schema_policy()
        return self.create_role(self.agent_role_name, [bedrock_policy_arn, kb_policy_arn])