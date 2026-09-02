import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/**
 * Use hash routing when opened straight from disk (`file://`, no History API)
 * or when built for a project sub-path host like GitHub Pages
 * (`VITE_HASH_ROUTER=true`). Served from a domain root it uses clean paths.
 */
const useHashRouter =
  window.location.protocol === "file:" ||
  import.meta.env.VITE_HASH_ROUTER === "true";
const Router = useHashRouter ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
