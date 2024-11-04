from flask_restful import Resource, reqparse
from datetime import datetime, timedelta
import boto3
import json
import yfinance as yf
from gnews import GNews
from newsapi import NewsApiClient
from http import HTTPStatus
import sys
import os
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.fundamental_analysis_service import analyze_stock

class SentimentAnalysisResource(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('ticker', type=str, required=True,
            help='No stock ticker provided')
        self.reqparse.add_argument('company_name', type=str, required=True,
            help='No company name provided')
        
        self.logger = logging.getLogger(__name__)
        self.news_client = NewsApiClient(api_key='ac0478e4a76c41a0aa3f286dbdb73c01')
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-west-2'
        )

    def get_yahoo_news(self, ticker):
        """Get news from Yahoo Finance"""
        try:
            stock = yf.Ticker(ticker)
            news = stock.news
            self.logger.info(f"Retrieved {len(news)} articles from Yahoo Finance")
            return [{
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'source': 'Yahoo Finance',
                'published': datetime.fromtimestamp(article.get('providerPublishTime', 0)).isoformat(),
                'url': article.get('link', '')
            } for article in news]
        except Exception as e:
            self.logger.error(f"Error fetching Yahoo news: {str(e)}")
            return []

    def get_newsapi_articles(self, company_name, ticker):
        """Get news from NewsAPI"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            query = f"({company_name} OR {ticker}) AND (stock OR market OR earnings OR financial)"
            news_results = self.news_client.get_everything(
                q=query,
                language='en',
                sort_by='relevancy',
                from_param=start_date.strftime('%Y-%m-%d'),
                to=end_date.strftime('%Y-%m-%d'),
                page_size=20
            )
            
            articles = news_results.get('articles', [])
            self.logger.info(f"Retrieved {len(articles)} articles from NewsAPI")
            
            return [{
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'source': article.get('source', {}).get('name', 'NewsAPI'),
                'published': article.get('publishedAt', ''),
                'url': article.get('url', '')
            } for article in articles]
        except Exception as e:
            self.logger.error(f"Error fetching NewsAPI articles: {str(e)}")
            return []

    def get_gnews(self, company_name, ticker):
        """Get news from GNews"""
        try:
            gnews_client = GNews(language='en', country='US', max_results=20)
            query = f"({company_name} OR {ticker}) AND (stock OR market OR earnings)"
            articles = gnews_client.get_news(query)
            
            self.logger.info(f"Retrieved {len(articles)} articles from GNews")
            return [{
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'source': article.get('publisher', {}).get('name', 'GNews'),
                'published': article.get('published date', ''),
                'url': article.get('url', '')
            } for article in articles]
        except Exception as e:
            self.logger.error(f"Error fetching GNews articles: {str(e)}")
            return []

    def get_claude_sentiment(self, prompt):
        """Get sentiment analysis from Claude"""
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.5
        })
        
        try:
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',
                body=body
            )
            response_body = json.loads(response['body'].read())
            response_text = response_body['content'][0]['text']
            
            # Verify JSON structure
            try:
                return json.loads(response_text)
            except json.JSONDecodeError as e:
                self.logger.error(f"Invalid JSON in response: {e}")
                # Attempt to fix common JSON issues
                cleaned_text = response_text.strip()
                if cleaned_text.endswith(','):
                    cleaned_text = cleaned_text[:-1]
                if not cleaned_text.endswith('}'):
                    cleaned_text += '}'
                return json.loads(cleaned_text)
                
        except Exception as e:
            self.logger.error(f"Error in Claude API call: {str(e)}")
            return None
    
    def create_analysis_prompt(self, all_news, financial_data):
        """Create enhanced analysis prompt incorporating all news sources"""
        prompt = """You are a senior financial analyst. Analyze the news sentiment and financial metrics to provide a concise investment recommendation.
        
        Required format (use exact JSON structure):
        {
            "sentiment": {
                "news_sentiment": "POSITIVE/NEGATIVE/NEUTRAL",
                "financial_sentiment": "POSITIVE/NEGATIVE/NEUTRAL",
                "overall_recommendation": "STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL",
                "confidence": 0-100
            },
            "summary": "One sentence summary",
            "news_analysis": {
                "key_points": ["Point 1", "Point 2", "Point 3"],
                "trending_topics": ["Topic 1", "Topic 2"],
                "sentiment_by_source": {
                    "yahoo_finance": "POSITIVE/NEGATIVE/NEUTRAL",
                    "newsapi": "POSITIVE/NEGATIVE/NEUTRAL",
                    "gnews": "POSITIVE/NEGATIVE/NEUTRAL"
                }
            },
            "financial_analysis": {
                "strengths": ["Strength 1", "Strength 2"],
                "weaknesses": ["Weakness 1", "Weakness 2"],
                "key_metrics_summary": "Brief metrics analysis"
            },
            "risk_assessment": {
                "risk_level": "HIGH/MEDIUM/LOW",
                "key_risks": ["Risk 1", "Risk 2"]
            }
        }
        
        RECENT NEWS:
        """
        
        # Add categorized news
        for source, articles in all_news.items():
            if articles:
                prompt += f"\n\n{source.upper()} (Last {len(articles)} articles):\n"
                for article in articles[:5]:  # Limit to top 5 most recent/relevant
                    prompt += f"- Title: {article['title']}\n"
                    prompt += f"  Summary: {article['description']}\n"
                    prompt += f"  Published: {article['published']}\n"
        
        # Add financial metrics
        prompt += "\n\nFINANCIAL METRICS:\n"
        market_metrics = financial_data['market_metrics']['current']
        key_metrics = {
            'market_cap': market_metrics.get('market_cap'),
            'pe_ratio': market_metrics.get('pe_ratio'),
            'price_to_book': market_metrics.get('price_to_book'),
            'dividend_yield': market_metrics.get('dividend_yield'),
            'beta': market_metrics.get('beta')
        }
        prompt += json.dumps(key_metrics, indent=2)
        
        return prompt

    def create_financial_sentiment_prompt(self, financial_data):
        """Create prompt for financial metrics analysis"""
        prompt = """You are a senior financial analyst. Analyze these financial metrics and provide a detailed sentiment analysis.
        
        Required format (use exact JSON structure):
        {
            "financial_sentiment": {
                "overall": "POSITIVE/NEGATIVE/NEUTRAL",
                "confidence": 0-100,
                "assessment": {
                    "market_position": "STRONG/MODERATE/WEAK",
                    "growth_outlook": "POSITIVE/NEGATIVE/NEUTRAL",
                    "financial_health": "STRONG/MODERATE/WEAK"
                },
                "key_strengths": ["Strength 1", "Strength 2"],
                "key_concerns": ["Concern 1", "Concern 2"],
                "recommendation": "STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL"
            }
        }

        FINANCIAL METRICS:
        """
        
        metrics = {
            'market_metrics': financial_data['market_metrics'],
            'growth_metrics': financial_data['growth_metrics'],
            'profitability_metrics': financial_data['profitability_metrics'],
            'efficiency_metrics': financial_data['efficiency_metrics']
        }
        prompt += json.dumps(metrics, indent=2)
        
        return prompt

    def create_news_sentiment_prompt(self, all_news):
        """Create prompt for news sentiment analysis"""
        prompt = """You are a senior financial analyst. Analyze these news articles and provide a detailed sentiment analysis.
        
        Required format (use exact JSON structure):
        {
            "news_sentiment": {
                "overall": "POSITIVE/NEGATIVE/NEUTRAL",
                "confidence": 0-100,
                "source_analysis": {
                    "yahoo_finance": "POSITIVE/NEGATIVE/NEUTRAL",
                    "newsapi": "POSITIVE/NEGATIVE/NEUTRAL",
                    "gnews": "POSITIVE/NEGATIVE/NEUTRAL"
                },
                "key_topics": ["Topic 1", "Topic 2"],
                "market_perception": "BULLISH/BEARISH/NEUTRAL",
                "notable_events": ["Event 1", "Event 2"]
            }
        }

        RECENT NEWS:
        """
        
        for source, articles in all_news.items():
            if articles:
                prompt += f"\n\n{source.upper()} (Last {len(articles)} articles):\n"
                for article in articles[:5]:
                    prompt += f"- Title: {article['title']}\n"
                    prompt += f"  Summary: {article['description']}\n"
                    prompt += f"  Published: {article['published']}\n"
        
        return prompt

    def create_combined_sentiment(self, financial_sentiment, news_sentiment):
        """Combine both sentiments into final recommendation"""
        prompt = """Based on the following financial and news sentiment analyses, provide a final combined recommendation.
        
        Required format (use exact JSON structure):
        {
            "combined_sentiment": {
                "overall_recommendation": "STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL",
                "confidence": 0-100,
                "summary": "One sentence summary",
                "risk_assessment": {
                    "risk_level": "HIGH/MEDIUM/LOW",
                    "key_risks": ["Risk 1", "Risk 2"]
                }
            }
        }

        ANALYSES:
        """
        
        analyses = {
            "financial_sentiment": financial_sentiment,
            "news_sentiment": news_sentiment
        }
        prompt += json.dumps(analyses, indent=2)
        
        return prompt

    def get_top_articles(self, all_news, limit=5):
        """Get top articles across all sources"""
        all_articles = []
        
        for source, articles in all_news.items():
            for article in articles:
                all_articles.append({
                    'source': source,
                    'title': article['title'],
                    'url': article['url'],
                    'published': article['published']
                })
        
        # Sort by published date (most recent first)
        sorted_articles = sorted(
            all_articles,
            key=lambda x: x['published'],
            reverse=True
        )
        
        return sorted_articles[:limit]

    def post(self):
        args = self.reqparse.parse_args()
        ticker = args['ticker']
        company_name = args['company_name']
        
        try:
            # Get financial analysis
            financial_data = analyze_stock(ticker)
            if financial_data.get('error'):
                return {
                    'error': 'Failed to get financial analysis',
                    'details': financial_data.get('message')
                }, HTTPStatus.INTERNAL_SERVER_ERROR
            
            # Fetch news from all sources
            all_news = {
                'yahoo_finance': self.get_yahoo_news(ticker),
                'newsapi': self.get_newsapi_articles(company_name, ticker),
                'gnews': self.get_gnews(company_name, ticker)
            }
            
            # Get top articles
            top_articles = self.get_top_articles(all_news)
            
            # Get separate sentiment analyses
            financial_prompt = self.create_financial_sentiment_prompt(financial_data)
            news_prompt = self.create_news_sentiment_prompt(all_news)
            
            financial_sentiment = self.get_claude_sentiment(financial_prompt)
            news_sentiment = self.get_claude_sentiment(news_prompt)
            
            # Get combined sentiment
            combined_prompt = self.create_combined_sentiment(
                financial_sentiment.get('financial_sentiment'),
                news_sentiment.get('news_sentiment')
            )
            combined_sentiment = self.get_claude_sentiment(combined_prompt)
            
            if not all([financial_sentiment, news_sentiment, combined_sentiment]):
                return {
                    'error': 'Failed to get complete sentiment analysis'
                }, HTTPStatus.INTERNAL_SERVER_ERROR
            
            # Return comprehensive analysis
            return {
                'status': 'success',
                'data': {
                    'ticker': ticker,
                    'company_name': company_name,
                    'timestamp': datetime.now().isoformat(),
                    'company_info': financial_data['company_info'],
                    'market_metrics': financial_data['market_metrics'],
                    'fundamental_metrics': {
                        'growth': financial_data['growth_metrics'],
                        'profitability': financial_data['profitability_metrics'],
                        'efficiency': financial_data['efficiency_metrics']
                    },
                    'news_sources': {
                        'yahoo_finance': len(all_news['yahoo_finance']),
                        'newsapi': len(all_news['newsapi']),
                        'gnews': len(all_news['gnews'])
                    },
                    'recent_articles': [{
                        'source': article['source'],
                        'title': article['title'],
                        'url': article['url'],
                        'published': article['published']
                    } for article in top_articles],
                    'sentiment_analysis': {
                        'financial_sentiment': financial_sentiment['financial_sentiment'],
                        'news_sentiment': news_sentiment['news_sentiment'],
                        'combined_analysis': combined_sentiment['combined_sentiment']
                    }
                }
            }, HTTPStatus.OK
            
        except Exception as e:
            self.logger.error(f"Error occurred: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }, HTTPStatus.INTERNAL_SERVER_ERROR


# from flask_restful import Resource, reqparse
# from datetime import datetime
# import boto3
# import json
# import yfinance as yf
# from gnews import GNews
# from newsapi import NewsApiClient
# from http import HTTPStatus
# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# from services.fundamental_analysis_service import analyze_stock

# class SentimentAnalysisResource(Resource):
#     def __init__(self):
#         self.reqparse = reqparse.RequestParser()
#         self.reqparse.add_argument('ticker', type=str, required=True,
#             help='No stock ticker provided')
#         self.reqparse.add_argument('company_name', type=str, required=True,
#             help='No company name provided')
        
#         self.news_client = NewsApiClient(api_key='ac0478e4a76c41a0aa3f286dbdb73c01')
#         self.bedrock = boto3.client(
#             service_name='bedrock-runtime',
#             region_name='us-west-2'
#         )

#     def get_yahoo_news(self, ticker):
#         try:
#             stock = yf.Ticker(ticker)
#             return stock.news
#         except Exception as e:
#             return []

#     def get_newsapi_articles(self, company_name):
#         try:
#             end_date = datetime.now()
#             start_date = end_date - timedelta(days=30)
            
#             query = f"{company_name} finance OR {company_name} stock OR {company_name} business"
#             news_results = self.news_client.get_everything(
#                 q=query,
#                 language='en',
#                 sort_by='relevancy',
#                 from_param=start_date.strftime('%Y-%m-%d'),
#                 to=end_date.strftime('%Y-%m-%d'),
#                 page_size=20
#             )
#             print("NnnnnnnnnnnnnnnnnnnnEEEEEEEEEEEEEEEEEEWWWWWWWWSSSSSSS", news_results)
#             return news_results.get('articles', [])
#         except Exception as e:
#             return []

#     def get_gnews(self, company_name):
#         try:
#             gnews_client = GNews(language='en', country='US', max_results=25)
#             query = f"{company_name} AND (stock OR shares)"
#             return gnews_client.get_news(query)
#         except Exception as e:
#             return []

#     def get_claude_sentiment(self, prompt):
#             body = json.dumps({
#                 "anthropic_version": "bedrock-2023-05-31",
#                 "max_tokens": 2000,  # Increased from 1000 to 2000
#                 "messages": [
#                     {
#                         "role": "user",
#                         "content": prompt
#                     }
#                 ],
#                 "temperature": 0.5
#             })
            
#             try:
#                 response = self.bedrock.invoke_model(
#                     modelId='anthropic.claude-3-sonnet-20240229-v1:0',
#                     body=body
#                 )
#                 response_body = json.loads(response['body'].read())
#                 response_text = response_body['content'][0]['text']
                
#                 # Add error checking and logging
#                 print("Raw response:", response_text)
                
#                 # Verify JSON structure before returning
#                 try:
#                     json.loads(response_text)
#                     return response_text
#                 except json.JSONDecodeError as e:
#                     print(f"Invalid JSON in response: {e}")
#                     print("Attempting to fix truncated response...")
                    
#                     # Try to fix common truncation issues
#                     if response_text.strip().endswith(','):
#                         response_text = response_text.strip()[:-1]
#                     if not response_text.strip().endswith('}'):
#                         response_text += '"}}'
                    
#                     # Verify fixed JSON
#                     json.loads(response_text)
#                     return response_text
                    
#             except Exception as e:
#                 print(f"Error in Claude API call: {str(e)}")
#                 return None
    
#     def create_analysis_prompt(self, yahoo_news, newsapi_articles, gnews_articles, financial_data):
#         prompt = """You are a senior financial analyst. Analyze the news sentiment and financial metrics to provide a concise investment recommendation.
        
