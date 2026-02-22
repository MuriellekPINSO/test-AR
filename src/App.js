import React, { useState } from "react";
import "./App.css";
import MindARThreeViewer from "./mindar-three-viewer";
import DiagnosticPanel from "./components/DiagnosticPanel";
import { AR_CONFIG } from "./config";

function App() {
  const [started, setStarted] = useState(null);

  return (
    <div className="App">
      <h1>
        🎯 AR Boule Explorer{" "}
        <a href="https://github.com/hiukim/mind-ar-js" target="_blank" rel="noreferrer">
          (MindAR)
        </a>
      </h1>

      <div className="control-buttons">
        {started === null && (
          <button
            onClick={() => {
              setStarted("three");
            }}
          >
            🚀 Lancer AR (ThreeJS)
          </button>
        )}
        {started !== null && (
          <button
            onClick={() => {
              setStarted(null);
            }}
          >
            ⛔ Arrêter
          </button>
        )}
      </div>

      {started === "three" && (
        <div className="container">
          <MindARThreeViewer />
          <DiagnosticPanel />
        </div>
      )}

      {started === null && (
        <div className="info-panel" style={{ padding: "20px", textAlign: "left", maxWidth: "600px", margin: "20px auto" }}>
          <h2>ℹ️ Instructions</h2>
          <ul>
            <li>Cliquez sur "Lancer AR" pour démarrer</li>
            <li>Pointez vers l'un des {AR_CONFIG.markers.length} marqueurs compilés</li>
            <li>⏱️ L'animation se lance automatiquement après 2 secondes</li>
            <li>📦 Modèle: <code>{AR_CONFIG.modelFile}</code></li>
            <li>🎯 Marqueurs: <code>{AR_CONFIG.targetFile}</code></li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
