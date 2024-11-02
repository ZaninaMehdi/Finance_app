# api/services/technical_analysis_service.py

import pandas as pd
import pandas_ta as ta

def calculate_technical_indicators(df):
    """
    Calcule les indicateurs techniques sur les données historiques fournies.

    Args:
        df (pandas.DataFrame): Le DataFrame contenant les données historiques.

    Returns:
        pandas.DataFrame: Un DataFrame avec les indicateurs techniques ajoutés.
    """
    # S'assurer que l'index est un datetime
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    # Trier les données par date
    df = df.sort_index()

    # Supprimer les lignes avec des valeurs manquantes
    df = df.dropna(subset=['Close', 'Volume'])

    # Calcul du RSI
    df['RSI'] = ta.rsi(df['Close'], length=14)

    # Calcul du MACD
    macd = ta.macd(df['Close'])
    df['MACD'] = macd['MACD_12_26_9']
    df['MACD_signal'] = macd['MACDs_12_26_9']
    df['MACD_hist'] = macd['MACDh_12_26_9']

    # Calcul de l'OBV
    df['OBV'] = ta.obv(df['Close'], df['Volume'])

    # Réinitialiser l'index pour inclure la date dans les colonnes
    df = df.reset_index()
    df.rename(columns={'Date': 'Date'}, inplace=True)

    # Formater la date
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

    # Supprimer les lignes avec des valeurs NaN résultant des calculs
    df = df.dropna()

    return df
