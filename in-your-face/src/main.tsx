import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/settings" />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
