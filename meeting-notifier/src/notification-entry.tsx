import React from "react";
import ReactDOM from "react-dom/client";
import NotificationWindow from "./components/NotificationWindow";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotificationWindow />
  </React.StrictMode>,
);
