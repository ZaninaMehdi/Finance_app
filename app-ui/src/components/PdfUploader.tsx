import React, { useState } from "react";
import {
  uploadPdfForSummary,
  SummaryResponse,
} from "../services/uploadService";

const PdfUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setError("Please upload a valid PDF file");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await uploadPdfForSummary(file);
      setSummary(response);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryItem = (title: string, item: string | string[]) => {
    if (Array.isArray(item)) {
      return item.join(", ");
    }
    return item;
  };

  return (
    <div>
      <h1>Upload a PDF to Summarize</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Uploading..." : "Upload and Summarize"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {summary && (
        <div>
          <h2>Summary for {summary.data.filename}</h2>
          <p>
            <strong>Executive Summary:</strong>{" "}
            {renderSummaryItem(
              "Executive Summary",
              summary.data.summary.executive_summary
            )}
          </p>
          <p>
            <strong>Key Financial Metrics:</strong>{" "}
            {renderSummaryItem(
              "Key Financial Metrics",
              summary.data.summary.key_metrics
            )}
          </p>
          <p>
            <strong>Business Performance Highlights:</strong>{" "}
            {renderSummaryItem(
              "Business Performance Highlights",
              summary.data.summary.performance_highlights
            )}
          </p>
          <p>
            <strong>Strategic Initiatives:</strong>{" "}
            {renderSummaryItem(
              "Strategic Initiatives",
              summary.data.summary.strategic_initiatives
            )}
          </p>
          <p>
            <strong>Risk Factors:</strong>{" "}
            {renderSummaryItem("Risk Factors", summary.data.summary.risks)}
          </p>
          <p>
            <strong>Market Position:</strong>{" "}
            {renderSummaryItem(
              "Market Position",
              summary.data.summary.market_position
            )}
          </p>
          <p>
            <strong>Future Outlook:</strong>{" "}
            {renderSummaryItem(
              "Future Outlook",
              summary.data.summary.future_outlook
            )}
          </p>
          <p>
            <strong>Analysis Timestamp:</strong>{" "}
            {summary.data.summary.analysis_timestamp}
          </p>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