#         Required format (use exact JSON structure, keep responses brief):
#         {
#             "sentiment": {
#                 "news_sentiment": "POSITIVE/NEGATIVE/NEUTRAL",
#                 "financial_sentiment": "POSITIVE/NEGATIVE/NEUTRAL",
#                 "overall_recommendation": "STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL",
#                 "confidence": 0-100
#             },
#             "summary": "One sentence summary",
#             "news_analysis": {
#                 "key_points": ["Point 1", "Point 2", "Point 3"],
#                 "key_sources": [
#                     {
#                         "title": "Title",
#                         "url": "URL",
#                         "relevance": "Brief explanation"
#                     }
#                 ]
#             },
#             "financial_analysis": {
#                 "strengths": ["Strength 1", "Strength 2"],
#                 "weaknesses": ["Weakness 1", "Weakness 2"],
#                 "key_metrics_summary": "Brief metrics analysis"
#             },
#             "market_outlook": {
#                 "technical_indicators": "BULLISH/BEARISH/NEUTRAL",
#                 "fundamental_indicators": "BULLISH/BEARISH/NEUTRAL",
#                 "short_term_outlook": "Brief analysis",
#                 "long_term_outlook": "Brief analysis"
#             },
#             "risk_assessment": {
#                 "risk_level": "HIGH/MEDIUM/LOW",
#                 "key_risks": ["Risk 1", "Risk 2"]
#             }
#         }
        
