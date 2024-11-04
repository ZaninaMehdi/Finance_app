from config import CompanyConfig, get_aws_clients, logger
import time

class KnowledgeBaseService:
    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.kb_name = self.config.kb_name
        self.kb_role_arn = self.config.kb_role_arn
        self.embedding_model_arn = self.config.embedding_model_arn
        self.storage_configuration = self.config.storage_configuration

    def get_knowledge_base(self):
        """Get existing knowledge base if it exists"""
        try:
            response = self.aws.bedrock_agent.list_knowledge_bases()
            for kb in response['knowledgeBaseSummaries']:
                if kb['name'] == self.kb_name:
                    return kb
            logger.info(f"No existing knowledge base found with name '{self.kb_name}'")
            return None
        except Exception as e:
            logger.error(f"Error checking knowledge base '{self.kb_name}': {str(e)}")
            raise e

    def create_knowledge_base(self):
        """Create or get existing knowledge base"""
        try:
            existing_kb = self.get_knowledge_base()
            if existing_kb:
                logger.info(f"Knowledge base '{self.kb_name}' already exists")
                knowledge_base_id = existing_kb["knowledgeBaseId"]
                knowledge_base_arn = self.aws.bedrock_agent.get_knowledge_base(knowledgeBaseId = knowledge_base_id)["knowledgeBase"]["knowledgeBaseArn"]
                
                # Update the shared configuration
                self.config.update_knowledge_base_arn(knowledge_base_arn)
                return knowledge_base_id, knowledge_base_arn
            else:
                # Wait for any IAM role propagation
                time.sleep(45)
                self.config.update_storage_configuration(self.config.collection_arn)
                response = self.aws.bedrock_agent.create_knowledge_base(
                    name=self.kb_name,
                    description='KB that contains the Annual Financial Report',
                    roleArn=self.config.kb_role_arn,
                    knowledgeBaseConfiguration={
                        'type': 'VECTOR',
                        'vectorKnowledgeBaseConfiguration': {
                            'embeddingModelArn': self.embedding_model_arn
                        }
                    },
                    storageConfiguration=self.config.storage_configuration
                )
                
                knowledge_base_id = response["knowledgeBase"]["knowledgeBaseId"]
                knowledge_base_arn = response["knowledgeBase"]["knowledgeBaseArn"]
                
                # Update the shared configuration
                self.config.update_knowledge_base_arn(knowledge_base_arn)
                
                logger.info(f"Knowledge base '{self.kb_name}' created successfully")
                return knowledge_base_id, knowledge_base_arn
                
        except Exception as e:
            logger.error(f"Error creating knowledge base '{self.kb_name}': {str(e)}")
            raise e

    def process_knowledge_base_creation(self):
        """Complete process of creating and waiting for knowledge base"""
        knowledge_base_id, knowledge_base_arn = self.create_knowledge_base()
        return knowledge_base_id, knowledge_base_arn