# api/services/finance_data_service.py

import pandas as pd
import yfinance as yf

def safe_to_dict(dataframe):
    if isinstance(dataframe, pd.DataFrame):
        # Reset index to ensure index is included as a column
        dataframe = dataframe.reset_index()
        # Convert all date columns and index columns to strings
        for column in dataframe.columns:
            if pd.api.types.is_datetime64_any_dtype(dataframe[column]):
                dataframe[column] = dataframe[column].dt.strftime('%Y-%m-%d')
        # Convert columns to strings
        dataframe.columns = dataframe.columns.map(str)
        return dataframe.to_dict(orient='records')
    else:
        return {}

def perform_analysis(ticker_symbol):
    try:
        company = yf.Ticker(ticker_symbol)

        if not company.info or 'shortName' not in company.info:
            raise ValueError(f"Le symbole '{ticker_symbol}' n'est pas valide ou les données ne sont pas disponibles.")

        data = {
            'info': company.info,
            'financials': safe_to_dict(company.financials),
            'balance_sheet': safe_to_dict(company.balance_sheet),
            'cashflow': safe_to_dict(company.cashflow),
            'earnings': safe_to_dict(company.earnings),
            'dividends': safe_to_dict(company.dividends),
            'recommendations': safe_to_dict(company.recommendations),
            'calendar': safe_to_dict(company.calendar),
            'options': list(company.options) if company.options else [],
        }

        return data

    except Exception as e:
        print(f"Erreur lors de la récupération des données pour {ticker_symbol}: {e}")
        raise e  # Relance l'exception pour qu'elle soit gérée par l'appelant
