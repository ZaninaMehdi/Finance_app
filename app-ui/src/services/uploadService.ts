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
  file: File
): Promise<SummaryResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  console.log("Uploading file", file);

  try {
    const response = await axios.post<SummaryResponse>(
      "https://b50d-34-213-171-250.ngrok-free.app/api/report_summary", // Make sure this matches your backend URL
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