#         FINANCIAL METRICS:
#         """
        
#         # Add financial metrics more concisely
#         prompt += f"\nMarket Metrics (key items only):\n"
#         market_metrics = financial_data['market_metrics']['current']
#         key_market_metrics = {
#             'market_cap': market_metrics.get('market_cap'),
#             'pe_ratio': market_metrics.get('pe_ratio'),
#             'price_to_book': market_metrics.get('price_to_book'),
#             'dividend_yield': market_metrics.get('dividend_yield'),
#             'beta': market_metrics.get('beta')
#         }
#         prompt += json.dumps(key_market_metrics, indent=2)
        
#         # Add only the most recent metrics for growth, profitability, and efficiency
#         for metric_type in ['growth_metrics', 'profitability_metrics', 'efficiency_metrics']:
#             if financial_data[metric_type].get('metrics'):
#                 prompt += f"\n\nRecent {metric_type}:\n"
#                 metrics_summary = {}
#                 for metric, values in financial_data[metric_type]['metrics'].items():
#                     if values and len(values) > 0:
#                         metrics_summary[metric] = values[0].get('value')
#                 prompt += json.dumps(metrics_summary, indent=2)
        
#         # Add news sources more concisely
#         prompt += "\nRECENT NEWS HEADLINES:"
        
