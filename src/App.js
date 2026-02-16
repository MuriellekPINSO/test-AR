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
        � Boîte au Trésor AR{" "}
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
            <li>🚀 Cliquez sur "Lancer AR" pour démarrer la caméra</li>
            <li>🎯 Pointez vers l'un des {AR_CONFIG.markers.length} marqueurs compilés</li>
            <li>⏱️ Attendez 2 secondes pour que la boîte au trésor apparaisse</li>
            <li>🎁 La boîte s'ouvrira automatiquement et révélera le trésor !</li>
            <li>✨ Pièces d'or, gemmes et particules magiques incluses</li>
            <li>📦 Modèle: <code>{AR_CONFIG.modelFile}</code></li>
            <li>🎯 Marqueurs: <code>{AR_CONFIG.targetFile}</code></li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
