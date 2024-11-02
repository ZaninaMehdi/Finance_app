# api/resources/technical_analysis.py

from flask_restful import Resource, reqparse
from api.services.historical_data_service import get_historical_data
from api.services.technical_analysis_service import calculate_technical_indicators

class TechnicalAnalysisResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        parser.add_argument('period', type=str, default="5y", help="La période pour laquelle récupérer les données", location='args')
        parser.add_argument('interval', type=str, default="1mo", help="L'intervalle des données (par défaut '1mo' pour mensuel)", location='args')
        args = parser.parse_args()

        company_symbol = args['company']
        period = args['period']
        interval = args['interval']

        try:
            # Récupérer les données historiques avec les paramètres spécifiés
            historical_data = get_historical_data(company_symbol, period=period, interval=interval)

            # Calculer les indicateurs techniques
            technical_data = calculate_technical_indicators(historical_data)

            # Convertir en liste de dictionnaires pour la réponse JSON
            technical_analysis = technical_data.to_dict(orient='records')

            return {'company': company_symbol, 'technical_analysis': technical_analysis}, 200

        except ValueError as ve:
            return {'message': str(ve)}, 400  # Erreur de requête invalide
        except Exception as e:
            return {'message': f"Erreur interne du serveur : {str(e)}"}, 500
