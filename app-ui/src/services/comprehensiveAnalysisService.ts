const API_BASE_URL = "https://bb5d-54-203-17-143.ngrok-free.app/api";
// Interfaces pour les données d'analyse complète
interface CompanyInfo {
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry?: string;
  industryDisp?: string;
  sector?: string;
  sectorDisp?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  longName: string;
  currentPrice: number;
  volume: number;
  marketCap: number;

  // Additional fields
  dividendRate?: number;
  dividendYield?: number;
  payoutRatio?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  bookValue?: number;
  priceToBook?: number;
  totalRevenue?: number;
  grossMargins?: number;
  operatingMargins?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  totalDebt?: number;
  debtToEquity?: number;
  operatingCashflow?: number;
  freeCashflow?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  shortRatio?: number;
  recommendationMean?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  targetMedianPrice?: number;
  lastDividendValue?: number;
  lastDividendDate?: number;
  impliedSharesOutstanding?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  ebitda?: number;
  ebitdaMargins?: number;
  profitMargins?: number;
  trailingPegRatio?: number;
}

interface FinancialEntry {
  index: string;
  [key: string]: number | null | string;
}

export interface ComprehensiveAnalysisResponse {
  company: string;
  analysis: {
    info: CompanyInfo;
    financials: FinancialEntry[];
    balance_sheet: FinancialEntry[];
    cashflow: FinancialEntry[];
    earnings: FinancialEntry[];
    dividends: FinancialEntry[];
    recommendations: FinancialEntry[];
    calendar: FinancialEntry[];
    options: string[];
  };
}

function cleanData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(cleanData);
  } else if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, cleanData(value)])
    );
  } else if (typeof data === "number" && isNaN(data)) {
    return null;
  } else {
    return data;
  }
}

// Fonction pour récupérer les données d'analyse complète
export const getComprehensiveAnalysis = async (
  company: string
): Promise<ComprehensiveAnalysisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis?company=${company}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'skip-browser-warning',
        'Content-Type': 'application/json',
      },
    });
    console.log(response)

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération des données de l'analyse complète."
      );
    }

    // Obtenir la réponse en texte brut
    let rawText = await response.text();

    // Remplacer toutes les occurrences de NaN par null dans la chaîne de texte
    rawText = rawText.replace(/NaN/g, "null");

    // Convertir le texte en JSON
    const cleanedData = JSON.parse(rawText);

    // Casting le type pour correspondre à ComprehensiveAnalysisResponse
    return cleanedData as ComprehensiveAnalysisResponse;
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
};