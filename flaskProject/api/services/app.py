from flask import Flask, render_template, request
from gnews import GNews
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    news_results = []
    if request.method == 'POST':
        company_acronym = request.form['company_acronym']

        # Set up the GNews client
        news_client = GNews(language='en', country='US', max_results=100)

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

        # Get the full article content
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        driver = webdriver.Chrome(options=chrome_options)

        for article in news_results:
            url = article['url']
            driver.get(url)
            article_text = driver.page_source
            article['content'] = article_text

        # Print the article for inspection
        print(article)

        driver.quit()

    return render_template('index.html', news_results=news_results)

if __name__ == '__main__':
    app.run(debug=True)