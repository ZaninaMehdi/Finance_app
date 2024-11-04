# app.py

from flask import Flask
from flask_restful import Api
from flask_cors import CORS  # Importer Flask-CORS
from api.resources.analysis import AnalysisResource
from api.resources.technical_analysis import TechnicalAnalysisResource
from api.resources.news import NewsResource
from api.resources.bedrock import BedrockResource
from api.resources.sentiment_analysis import SentimentAnalysisResource
from api.services.orchestrator_service import ServiceOrchestrator

app = Flask(__name__)
CORS(app)  # Initialiser CORS pour l'application
api = Api(app)

# Configuration des routes
api.add_resource(AnalysisResource, '/api/analysis')
api.add_resource(TechnicalAnalysisResource, '/api/technical_analysis')
api.add_resource(SentimentAnalysisResource, '/api/sentiment_analysis')
api.add_resource(NewsResource, '/api/news')
api.add_resource(BedrockResource, '/api/bedrock')


if __name__ == '__main__':

    company_name = 'cn'
    orchestrator = ServiceOrchestrator(company_name)

    print(orchestrator.initialize('kb_documents'))

