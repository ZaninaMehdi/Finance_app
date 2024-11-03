// src/services/apiService.ts

const API_BASE_URL = "http://127.0.0.1:5000/api";

// Define the structure of the technical analysis data
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

// Define the type for the API call function
export const getAnalysis = async (company: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/technical_analysis?company=${company}`
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
