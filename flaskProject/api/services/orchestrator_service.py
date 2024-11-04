from .agent_policies_service import AgentPoliciesService
from .bucket_service import BucketService
from .collection_service import CollectionService
from .knowledge_base_service import KnowledgeBaseService
from .role_policies_kb_service import RolePoliciesKbService
from .finance_agent_service import FinanceAgentService
from .data_source_service import DataSourceService
from config import logger

class ServiceOrchestrator:
    def __init__(self, company_name: str):
        self.company_name = company_name
        self.bucket_service = BucketService(company_name)
        self.collection_service = CollectionService(company_name)
        self.role_policies_kb_service = RolePoliciesKbService(company_name)
        self.knowledge_base_service = KnowledgeBaseService(company_name)
        self.agent_policies_service = AgentPoliciesService(company_name)
        self.agent_service = FinanceAgentService(company_name)
        self.data_source_service = DataSourceService(company_name)

    def initialize(self, kb_files_path: str):
        try:
            # 1. Create and setup S3 bucket
            if not self.bucket_service.bucket_exists():
                self.bucket_service.create_bucket()
            self.bucket_service.uploadDataSet(kb_files_path)

            #2. Check if the role exists
            self.role_policies_kb_service.get_kb_role()
            
            # 3. Setup OpenSearch collection
            self.collection_service.process_collection_creation()
            
            # 4. Create and setup knowledge base
            kb_id, kb_arn = self.knowledge_base_service.process_knowledge_base_creation()

            # 5. Create data source
            response = self.data_source_service.create_data_source(kb_id)

            # 6. Start ingestion job
            self.agent_service.start_ingestion_job(response["dataSourceId"], kb_id)
            
            # 7. Create and setup agent policies
            agent_role_arn = self.agent_policies_service.role_process()['Arn']

            # 8. Create and setup agent
            agent = self.agent_service.create_agent(agent_role_arn)
            self.agent_service.associate_agent_with_kb(agent['agentId'], kb_id)
            self.agent_service.prepare_agent(agent['agentId'])
            agent_alias_id = self.agent_service.create_agent_alias(agent['agentId'])[['agentAliasId']]
            agent_answer = self.agent_service.simple_agent_invoke('How much did the company make last year', agent['agentId'], agent_alias_id)

            return agent_answer

            
        except Exception as e:
            logger.error(f"Error initializing services: {str(e)}")
            raise e
            