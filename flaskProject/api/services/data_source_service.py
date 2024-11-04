import time
from config import CompanyConfig, get_aws_clients, logger

class DataSourceService:

    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.data_source_name = self.config.data_source_name
        self.data_source_configuration = self.config.data_source_configuration

    def create_data_source(self, knowledge_base_id):
        try:
            time.sleep(45)
            response = self.aws.bedrock_agent.create_data_source(
                name=self.data_source_name,
                description='Data source for the Financial Knowledge Base',
                knowledgeBaseId=knowledge_base_id,
                dataSourceConfiguration=self.data_source_configuration
            )
            logger.info(f"Data source '{self.data_source_name}' created successfully")
            return response
        except Exception as e:
            logger.error(f"Error creating data source '{self.data_source_name}': {str(e)}")
            raise e
        
    def data_source_exists(self, knowledge_base_id):
        try:
            response = self.aws.bedrock_agent.list_data_sources(
                knowledgeBaseId=knowledge_base_id
            )
            for data_source in response['dataSourceSummaries']:
                if data_source['name'] == self.data_source_name:
                    return data_source['dataSourceId']
            return None
        except Exception as e:
            logger.error(f"Error checking data source '{self.data_source_name}': {str(e)}")
            raise e
        
    def get_data_source(self, knowledge_base_id):
        data_source_id = self.data_source_exists(knowledge_base_id)
        if data_source_id:
            response = self.aws.bedrock_agent.get_data_source(
                dataSourceId=data_source_id,
                knowledgeBaseId=knowledge_base_id
            )
            return response
        else:
            return self.create_data_source(knowledge_base_id)