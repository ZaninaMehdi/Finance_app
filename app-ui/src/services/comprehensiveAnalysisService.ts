const API_BASE_URL = "http://127.0.0.1:5000/api";

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
    const response = await fetch(`${API_BASE_URL}/analysis?company=${company}`);
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
