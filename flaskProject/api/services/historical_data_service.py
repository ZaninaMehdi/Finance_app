# api/services/historical_data_service.py

import yfinance as yf

def get_historical_data(ticker_symbol, period="5y", interval="1mo"):
    """
    Récupère les données historiques de prix pour une entreprise donnée.

    Args:
        ticker_symbol (str): Le symbole boursier de l'entreprise.
        period (str): La période pour laquelle récupérer les données (par défaut "5y").
        interval (str): L'intervalle des données (par défaut "1mo" pour mensuel).

    Returns:
        pandas.DataFrame: Un DataFrame contenant les données historiques.
    """
    company = yf.Ticker(ticker_symbol)
    historical_data = company.history(period=period, interval=interval)

    if historical_data.empty:
        raise ValueError("Aucune donnée historique disponible pour cette entreprise.")

    return historical_data
