import json
from config import CompanyConfig, get_aws_clients, logger
import time


class RolePoliciesKbService:
    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.kb_role_name = self.config.kb_role_name
        self.assume_role_policy_document = self.config.assume_role_policy_document
        self.bedrock_kb_allow_fm_model_policy_statement = self.config.bedrock_kb_allow_fm_model_policy_statement
        self.bedrock_kb_allow_aoss_policy_statement = self.config.bedrock_kb_allow_aoss_policy_statement
        self.kb_s3_allow_policy_statement = self.config.kb_s3_allow_policy_statement
        self.kb_bedrock_allow_policy_name = self.config.kb_bedrock_allow_policy_name
        self.kb_aoss_allow_policy_name = self.config.kb_aoss_allow_policy_name
        self.kb_s3_allow_policy_name = self.config.kb_s3_allow_policy_name

    def get_policy_arn(self, policy_name):
        try:
            policies = self.aws.iam.list_policies(Scope='Local', OnlyAttached=False)['Policies']
            existing_policy = next((p for p in policies if p['PolicyName'] == policy_name), None)
            return existing_policy['Arn'] if existing_policy else None
        except Exception as e:
            logger.error(f"Error checking policy '{policy_name}': {e}")
            return None

    def role_exists(self, role_name):
        try:
            self.aws.iam.get_role(RoleName=role_name)
            return True
        except Exception as e:
            logger.error(f"Error checking role '{role_name}': {e}")
            return False

    def get_kb_bedrock_policy_arn(self):
        kb_bedrock_policy_arn = self.get_policy_arn(self.kb_bedrock_allow_policy_name)
        if not kb_bedrock_policy_arn:
            kb_bedrock_policy_arn = self.aws.iam.create_policy(
                PolicyName=self.kb_bedrock_allow_policy_name,
                PolicyDocument=json.dumps(self.bedrock_kb_allow_fm_model_policy_statement)
            )['Policy']['Arn']
            logger.info(f"Policy '{self.kb_bedrock_allow_policy_name}' created successfully. ARN: {kb_bedrock_policy_arn}")
        else:
            self.aws.iam.create_policy_version(
                PolicyArn=kb_bedrock_policy_arn,
                PolicyDocument=json.dumps(self.bedrock_kb_allow_fm_model_policy_statement),
                SetAsDefault=True
                )
            logger.info(f"Policy '{self.kb_bedrock_allow_policy_name}' already exists. ARN: {kb_bedrock_policy_arn}")
        return kb_bedrock_policy_arn

    def get_kb_aoss_policy_arn(self):
        kb_aoss_policy_arn = self.get_policy_arn(self.kb_aoss_allow_policy_name)
        if not kb_aoss_policy_arn:
            kb_aoss_policy_arn = self.aws.iam.create_policy(
                PolicyName=self.kb_aoss_allow_policy_name,
                PolicyDocument=json.dumps(self.bedrock_kb_allow_aoss_policy_statement)
            )['Policy']['Arn']
            logger.info(f"Policy '{self.kb_aoss_allow_policy_name}' created successfully. ARN: {kb_aoss_policy_arn}")
        else:
            self.aws.iam.create_policy_version(
                PolicyArn=kb_aoss_policy_arn,
                PolicyDocument=json.dumps(self.bedrock_kb_allow_fm_model_policy_statement),
                SetAsDefault=True
                )
            logger.info(f"Policy '{self.kb_aoss_allow_policy_name}' already exists. ARN: {kb_aoss_policy_arn}")
        return kb_aoss_policy_arn

    def get_kb_s3_policy_arn(self):
        kb_s3_policy_arn = self.get_policy_arn(self.kb_s3_allow_policy_name)
        if not kb_s3_policy_arn:
            kb_s3_policy_arn = self.aws.iam.create_policy(
                PolicyName=self.kb_s3_allow_policy_name,
                PolicyDocument=json.dumps(self.kb_s3_allow_policy_statement)
            )['Policy']['Arn']
            logger.info(f"Policy '{self.kb_s3_allow_policy_name}' created successfully. ARN: {kb_s3_policy_arn}")
        else:
            self.aws.iam.create_policy_version(
                PolicyArn=kb_s3_policy_arn,
                PolicyDocument=json.dumps(self.bedrock_kb_allow_fm_model_policy_statement),
                SetAsDefault=True
                )
            logger.info(f"Policy '{self.kb_s3_allow_policy_name}' already exists. ARN: {kb_s3_policy_arn}")
        return kb_s3_policy_arn

    def get_role(self, role_name):
        if not self.role_exists(role_name):
            kb_role = self.aws.iam.create_role(
            RoleName=self.kb_role_name,
            AssumeRolePolicyDocument=json.dumps(self.assume_role_policy_document)
        )
            print(f"Role '{role_name}' created successfully.")
            time.sleep(10)
            kb_bedrock_policy_arn = self.get_kb_bedrock_policy_arn()
            kb_aoss_policy_arn = self.get_kb_aoss_policy_arn()
            kb_s3_policy_arn = self.get_kb_s3_policy_arn()

            self.attach_policy_to_role(kb_bedrock_policy_arn, self.kb_role_name)
            self.attach_policy_to_role(kb_aoss_policy_arn, self.kb_role_name)
            self.attach_policy_to_role(kb_s3_policy_arn, self.kb_role_name)
        else:
            print(f"Role '{role_name}' already exists.")
        

    def attach_policy_to_role(self, policy_arn, role_name):
        try:
            self.aws.iam.attach_role_policy(
                PolicyArn=policy_arn,
                RoleName=role_name
            )
            logger.info(f"Policy '{policy_arn}' attached to role '{role_name}' successfully")
        except Exception as e:
            logger.error(f"Error attaching policy '{policy_arn}' to role '{role_name}': {str(e)}")
            raise e
        
    def get_kb_role(self):

        self.get_role(self.kb_role_name)

        kb_role = self.aws.iam.get_role(RoleName=self.kb_role_name)
        logger.info(f"Role '{self.kb_role_name}' created successfully. ARN: {kb_role['Role']['Arn']}")
        self.config.update_kb_role_arn(kb_role['Role']['Arn'])
        return kb_role