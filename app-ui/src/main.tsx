import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Search from "./components/search.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PdfUploader from "./components/PdfUploader.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/tech-analysis/:companyName" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/search" />} />
        <Route path="/upload" element={<PdfUploader />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