#         # Only include the most recent and relevant news
#         if yahoo_news:
#             prompt += "\nYAHOO FINANCE (top 3):\n"
#             for article in yahoo_news[:10]:
#                 prompt += f"- {article['title']}\n"
        
#         if newsapi_articles:
#             prompt += "\nNEWSAPI (top 3):\n"
#             for article in newsapi_articles[:10]:
#                 prompt += f"- {article['title']}\n"
        
#         if gnews_articles:
#             prompt += "\nGNEWS (top 3):\n"
#             for article in gnews_articles[:10]:
#                 prompt += f"- {article['title']}\n"
        
#         return prompt

#     def post(self):
#         args = self.reqparse.parse_args()
#         ticker = args['ticker']
#         company_name = args['company_name']
        
#         try:
#             # Get financial analysis
#             financial_data = analyze_stock(ticker)
#             print(financial_data)
#             if financial_data.get('error'):
#                 return {
#                     'error': 'Failed to get financial analysis',
#                     'details': financial_data.get('message')
#                 }, HTTPStatus.INTERNAL_SERVER_ERROR
            
#             # Fetch news from all sources
#             yahoo_news = self.get_yahoo_news(ticker)
#             newsapi_articles = self.get_newsapi_articles(company_name)
#             gnews_articles = self.get_gnews(company_name)
            
#             # Create enhanced analysis prompt
#             prompt = self.create_analysis_prompt(
#                 yahoo_news, 
#                 newsapi_articles, 
#                 gnews_articles,
#                 financial_data
#             )
            
#             # Get sentiment analysis
#             sentiment_response = self.get_claude_sentiment(prompt)
            
#             if not sentiment_response:
#                 return {
#                     'error': 'Failed to get sentiment analysis'
#                 }, HTTPStatus.INTERNAL_SERVER_ERROR
            
#             try:
#                 print(sentiment_response)
#                 sentiment_data = json.loads(sentiment_response)
#             except json.JSONDecodeError:
#                 return {
#                     'error': 'Invalid sentiment analysis response format'
#                 }, HTTPStatus.INTERNAL_SERVER_ERROR
            
#             # Return the comprehensive analysis
#             return {
#                 'status': 'success',
#                 'data': {
#                     'ticker': ticker,
#                     'company_name': company_name,
#                     'timestamp': datetime.now().isoformat(),
#                     'company_info': financial_data['company_info'],
#                     'market_metrics': financial_data['market_metrics'],
#                     'fundamental_metrics': {
#                         'growth': financial_data['growth_metrics'],
#                         'profitability': financial_data['profitability_metrics'],
#                         'efficiency': financial_data['efficiency_metrics']
#                     },
#                     'sentiment_analysis': sentiment_data,
#                     'sources': {
#                         'yahoo_count': len(yahoo_news),
#                         'newsapi_count': len(newsapi_articles),
#                         'gnews_count': len(gnews_articles)
#                     }
#                 }
#             }, HTTPStatus.OK
            
