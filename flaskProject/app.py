# app.py

from flask import Flask
from flask_restful import Api
from api.resources.analysis import AnalysisResource
from api.resources.technical_analysis import TechnicalAnalysisResource
from api.resources.news import NewsResource
from api.resources.bedrock import BedrockResource  # Importer la nouvelle ressource

app = Flask(__name__)
api = Api(app)

# Configuration des routes
api.add_resource(AnalysisResource, '/api/analysis')
api.add_resource(TechnicalAnalysisResource, '/api/technical_analysis')
api.add_resource(NewsResource, '/api/news')
api.add_resource(BedrockResource, '/api/bedrock')  # Nouvelle route pour AWS Bedrock

if __name__ == '__main__':
    app.run(debug=True)
