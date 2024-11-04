# app.py

from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from api.resources.analysis import AnalysisResource
from api.resources.technical_analysis import TechnicalAnalysisResource
from api.resources.news import NewsResource
from api.resources.bedrock import BedrockResource
from api.resources.fundamental_analysis import FundamentalAnalysisResource  # Importer la nouvelle ressource
from api.resources.sentiment_analysis import SentimentAnalysisResource
from api.resources.report_summarizer import ReportSummarizerResource


app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5173"],  # Assuming your React app runs on port 3000
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})

api = Api(app)

# Configuration des routes
api.add_resource(AnalysisResource, '/api/analysis')
api.add_resource(TechnicalAnalysisResource, '/api/technical_analysis')
api.add_resource(SentimentAnalysisResource, '/api/sentiment_analysis')
api.add_resource(NewsResource, '/api/news')
api.add_resource(BedrockResource, '/api/bedrock')
api.add_resource(FundamentalAnalysisResource, '/api/fundamental_analysis')  # Ajouter la nouvelle route
api.add_resource(ReportSummarizerResource, '/api/report_summary')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    
