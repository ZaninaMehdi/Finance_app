// src/services/apiService.ts

const API_BASE_URL = "https://b50d-34-213-171-250.ngrok-free.app/api";
export interface TechnicalAnalysisData {
  Date: string;
  Close: number;
  Volume: number;
  RSI: number;
  MACD: number;
  MACD_hist: number;
}

export interface ApiResponse {
  company: string;
  technical_analysis: TechnicalAnalysisData[];
}

export const getAnalysis = async (company: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/technical_analysis?company=${company}`,
      {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'skip-browser-warning',
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données");
    }
    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
};

// In your apiService.ts
export const getSentimentAnalysis = async (ticker: string, companyName: string): Promise<any> => {
  try {
    companyName = "Apple";
    ticker = "AAPL"
    const response = await fetch(`${API_BASE_URL}/sentiment_analysis`, {
      method: 'POST', // Change to POST
      headers: {
        'ngrok-skip-browser-warning': 'skip-browser-warning',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticker, company_name: companyName }) // Pass ticker and companyName as body
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'analyse de sentiment.");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
};


// Interfaces for Fundamental Analysis Data
interface Metric {
  value: number | null;
  period: string;
}

interface CompanyInfo {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number;
}

interface MarketMetrics {
  market_cap: number;
  pe_ratio: number;
  forward_pe: number;
  price_to_book: number;
  price_to_sales: number;
  dividend_yield: number;
  peg_ratio: number;
  beta: number;
  current_price: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  volume: number;
  avg_volume: number;
}

interface GrowthMetrics {
  time_series: string[];
  metrics: {
    revenue_growth: Metric[];
    net_income_growth: Metric[];
    eps_growth: Metric[];
    operating_income_growth: Metric[];
  };
}

interface ProfitabilityMetrics {
  time_series: string[];
  metrics: {
    gross_margin: Metric[];
    operating_margin: Metric[];
    net_margin: Metric[];
    roa: Metric[];
    roe: Metric[];
    roic: Metric[];
  };
}

interface EfficiencyMetrics {
  time_series: string[];
  metrics: {
    asset_turnover: Metric[];
    inventory_turnover: Metric[];
    receivables_turnover: Metric[];
    payables_turnover: Metric[];
  };
}

export interface FundamentalAnalysisResponse {
  company: string;
  analysis: {
    company_info: CompanyInfo;
    analysis_date: string;
    market_metrics: {
      current: MarketMetrics;
    };
    growth_metrics: GrowthMetrics;
    profitability_metrics: ProfitabilityMetrics;
    efficiency_metrics: EfficiencyMetrics;
  };
}

export const getFundamentalAnalysis = async (
  company: string
): Promise<FundamentalAnalysisResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/fundamental_analysis?company=${company}`,
      {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'skip-browser-warning',
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données");
    }
    const data: FundamentalAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
};