import React, { useState, useEffect } from "react";
import { AR_CONFIG } from "../config";

const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState({
    webgl: null,
    camera: null,
    https: null,
    targetFile: null,
    modelFile: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = {};

    // Test WebGL
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    results.webgl = !!gl;

    // Test HTTPS
    results.https =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Test caméra
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      results.camera = cameras.length > 0;
    } catch (err) {
      results.camera = false;
    }

    // Test fichiers
    try {
      const targetResponse = await fetch(AR_CONFIG.targetFile);
      results.targetFile = targetResponse.ok;
    } catch {
      results.targetFile = false;
    }

    try {
      results.modelFile = true; // Modèles procéduraux, pas de fichier externe requis
    } catch {
      results.modelFile = false;
    }

    setDiagnostics(results);
  };

  const getIcon = (status) => {
    if (status === null) return "⏳";
    return status ? "✅" : "❌";
  };

  const allPassed = Object.values(diagnostics).every((v) => v === true);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontSize: "12px",
        zIndex: 999,
        maxWidth: "300px",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0" }}>🔍 Diagnostic Système</h4>
      <div>
        {getIcon(diagnostics.webgl)} WebGL: {diagnostics.webgl ? "OK" : "NON"}
      </div>
      <div>
        {getIcon(diagnostics.https)} HTTPS/Local:{" "}
        {diagnostics.https ? "OK" : "NON"}
      </div>
      <div>
        {getIcon(diagnostics.camera)} Caméra:{" "}
        {diagnostics.camera ? "OK" : "NON"}
      </div>
      <div>
        {getIcon(diagnostics.targetFile)} {AR_CONFIG.targetFile}:{" "}
        {diagnostics.targetFile ? "OK" : "NON"}
      </div>
      <div>
        {getIcon(diagnostics.modelFile)} Modèles 3D:{" "}
        {diagnostics.modelFile ? "OK" : "NON"}
      </div>
      <hr style={{ margin: "10px 0", border: "1px solid #555" }} />
      <div style={{ color: allPassed ? "#4caf50" : "#f44336" }}>
        {allPassed ? "✅ Prêt pour AR" : "❌ Problème détecté"}
      </div>
      {!allPassed && (
        <button
          onClick={runDiagnostics}
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          🔄 Retester
        </button>
      )}
    </div>
  );
};

export default DiagnosticPanel;
