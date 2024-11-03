// src/components/PdfUploader.tsx
import React, { useState } from "react";

const PdfUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];

      // Check if the selected file is a PDF
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Please select a PDF file");
        setFile(null);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {file && (
        <div>
          <p>Selected PDF: {file.name}</p>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
