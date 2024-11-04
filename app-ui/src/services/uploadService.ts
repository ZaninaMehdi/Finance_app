// src/services/UploadService.ts
import axios from "axios";

export interface SummaryResponse {
  status: string;
  data: {
    filename: string;
    analysis_timestamp: string;
    summary: {
      executive_summary: string;
      key_metrics: string[];
      performance_highlights: string[];
      strategic_initiatives: string[];
      risks: string[];
      market_position: string[];
      future_outlook: string;
      analysis_timestamp: string;
    };
    metadata: {
      chunks_processed: number;
      text_length: number;
    };
  };
}

export const uploadPdfForSummary = async (
  file: File, companyName: string
): Promise<SummaryResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("company", companyName)
  console.log("Uploading file", formData);
  try {
    const response = await axios.post<SummaryResponse>(
      "https://bb5d-54-203-17-143.ngrok-free.app/api/agent", // Make sure this matches your backend URL
      formData,
      {
        headers: {
          "ngrok-skip-browser-warning": "skip-browser-warning",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(err.response?.data?.message || "Error uploading PDF");
  }
};
