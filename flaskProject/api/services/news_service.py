# api/services/news_service.py


import requests
from datetime import datetime, timedelta

def get_company_news(ticker_symbol):
    """
    Récupère les actualités pour une entreprise donnée sur les 3 dernières années.

    Args:
        ticker_symbol (str): Le symbole boursier de l'entreprise.

    Returns:
        list: Une liste d'articles d'actualité.
    """
    # Récupérer la clé API depuis les variables d'environnement
    api_key = 'O4dzO5DWbQ6gFbk6SAhEf8G2F1Fl0Zxl'
    if not api_key:
        raise Exception("La clé API n'est pas définie dans les variables d'environnement.")

    # Calculer les dates pour les 3 dernières années
    to_date = datetime.today().strftime('%Y-%m-%d')
    from_date = (datetime.today() - timedelta(days=5)).strftime('%Y-%m-%d')

    # Construire l'URL de l'API
    url = f'https://financialmodelingprep.com/api/v3/stock_news?tickers={ticker_symbol}&limit=1000&apikey={api_key}'

    response = requests.get(url)

    if response.status_code != 200:
        raise Exception(f"Erreur lors de la récupération des actualités : {response.status_code}")

    news_data = response.json()

    # Filtrer les actualités pour les 3 dernières années
    filtered_news = []
    for article in news_data:
        published_date = datetime.strptime(article['publishedDate'], '%Y-%m-%d %H:%M:%S')
        if from_date <= published_date.strftime('%Y-%m-%d') <= to_date:
            filtered_news.append(article)

    return filtered_news