#         except Exception as e:
#             print(f"Error occurred: {str(e)}")
#             return {
#                 'status': 'error',
#                 'message': str(e)
#             }, HTTPStatus.INTERNAL_SERVER_ERROR


# from flask_restful import Resource, reqparse
# from datetime import datetime, timedelta
# from http import HTTPStatus
# import boto3
# import json
# import yfinance as yf
# from gnews import GNews
# from newsapi import NewsApiClient
# import logging
# import pandas as pd
# from typing import Dict, List, Any, Optional
# import numpy as np

# class SentimentAnalysisResource(Resource):
#     def __init__(self):
#         self.reqparse = reqparse.RequestParser()
#         self.reqparse.add_argument('ticker', type=str, required=True,
#             help='No stock ticker provided')
#         self.reqparse.add_argument('company_name', type=str, required=True,
#             help='No company name provided')
        
#         logging.basicConfig(level=logging.INFO)
#         self.logger = logging.getLogger(__name__)
        
#         try:
#             self.news_client = NewsApiClient(api_key='YOUR_NEWS_API_KEY')
#             self.bedrock = boto3.client(
#                 service_name='bedrock-runtime',
#                 region_name='us-west-2'
#             )
#         except Exception as e:
#             self.logger.error(f"Failed to initialize clients: {str(e)}")
#             raise

#     def calculate_financial_metrics(self, financial_data: Dict) -> Dict[str, float]:
#         """Calculate key financial metrics from Yahoo Finance data"""
#         metrics = {}
        
#         try:
#             # Profitability metrics
#             if 'financials' in financial_data:
#                 financials = pd.DataFrame(financial_data['financials'])
#                 metrics['gross_margin'] = (financials['Total Revenue'].iloc[0] - 
#                                          financials['Cost of Revenue'].iloc[0]) / financials['Total Revenue'].iloc[0]
#                 metrics['operating_margin'] = financials['Operating Income'].iloc[0] / financials['Total Revenue'].iloc[0]
                
#             # Liquidity metrics
#             if 'balance_sheet' in financial_data:
#                 balance = pd.DataFrame(financial_data['balance_sheet'])
#                 metrics['current_ratio'] = balance['Total Current Assets'].iloc[0] / balance['Total Current Liabilities'].iloc[0]
#                 metrics['quick_ratio'] = (balance['Total Current Assets'].iloc[0] - 
#                                         balance['Inventory'].iloc[0]) / balance['Total Current Liabilities'].iloc[0]
                
#             # Cash flow metrics
#             if 'cashflow' in financial_data:
#                 cashflow = pd.DataFrame(financial_data['cashflow'])
#                 metrics['operating_cash_ratio'] = cashflow['Operating Cash Flow'].iloc[0] / balance['Total Current Liabilities'].iloc[0]
                
#             # Growth metrics
#             if len(financials) >= 4:
#                 revenue_growth = (financials['Total Revenue'].iloc[0] - 
#                                 financials['Total Revenue'].iloc[3]) / financials['Total Revenue'].iloc[3]
#                 metrics['annual_revenue_growth'] = revenue_growth
                
#         except Exception as e:
#             self.logger.error(f"Error calculating financial metrics: {str(e)}")
            
#         return metrics

#     def analyze_annual_report_sentiment(self, financial_data: Dict) -> Dict[str, Any]:
#         """Extract and analyze text from financial statements for sentiment"""
#         try:
#             # Create a comprehensive prompt for financial analysis
#             financial_summary = f"""
#             Revenue: {financial_data['financials'].get('Total Revenue', {}).get(list(financial_data['financials']['Total Revenue'].keys())[0], 'N/A')}
#             Operating Income: {financial_data['financials'].get('Operating Income', {}).get(list(financial_data['financials']['Operating Income'].keys())[0], 'N/A')}
#             Net Income: {financial_data['financials'].get('Net Income', {}).get(list(financial_data['financials']['Net Income'].keys())[0], 'N/A')}
#             """
            
#             prompt = f"""Analyze the following financial data and provide a sentiment analysis focused on:
#             1. Financial health
#             2. Growth prospects
#             3. Risk factors
#             4. Management effectiveness
            
#             Financial Summary:
#             {financial_summary}
            
#             Provide your analysis in JSON format with the following structure:
#             {{
#                 "sentiment": "positive/neutral/negative",
#                 "confidence": 0-100,
#                 "key_findings": [],
#                 "risk_assessment": [],
#                 "opportunities": []
#             }}
#             """
            
#             return json.loads(self.get_claude_sentiment(prompt))
            
#         except Exception as e:
#             self.logger.error(f"Error analyzing annual report sentiment: {str(e)}")
#             return {}

#     def get_technical_indicators(self, ticker: str) -> Dict[str, float]:
#         """Calculate technical indicators from Yahoo Finance data"""
#         try:
#             stock = yf.Ticker(ticker)
#             hist = stock.history(period="1y")
            
#             # Calculate technical indicators
#             indicators = {
#                 'sma_50': hist['Close'].rolling(window=50).mean().iloc[-1],
#                 'sma_200': hist['Close'].rolling(window=200).mean().iloc[-1],
#                 'rsi': self.calculate_rsi(hist['Close']),
#                 'volatility': hist['Close'].pct_change().std() * np.sqrt(252),  # Annualized volatility
#                 'beta': self.calculate_beta(hist['Close']),
#             }
            
