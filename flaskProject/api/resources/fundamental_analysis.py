# api/resources/fundamental_analysis.py

from flask_restful import Resource, reqparse
from api.services.fundamental_analysis_service import analyze_stock

class FundamentalAnalysisResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        args = parser.parse_args()

        company_symbol = args['company']

        try:
            analysis_results = analyze_stock(company_symbol)
            if 'error' in analysis_results:
                return {'message': analysis_results.get('message', 'Erreur inconnue')}, 400

            return {'company': company_symbol, 'analysis': analysis_results}, 200
        except ValueError as ve:
            return {'message': str(ve)}, 400
        except Exception as e:
            return {'message': f"Erreur interne du serveur : {str(e)}"}, 500
