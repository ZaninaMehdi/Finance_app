import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import Search from "./components/search.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/tech-analysis/:companyName" element={<App />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/search" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
