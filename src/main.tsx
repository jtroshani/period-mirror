import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/**
 * When the app is opened straight from disk (double-clicking index.html →
 * `file://`), the History API can't be used, so fall back to hash routing.
 * Served over http(s) it uses clean paths as normal.
 */
const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
