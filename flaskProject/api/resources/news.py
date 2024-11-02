# api/resources/news.py

from flask_restful import Resource, reqparse
from api.services.news_service import get_company_news

class NewsResource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('company', type=str, required=True, help="Le symbole de l'entreprise est requis", location='args')
        args = parser.parse_args()

        company_symbol = args['company']

        try:
            # Récupérer les actualités
            news_articles = get_company_news(company_symbol)

            return {'company': company_symbol, 'news': news_articles}, 200

        except Exception as e:
            return {'message': f"Erreur lors de la récupération des actualités : {str(e)}"}, 500
