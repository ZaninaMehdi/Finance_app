from config import CompanyConfig, get_aws_clients, logger
import json
import time
import uuid
import pprint

class FinanceAgentService:
    def __init__(self, company_name: str):
        self.config = CompanyConfig(company_name)
        self.aws = self.config.aws
        self.kb_name = self.config.kb_name
        self.kb_role_arn = self.config.kb_role_arn
        self.embedding_model_arn = self.config.embedding_model_arn
        self.storage_configuration = self.config.storage_configuration
        self.agent_name = self.config.agent_name
        self.agent_instruction = self.config.agent_instruction
        self.model_id = self.config.model_id
        self.agent_alias_name = self.config.agent_alias_name

    def start_ingestion_job(self, data_source_response, knowledge_base_id):
        data_source_id = data_source_response["dataSource"]["dataSourceId"]
        start_job_response = self.aws.bedrock_agent.start_ingestion_job(
        knowledgeBaseId=knowledge_base_id, 
        dataSourceId=data_source_id
        )

    def create_agent(self, agent_role):
        try:
            response = self.aws.bedrock_agent.create_agent(
                agentName=self.agent_name,
                agentResourceRoleArn=agent_role['Role']['Arn'],
                description="Agent supporting Financial Analysts.",
                idleSessionTTLInSeconds=1800,
                foundationModel=self.model_id,
                instruction=self.agent_instruction,
            )
            logger.info(f"Agent 'FinancialAgent' created successfully")
            return response['agent']
        except Exception as e:
            logger.error(f"Error creating agent 'FinancialAgent': {str(e)}")
            raise e
        
    def associate_agent_with_kb(self, agent_id, knowledge_base_id):
        try:
            response = self.aws.bedrock_agent.associate_knowledge_base(
                agentId=agent_id,
                agentVersion='DRAFT',
                description=f'Use the information in the {self.kb_name} knowledge base to provide accurate responses to the questions about Financial Reports.',
                knowledgeBaseId=knowledge_base_id 
            )
            logger.info(f"Agent 'FinancialAgent' associated with knowledge base '{self.kb_name}' successfully")
        except Exception as e:
            logger.error(f"Error associating agent 'FinancialAgent' with knowledge base '{self.kb_name}': {str(e)}")
            raise e
        
    def prepare_agent(self, agent_id):
        try:
            self.aws.bedrock_agent.prepare_agent(agentId=agent_id)
        except Exception as e:
            logger.error(f"Error preparing agent 'FinancialAgent': {str(e)}")
            raise e
        
    def create_agent_alias(self, agent_id):
        try:
            time.sleep(30)
            response = self.aws.bedrock_agent.create_agent_alias(
                agentId=agent_id,
                agentAliasName=self.agent_alias_name
            )
            logger.info(f"Agent alias '{self.agent_alias_name}' created successfully")
            time.sleep(30)
            return response['agentAlias']
        except Exception as e:
            logger.error(f"Error creating agent alias '{self.agent_alias_name}': {str(e)}")
            raise e
        
    def simple_agent_invoke(self, input_text, agent_id, agent_alias_id, session_id=None, enable_trace=False, end_session=False):
        if session_id is None:
            session_id:str = str(uuid.uuid1())

        agentResponse = self.aws.bedrock_agent_runtime.invoke_agent(
            inputText=input_text,
            agentId=agent_id,
            agentAliasId=agent_alias_id, 
            sessionId=session_id,
            enableTrace=enable_trace, 
            endSession= end_session
        )
        logger.info(pprint.pprint(agentResponse))
        
        agent_answer = ''
        event_stream = agentResponse['completion']
        try:
            for event in event_stream:        
                if 'chunk' in event:
                    data = event['chunk']['bytes']
                    logger.info(f"Final answer ->\n{data.decode('utf8')}")
                    agent_answer = data.decode('utf8')
                    end_event_received = True
                    # End event indicates that the request finished successfully
                elif 'trace' in event:
                    logger.info(json.dumps(event['trace'], indent=2))
                else:
                    raise Exception("unexpected event.", event)
        except Exception as e:
            raise Exception("unexpected event.", e)
        return agent_answer