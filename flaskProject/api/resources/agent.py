from flask_restful import Resource, reqparse
from api.services.orchestrator_service import ServiceOrchestrator

class AgentResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        args = parser.parse_args()

        company_symbol = args['company']

        try:
            orchestrator = ServiceOrchestrator(company_name=company_symbol.lower())
            reponse_agent = orchestrator.initialize()
            return {'reponse': reponse_agent}, 200
        except ValueError as ve:
            return {'message': str(ve)}, 400
        except Exception as e:
            return {'message': f"Erreur interne du serveur : {str(e)}"}, 500