# app.py

from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from api.resources.analysis import AnalysisResource
from api.resources.technical_analysis import TechnicalAnalysisResource
from api.resources.news import NewsResource
from api.resources.bedrock import BedrockResource
from api.resources.fundamental_analysis import FundamentalAnalysisResource  # Importer la nouvelle ressource

app = Flask(__name__)
CORS(app)
api = Api(app)

# Configuration des routes
api.add_resource(AnalysisResource, '/api/analysis')
api.add_resource(TechnicalAnalysisResource, '/api/technical_analysis')
api.add_resource(NewsResource, '/api/news')
api.add_resource(BedrockResource, '/api/bedrock')
api.add_resource(FundamentalAnalysisResource, '/api/fundamental_analysis')  # Ajouter la nouvelle route

if __name__ == '__main__':
    app.run(debug=True)