#             return indicators
            
#         except Exception as e:
#             self.logger.error(f"Error calculating technical indicators: {str(e)}")
#             return {}

#     def calculate_rsi(self, prices: pd.Series, periods: int = 14) -> float:
#         """Calculate Relative Strength Index"""
#         delta = prices.diff()
#         gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
#         loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
#         rs = gain / loss
#         return 100 - (100 / (1 + rs.iloc[-1]))

#     def calculate_beta(self, prices: pd.Series) -> float:
#         """Calculate beta against market (S&P 500)"""
#         spy = yf.download('^GSPC', start=prices.index[0], end=prices.index[-1])['Close']
#         returns = prices.pct_change()
#         market_returns = spy.pct_change()
#         covariance = returns.cov(market_returns)
#         market_variance = market_returns.var()
#         return covariance / market_variance

#     def combine_analyses(self, 
#                         news_sentiment: Dict, 
#                         financial_metrics: Dict,
#                         annual_report_sentiment: Dict,
#                         technical_indicators: Dict) -> Dict:
#         """Combine all analyses into a comprehensive report"""
#         return {
#             'timestamp': datetime.now().isoformat(),
#             'overall_sentiment': {
#                 'score': self.calculate_composite_sentiment(
#                     news_sentiment,
#                     financial_metrics,
#                     annual_report_sentiment
#                 ),
#                 'components': {
#                     'news': news_sentiment.get('sentiment'),
#                     'financials': self.interpret_financial_health(financial_metrics),
#                     'annual_report': annual_report_sentiment.get('sentiment')
#                 }
#             },
#             'metrics': {
#                 'financial': financial_metrics,
#                 'technical': technical_indicators
#             },
#             'detailed_analysis': {
#                 'news_summary': news_sentiment.get('summary'),
#                 'financial_health': annual_report_sentiment.get('key_findings'),
#                 'risk_factors': annual_report_sentiment.get('risk_assessment'),
#                 'technical_outlook': self.interpret_technical_indicators(technical_indicators)
#             }
#         }

#     def calculate_composite_sentiment(self, 
#                                    news_sentiment: Dict, 
#                                    financial_metrics: Dict,
#                                    annual_report_sentiment: Dict) -> float:
#         """Calculate a weighted composite sentiment score"""
#         try:
#             # Convert sentiments to numerical scores (-1 to 1)
#             news_score = self.sentiment_to_score(news_sentiment.get('sentiment', 'neutral'))
#             financial_score = self.calculate_financial_score(financial_metrics)
#             annual_report_score = self.sentiment_to_score(annual_report_sentiment.get('sentiment', 'neutral'))
            
#             # Apply weights (adjust as needed)
#             weights = {
#                 'news': 0.3,
#                 'financial': 0.4,
#                 'annual_report': 0.3
#             }
            
#             composite_score = (
#                 news_score * weights['news'] +
#                 financial_score * weights['financial'] +
#                 annual_report_score * weights['annual_report']
#             )
            
#             return round(composite_score, 2)
            
#         except Exception as e:
#             self.logger.error(f"Error calculating composite sentiment: {str(e)}")
#             return 0.0

#     def post(self):
#         args = self.reqparse.parse_args()
#         ticker = args['ticker']
#         company_name = args['company_name']
        
#         try:
#             # Fetch all required data
#             stock = yf.Ticker(ticker)
#             financial_data = {
#                 'info': stock.info,
#                 'financials': stock.financials.to_dict(),
#                 'balance_sheet': stock.balance_sheet.to_dict(),
#                 'cashflow': stock.cashflow.to_dict(),
#                 'income_stmt': stock.income_stmt.to_dict(),
#                 'recommendations': stock.recommendations.to_dict() if hasattr(stock, 'recommendations') else {},
#             }
            
#             # Perform various analyses
#             news_sentiment = self.analyze_news_sentiment(ticker, company_name)
#             financial_metrics = self.calculate_financial_metrics(financial_data)
#             annual_report_sentiment = self.analyze_annual_report_sentiment(financial_data)
#             technical_indicators = self.get_technical_indicators(ticker)
            
#             # Combine all analyses
#             comprehensive_analysis = self.combine_analyses(
#                 news_sentiment,
#                 financial_metrics,
#                 annual_report_sentiment,
#                 technical_indicators
#             )
            
#             return {
#                 'status': 'success',
#                 'data': comprehensive_analysis
#             }, HTTPStatus.OK
            
#         except Exception as e:
#             self.logger.error(f"Error in analysis: {str(e)}")
#             return {
#                 'status': 'error',
#                 'message': str(e)
#             }, HTTPStatus.INTERNAL_SERVER_ERROR


# from flask_restful import Resource, reqparse
# from datetime import datetime, timedelta
# from http import HTTPStatus
# import boto3
# import json
# import yfinance as yf
# from gnews import GNews
# from newsapi import NewsApiClient
# import logging
# import pandas as pd
# from typing import Dict, List, Any, Optional
# import numpy as np

# class SentimentAnalysisResource(Resource):
#     def __init__(self):
#         self.reqparse = reqparse.RequestParser()
#         self.reqparse.add_argument('ticker', type=str, required=True,
#             help='No stock ticker provided')
#         self.reqparse.add_argument('company_name', type=str, required=True,
#             help='No company name provided')
        
