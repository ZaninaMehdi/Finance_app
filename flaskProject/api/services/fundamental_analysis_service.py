# api/services/fundamental_analysis_service.py

import yfinance as yf
import pandas as pd
from datetime import datetime


def safe_to_dict(dataframe):
    if isinstance(dataframe, pd.DataFrame):
        # Transposer le DataFrame
        dataframe = dataframe.transpose()
        # Réinitialiser l'index
        dataframe = dataframe.reset_index()
        # Renommer la colonne de l'index
        dataframe = dataframe.rename(columns={'index': 'Date'})
        # Convertir les dates en chaînes de caractères
        if pd.api.types.is_datetime64_any_dtype(dataframe['Date']):
            dataframe['Date'] = dataframe['Date'].dt.strftime('%Y-%m-%d')
        # Convertir les colonnes en chaînes
        dataframe.columns = dataframe.columns.map(str)
        # Remplacer les NaN par 0
        dataframe = dataframe.fillna(0)
        return dataframe.to_dict(orient='records')
    else:
        return {}


class FundamentalAnalysis:
    def __init__(self, ticker_symbol):
        self.ticker = yf.Ticker(ticker_symbol)
        self.symbol = ticker_symbol

    def calculate_growth_metrics(self, financials):
        growth_data = {
            'time_series': [],
            'metrics': {
                'revenue_growth': [],
                'net_income_growth': [],
                'eps_growth': [],
                'operating_income_growth': []
            }
        }

        if len(financials) >= 2:
            for i in range(len(financials) - 1):
                current = financials[i]
                prev = financials[i + 1]
                period = current.get('Date', '')
                growth_data['time_series'].append(period)

                # Calculate various growth metrics
                for metric in [
                    ('Total Revenue', 'revenue_growth'),
                    ('Net Income', 'net_income_growth'),
                    ('Diluted EPS', 'eps_growth'),
                    ('Operating Income', 'operating_income_growth')
                ]:
                    current_value = float(current.get(metric[0], 0))
                    prev_value = float(prev.get(metric[0], 1))
                    growth = ((current_value - prev_value) / prev_value * 100) if prev_value != 0 else None
                    growth_data['metrics'][metric[1]].append({
                        'value': growth,
                        'period': period
                    })

        return growth_data

    def calculate_profitability_metrics(self, financials, balance_sheet):
        profitability_data = {
            'time_series': [],
            'metrics': {
                'gross_margin': [],
                'operating_margin': [],
                'net_margin': [],
                'roa': [],
                'roe': [],
                'roic': []
            }
        }

        for financial in financials:
            period = financial.get('Date', '')
            profitability_data['time_series'].append(period)

            # Find matching balance sheet data
            balance = next(
                (b for b in balance_sheet if b.get('Date') == period),
                {}
            )

            revenue = float(financial.get('Total Revenue', 1))
            gross_profit = float(financial.get('Gross Profit', 0))
            operating_income = float(financial.get('Operating Income', 0))
            net_income = float(financial.get('Net Income', 0))
            total_assets = float(balance.get('Total Assets', 1))
            total_equity = float(balance.get('Total Stockholder Equity', 1))
            total_debt = float(balance.get('Total Debt', 0))

            # Calculate profitability ratios
            metrics = {
                'gross_margin': (gross_profit / revenue * 100) if revenue != 0 else None,
                'operating_margin': (operating_income / revenue * 100) if revenue != 0 else None,
                'net_margin': (net_income / revenue * 100) if revenue != 0 else None,
                'roa': (net_income / total_assets * 100) if total_assets != 0 else None,
                'roe': (net_income / total_equity * 100) if total_equity != 0 else None,
                'roic': (operating_income / (total_equity + total_debt) * 100) if (
                                                                                              total_equity + total_debt) != 0 else None
            }

            for metric_name, value in metrics.items():
                profitability_data['metrics'][metric_name].append({
                    'value': value,
                    'period': period
                })

        return profitability_data

    def calculate_efficiency_metrics(self, financials, balance_sheet):
        efficiency_data = {
            'time_series': [],
            'metrics': {
                'asset_turnover': [],
                'inventory_turnover': [],
                'receivables_turnover': [],
                'payables_turnover': []
            }
        }

        for financial in financials:
            period = financial.get('Date', '')
            efficiency_data['time_series'].append(period)

            balance = next(
                (b for b in balance_sheet if b.get('Date') == period),
                {}
            )

            revenue = float(financial.get('Total Revenue', 0))
            cogs = float(financial.get('Cost Of Revenue', 0))
            total_assets = float(balance.get('Total Assets', 1))
            inventory = float(balance.get('Inventory', 1))
            receivables = float(balance.get('Net Receivables', 1))
            payables = float(balance.get('Accounts Payable', 1))

            metrics = {
                'asset_turnover': (revenue / total_assets) if total_assets != 0 else None,
                'inventory_turnover': (cogs / inventory) if inventory != 0 else None,
                'receivables_turnover': (revenue / receivables) if receivables != 0 else None,
                'payables_turnover': (cogs / payables) if payables != 0 else None
            }

            for metric_name, value in metrics.items():
                efficiency_data['metrics'][metric_name].append({
                    'value': value,
                    'period': period
                })

        return efficiency_data

    def get_market_metrics(self):
        info = self.ticker.info
        return {
            'current': {
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'forward_pe': info.get('forwardPE'),
                'price_to_book': info.get('priceToBook'),
                'price_to_sales': info.get('priceToSalesTrailing12Months'),
                'dividend_yield': info.get('dividendYield', 0),
                'peg_ratio': info.get('pegRatio'),
                'beta': info.get('beta'),
                'current_price': info.get('currentPrice'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                'volume': info.get('volume'),
                'avg_volume': info.get('averageVolume')
            }
        }

    def analyze(self):
        try:
            raw_data = {
                'financials': safe_to_dict(self.ticker.financials),
                'balance_sheet': safe_to_dict(self.ticker.balance_sheet),
                'cashflow': safe_to_dict(self.ticker.cashflow),
                'info': self.ticker.info
            }

            financials = raw_data['financials']
            balance_sheet = raw_data['balance_sheet']

            analysis = {
                'company_info': {
                    'symbol': self.symbol,
                    'name': raw_data['info'].get('longName', ''),
                    'sector': raw_data['info'].get('sector', ''),
                    'industry': raw_data['info'].get('industry', ''),
                    'description': raw_data['info'].get('longBusinessSummary', ''),
                    'website': raw_data['info'].get('website', ''),
                    'employees': raw_data['info'].get('fullTimeEmployees', 0)
                },
                'analysis_date': datetime.now().strftime('%Y-%m-%d'),
                'market_metrics': self.get_market_metrics(),
                'growth_metrics': self.calculate_growth_metrics(financials),
                'profitability_metrics': self.calculate_profitability_metrics(financials, balance_sheet),
                'efficiency_metrics': self.calculate_efficiency_metrics(financials, balance_sheet)
            }

            return analysis

        except Exception as e:
            print(f"Erreur lors de l'analyse fondamentale : {e}")
            return {
                'error': True,
                'message': str(e),
                'company_symbol': self.symbol,
                'analysis_date': datetime.now().strftime('%Y-%m-%d')
            }


def analyze_stock(ticker_symbol):
    analyzer = FundamentalAnalysis(ticker_symbol)
    return analyzer.analyze()
