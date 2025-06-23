import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

// Initialize PMTiles protocol
let protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