#         logging.basicConfig(level=logging.INFO)
#         self.logger = logging.getLogger(__name__)
        
#         try:
#             self.news_client = NewsApiClient(api_key='ac0478e4a76c41a0aa3f286dbdb73c01')
#             self.bedrock = boto3.client(
#                 service_name='bedrock-runtime',
#                 region_name='us-west-2'
#             )
#         except Exception as e:
#             self.logger.error(f"Failed to initialize clients: {str(e)}")
#             raise

#     def calculate_financial_metrics(self, financial_data: Dict) -> Dict[str, float]:
#         """Calculate key financial metrics from Yahoo Finance data"""
#         metrics = {}
        
#         try:
#             # Profitability metrics
#             if 'financials' in financial_data:
#                 financials = pd.DataFrame(financial_data['financials'])
#                 metrics['gross_margin'] = (financials['Total Revenue'].iloc[0] - 
#                                          financials['Cost of Revenue'].iloc[0]) / financials['Total Revenue'].iloc[0]
#                 metrics['operating_margin'] = financials['Operating Income'].iloc[0] / financials['Total Revenue'].iloc[0]
                
#             # Liquidity metrics
#             if 'balance_sheet' in financial_data:
#                 balance = pd.DataFrame(financial_data['balance_sheet'])
#                 metrics['current_ratio'] = balance['Total Current Assets'].iloc[0] / balance['Total Current Liabilities'].iloc[0]
#                 metrics['quick_ratio'] = (balance['Total Current Assets'].iloc[0] - 
#                                         balance['Inventory'].iloc[0]) / balance['Total Current Liabilities'].iloc[0]
                
#             # Cash flow metrics
#             if 'cashflow' in financial_data:
#                 cashflow = pd.DataFrame(financial_data['cashflow'])
#                 metrics['operating_cash_ratio'] = cashflow['Operating Cash Flow'].iloc[0] / balance['Total Current Liabilities'].iloc[0]
                
#             # Growth metrics
#             if len(financials) >= 4:
#                 revenue_growth = (financials['Total Revenue'].iloc[0] - 
#                                 financials['Total Revenue'].iloc[3]) / financials['Total Revenue'].iloc[3]
#                 metrics['annual_revenue_growth'] = revenue_growth
                
#         except Exception as e:
#             self.logger.error(f"Error calculating financial metrics: {str(e)}")
            
#         return metrics

#     def analyze_news_sentiment(self, ticker: str, company_name: str) -> Dict[str, Any]:
#         """
#         Analyze news sentiment for a given company using multiple news sources
        
#         Args:
#             ticker (str): Stock ticker symbol
#             company_name (str): Full company name
            
#         Returns:
#             Dict containing sentiment analysis results and news summary
#         """
#         try:
#             # Fetch news from NewsAPI
#             newsapi_articles = self.news_client.get_everything(
#                 q=f'({ticker} OR "{company_name}") AND (stock OR shares OR earnings)',
#                 language='en',
#                 sort_by='relevancy',
#                 from_param=(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
#                 page_size=20
#             )
            
#             # Fetch news from GNews as backup
#             google_news = GNews(language='en', country='US', period='7d', max_results=10)
#             gnews_articles = google_news.get_news(f'{company_name} stock')
            
#             # Combine and format articles
#             all_articles = []
            
#             # Process NewsAPI articles
#             for article in newsapi_articles.get('articles', []):
#                 all_articles.append({
#                     'title': article.get('title', ''),
#                     'description': article.get('description', ''),
#                     'source': article.get('source', {}).get('name', ''),
#                     'published': article.get('publishedAt', '')
#                 })
                
#             # Process GNews articles
#             for article in gnews_articles:
#                 all_articles.append({
#                     'title': article.get('title', ''),
#                     'description': article.get('description', ''),
#                     'source': article.get('publisher', {}).get('name', ''),
#                     'published': article.get('published date', '')
#                 })
            
#             # Create a prompt for sentiment analysis
#             articles_text = "\n".join([
#                 f"Title: {article['title']}\nDescription: {article['description']}"
#                 for article in all_articles[:10]  # Analyze top 10 articles
#             ])
            
#             prompt = f"""Analyze the sentiment of these news articles about {company_name} ({ticker}):
    
#             {articles_text}
    
#             Provide your analysis in JSON format with the following structure:
#             {{
#                 "sentiment": "positive/neutral/negative",
#                 "confidence": 0-100,
#                 "summary": "Brief summary of key points",
#                 "key_topics": [],
#                 "article_count": number_of_articles_analyzed
#             }}
#             """
            
#             # Get sentiment analysis from Claude
#             sentiment_analysis = json.loads(self.get_claude_sentiment(prompt))
            
#             # Add metadata
#             sentiment_analysis['analyzed_period'] = '30 days'
#             sentiment_analysis['sources'] = list(set(article['source'] for article in all_articles))
#             sentiment_analysis['last_updated'] = datetime.now().isoformat()
            
#             return sentiment_analysis
            
#         except Exception as e:
#             self.logger.error(f"Error analyzing news sentiment: {str(e)}")
#             return {
#                 'sentiment': 'neutral',
#                 'confidence': 0,
#                 'summary': f"Error analyzing sentiment: {str(e)}",
#                 'key_topics': [],
#                 'article_count': 0,
#                 'sources': [],
#                 'analyzed_period': '30 days',
#                 'last_updated': datetime.now().isoformat()
#             }
    
