# api/resources/analysis.py

from flask_restful import Resource, reqparse
from api.services.finance_data_service import perform_analysis

class AnalysisResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        args = parser.parse_args()

        company_symbol = args['company']

        try:
            analysis_results = perform_analysis(company_symbol)
            return {'company': company_symbol, 'analysis': analysis_results}, 200
        except ValueError as ve:
            return {'message': str(ve)}, 400
        except Exception as e:
            return {'message': f"Erreur interne du serveur : {str(e)}"}, 500
