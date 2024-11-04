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
            return response['dataSource']
        except Exception as e:
            logger.error(f"Error creating data source '{self.data_source_name}': {str(e)}")
            raise e