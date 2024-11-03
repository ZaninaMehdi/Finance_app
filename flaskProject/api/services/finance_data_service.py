import warnings
import yfinance as yf
import pandas as pd

def safe_to_dict(dataframe):
    if isinstance(dataframe, pd.DataFrame):
        dataframe = dataframe.reset_index()
        for column in dataframe.columns:
            if pd.api.types.is_datetime64_any_dtype(dataframe[column]):
                dataframe[column] = dataframe[column].dt.strftime('%Y-%m-%d')
        dataframe.columns = dataframe.columns.map(str)
        return dataframe.to_dict(orient='records')
    return {}

def perform_analysis(ticker_symbol):
    try:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=DeprecationWarning, message="'Ticker.earnings' is deprecated")
            company = yf.Ticker(ticker_symbol)

        if not company.info or 'shortName' not in company.info:
            raise ValueError(f"Le symbole '{ticker_symbol}' n'est pas valide ou les données ne sont pas disponibles.")

        data = {
            'info': company.info,
            'financials': safe_to_dict(company.financials),
            'balance_sheet': safe_to_dict(company.balance_sheet),
            'cashflow': safe_to_dict(company.cashflow),
            # Remplace `earnings` si nécessaire :
            'earnings': safe_to_dict(company.income_stmt),  # ou utilisez `company.income_stmt` pour éviter `earnings`
            'dividends': safe_to_dict(company.dividends),
            'recommendations': safe_to_dict(company.recommendations),
            'calendar': safe_to_dict(company.calendar),
            'options': list(company.options) if company.options else [],
        }

        return data

    except Exception as e:
        print(f"Erreur lors de la récupération des données pour {ticker_symbol}: {e}")
        raise e
