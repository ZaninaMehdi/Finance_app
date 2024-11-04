from flask_restful import Resource, reqparse
from ..services.orchestrator_service import ServiceOrchestrator
from config import logger, CompanyConfig
import uuid

class ChatResource(Resource):
    def __init__(self):
        self.req_parser = reqparse.RequestParser()
        self.req_parser.add_argument('prompt', type=str, required=True, help='Prompt cannot be blank.')
        self.req_parser.add_argument('company', type=str, required=True, help='Company cannot be blank.')

    def post(self):
        args = self.req_parser.parse_args()
        prompt = args['prompt']
        company_name = args['company']
        company_config = CompanyConfig.get_instance(company_name)
        credentials = company_config.get_agent_credentials()
        service_orchestrator = ServiceOrchestrator(company_name)
        
        try:
            # Generate a unique session ID
            session_id = str(uuid.uuid1())
            
            # Invoke the agent and get the response
            agent_response = service_orchestrator.agent_service.simple_agent_invoke(
                prompt,
                credentials['agent_id'],
                credentials['agent_alias_id'],
                session_id
            )

            return {
                'status': 'success',
                'response': agent_response
            }, 200

        except Exception as e:
            logger.error(f"Error handling chat request: {str(e)}")
            return {
                'status': 'error',
                'message': f"An error occurred: {str(e)}"
            }, 500