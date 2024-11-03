def get_yahoo_news(self, ticker):
        stock = yf.Ticker(ticker)
        return stock.news

def get_gnews(self, company_name):
        news_client = GNews(language='en', country='US', max_results=25)
        query = f"{company_name} AND (stock OR shares)"
        return news_client.get_news(query)

def create_analysis_prompt(self, yahoo_news, gnews_articles, annual_report):
        prompt = f"""You are a senior financial analyst with over 20 years of experience in stock recommendation and market analysis. 
        Based on the following information, provide a sentiment analysis for BCE (Bell Canada).
        
        Answer with either:
        "YES" (if the overall sentiment is positive)
        "NO" (if the overall sentiment is negative)
        "UNKNOWN" (if the sentiment is unclear or mixed)
        
        Then provide ONE clear and concise sentence explaining your reasoning.
        
        Here is the data to analyze:
        
        ANNUAL REPORT SUMMARY:
        {annual_report}
        
        RECENT NEWS HEADLINES:
        """
        print(prompt)
        # Add Yahoo Finance headlines
        prompt += "\nYAHOO FINANCE NEWS:\n"
        for article in yahoo_news[:5]:  # Limit to 5 most recent
            prompt += f"- {article['title']}\n"
        
        # Add GNews headlines
        prompt += "\nGNEWS ARTICLES:\n"
        for article in gnews_articles[:15]:  # Limit to 5 most recent
            prompt += f"- {article['title']}, its summary is {article['description']}\n"
        
        return prompt

def get_claude_sentiment(self, prompt):
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-west-2'  # Replace with your region
        )
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.5
        })
        
        try:
            response = bedrock.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',  # Use appropriate model ID
                body=body
            )
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
        except Exception as e:
            return f"Error getting sentiment analysis: {str(e)}"