#     def get_claude_sentiment(self, prompt: str) -> str:
#         """
#         Get sentiment analysis from Claude using AWS Bedrock
        
#         Args:
#             prompt (str): Prompt for sentiment analysis
            
#         Returns:
#             str: JSON response from Claude
#         """
#         try:
#             body = json.dumps({
#                 "prompt": prompt,
#                 "max_tokens_to_sample": 1000,
#                 "temperature": 0.5,
#                 "anthropic_version": "bedrock-2023-05-31",
#                 "response_format": { "type": "json_object" }
#             })
            
#             response = self.bedrock.invoke_model(
#                 modelId='anthropic.claude-v2',
#                 body=body
#             )
            
#             response_body = json.loads(response.get('body').read())
#             return response_body.get('completion', '{}')
            
#         except Exception as e:
#             self.logger.error(f"Error getting Claude sentiment: {str(e)}")
#             return '{}'

#     def calculate_rsi(self, prices: pd.Series, periods: int = 14) -> float:
#         """Calculate Relative Strength Index"""
#         delta = prices.diff()
#         gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
#         loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
#         rs = gain / loss
#         return 100 - (100 / (1 + rs.iloc[-1]))

#     def calculate_beta(self, prices: pd.Series) -> float:
#         """Calculate beta against market (S&P 500)"""
#         spy = yf.download('^GSPC', start=prices.index[0], end=prices.index[-1])['Close']
#         returns = prices.pct_change()
#         market_returns = spy.pct_change()
#         covariance = returns.cov(market_returns)
#         market_variance = market_returns.var()
#         return covariance / market_variance

#     def combine_analyses(self, 
#                         news_sentiment: Dict, 
#                         financial_metrics: Dict,
#                         annual_report_sentiment: Dict,
#                         technical_indicators: Dict) -> Dict:
#         """Combine all analyses into a comprehensive report"""
#         return {
#             'timestamp': datetime.now().isoformat(),
#             'overall_sentiment': {
#                 'score': self.calculate_composite_sentiment(
#                     news_sentiment,
#                     financial_metrics,
#                     annual_report_sentiment
#                 ),
#                 'components': {
#                     'news': news_sentiment.get('sentiment'),
#                     'financials': self.interpret_financial_health(financial_metrics),
#                     'annual_report': annual_report_sentiment.get('sentiment')
#                 }
#             },
#             'metrics': {
#                 'financial': financial_metrics,
#                 'technical': technical_indicators
#             },
#             'detailed_analysis': {
#                 'news_summary': news_sentiment.get('summary'),
#                 'financial_health': annual_report_sentiment.get('key_findings'),
#                 'risk_factors': annual_report_sentiment.get('risk_assessment'),
#                 'technical_outlook': self.interpret_technical_indicators(technical_indicators)
#             }
#         }

#     def calculate_composite_sentiment(self, 
#                                    news_sentiment: Dict, 
#                                    financial_metrics: Dict,
#                                    annual_report_sentiment: Dict) -> float:
#         """Calculate a weighted composite sentiment score"""
#         try:
#             # Convert sentiments to numerical scores (-1 to 1)
#             news_score = self.sentiment_to_score(news_sentiment.get('sentiment', 'neutral'))
#             financial_score = self.calculate_financial_score(financial_metrics)
#             annual_report_score = self.sentiment_to_score(annual_report_sentiment.get('sentiment', 'neutral'))
            
#             # Apply weights (adjust as needed)
#             weights = {
#                 'news': 0.3,
#                 'financial': 0.4,
#                 'annual_report': 0.3
#             }
            
#             composite_score = (
#                 news_score * weights['news'] +
#                 financial_score * weights['financial'] +
#                 annual_report_score * weights['annual_report']
#             )
            
#             return round(composite_score, 2)
            
#         except Exception as e:
#             self.logger.error(f"Error calculating composite sentiment: {str(e)}")
#             return 0.0

#     def post(self):
#         args = self.reqparse.parse_args()
#         ticker = args['ticker']
#         company_name = args['company_name']
        
#         try:
#             # Fetch all required data
#             stock = yf.Ticker(ticker)
#             financial_data = {
#                 'info': stock.info,
#                 'financials': stock.financials.to_dict(),
#                 'balance_sheet': stock.balance_sheet.to_dict(),
#                 'cashflow': stock.cashflow.to_dict(),
#                 'income_stmt': stock.income_stmt.to_dict(),
#                 'recommendations': stock.recommendations.to_dict() if hasattr(stock, 'recommendations') else {},
#             }
            
#             # Perform various analyses
#             news_sentiment = self.analyze_news_sentiment(ticker, company_name)
#             financial_metrics = self.calculate_financial_metrics(financial_data)
#             annual_report_sentiment = self.analyze_annual_report_sentiment(financial_data)
#             technical_indicators = self.get_technical_indicators(ticker)
            
#             # Combine all analyses
#             comprehensive_analysis = self.combine_analyses(
#                 news_sentiment,
#                 financial_metrics,
#                 annual_report_sentiment,
#                 technical_indicators
#             )
            
#             return {
#                 'status': 'success',
#                 'data': comprehensive_analysis
#             }, HTTPStatus.OK
            
#         except Exception as e:
#             self.logger.error(f"Error in analysis: {str(e)}")
#             return {
#                 'status': 'error',
#                 'message': str(e)
#             }, HTTPStatus.INTERNAL_SERVER_ERROR