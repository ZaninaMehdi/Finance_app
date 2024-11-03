# app.py

from flask import Flask
from flask_restful import Api
from flask_cors import CORS  # Importer Flask-CORS
from api.resources.analysis import AnalysisResource
from api.resources.technical_analysis import TechnicalAnalysisResource
from api.resources.news import NewsResource
from api.resources.bedrock import BedrockResource
import api.resources.sentiment_analysis as Sentiment

app = Flask(__name__)
CORS(app)  # Initialiser CORS pour l'application
api = Api(app)

# Configuration des routes
api.add_resource(AnalysisResource, '/api/analysis')
api.add_resource(TechnicalAnalysisResource, '/api/technical_analysis')
api.add_resource(Sentiment, '/api/sentiment_analysis')
api.add_resource(NewsResource, '/api/news')
api.add_resource(BedrockResource, '/api/bedrock')

if __name__ == '__main__':
    app.run(debug=True)
