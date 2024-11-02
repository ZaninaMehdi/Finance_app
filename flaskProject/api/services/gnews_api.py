from gnews import GNews
from datetime import datetime, timedelta

# Set up the GNews client
news_client = GNews(language='en', country='US', max_results=100)

# Prompt the user for the company acronym
company_acronym = input("Enter the company acronym: ")

# Calculate the start date for the 3-year time range
end_date = datetime.now()
start_date = end_date - timedelta(days=3 * 365)

# Set the start and end dates
news_client.start_date = start_date
news_client.end_date = end_date

# Define the search query
query = f"{company_acronym} AND (stock OR shares)"

# Fetch the news articles
news_results = news_client.get_news(query)

# Print the article details
if news_results:
    print(f"Found {len(news_results)} news articles for {company_acronym} in the last 3 years:")
    for article in news_results:
        print(f"\nTitle: {article['title']}")
        print(f"Published: {article['published date']}")
        print(f"Source: {article['publisher']['title']}")
        print(f"URL: {article['url']}")
        print(f"Summary: {article['description']}")
else:
    print(f"No news articles found for {company_acronym} in the last 3 years.")