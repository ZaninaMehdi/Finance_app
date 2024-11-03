from api.services.sentiment_analysis_service import get_claude_sentiment, get_yahoo_news, get_gnews, create_analysis_prompt
from flask_restful import Resource

class SentimentAnalysisResource(Resource):
    def get(self):
        # Replace the following block with the actual function code or call
        ticker = 'BCE'
        yahoo_news = get_yahoo_news(ticker)
        gnews_articles = get_gnews("Bell Canada")
        
        annual_report = """Executive Summary: BCE reported modest revenue growth of 2.1% to $24.7 billion despite declines in legacy TV and wireline services, while adjusted EBITDA rose 2.1% to $10.4 billion..."""  # Add full report here
        
        prompt = create_analysis_prompt(yahoo_news, gnews_articles, annual_report)
        sentiment = get_claude_sentiment(prompt)
        
        return {'sentiment': sentiment}
