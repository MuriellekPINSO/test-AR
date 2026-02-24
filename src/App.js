import React, { useState, useCallback } from "react";
import "./App.css";
import MindARThreeViewer from "./mindar-three-viewer";

/**
 * Phases du jeu :
 *   'idle'                  – caméra active, en attente d'un scan
 *   'clue-found'            – indice scanné (flèche tourne)
 *   'treasure-animating'    – trésor en cours d'ouverture
 *   'treasure-ready'        – animation terminée → bouton actif
 *   'collected'             – trésor collecté, points ajoutés
 */
function App() {
  const [gamePhase, setGamePhase] = useState('idle');
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTreasure, setCurrentTreasure] = useState(null);
  const [collectedIds, setCollectedIds] = useState([]);

  // ── Callbacks AR ────────────────────────────────────────────────
  const handleMarkerFound = useCallback((markerCfg) => {
    if (markerCfg.type === 'clue') {
      setGamePhase('clue-found');
      setCurrentTreasure(null);
    } else if (markerCfg.type === 'treasure') {
      setCollectedIds((prev) => {
        if (prev.includes(markerCfg.id)) return prev; // déjà collecté
        setCurrentTreasure(markerCfg);
        setGamePhase('treasure-animating');
        return prev;
      });
    }
  }, []);

  const handleMarkerLost = useCallback(() => {
    setGamePhase((prev) =>
      prev === 'collected' ? prev : 'idle'
    );
    setCurrentTreasure((prev) =>
      gamePhase === 'collected' ? prev : null
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase]);

  const handleTreasureAnimationEnd = useCallback(() => {
    setGamePhase('treasure-ready');
  }, []);

  const handleCollect = () => {
    if (!currentTreasure) return;
    setTotalPoints((prev) => prev + currentTreasure.points);
    setCollectedIds((prev) => [...prev, currentTreasure.id]);
    setGamePhase('collected');
    setTimeout(() => {
      setGamePhase('idle');
      setCurrentTreasure(null);
    }, 2500);
  };

  // ── Contenu de l'overlay selon la phase ─────────────────────────
  const renderOverlay = () => {
    switch (gamePhase) {
      case 'idle':
        return (
          <div className="scan-prompt">
            <div className="scan-frame" />
            <p className="scan-label">Scannez une image</p>
          </div>
        );
      case 'clue-found':
        return (
          <div className="scan-prompt">
            <p className="clue-label">🗺️ Indice trouvé !<br/>Suivez la flèche…</p>
          </div>
        );
      case 'treasure-animating':
        return (
          <div className="bottom-bar">
            <button className="collect-btn disabled" disabled>
              Récupérer le trésor
            </button>
          </div>
        );
      case 'treasure-ready':
        return (
          <div className="bottom-bar">
            <button className="collect-btn active" onClick={handleCollect}>
              Récupérer le trésor
            </button>
          </div>
        );
      case 'collected':
        return (
          <div className="collected-flash">
            <p className="collected-title">🎉 Trésor collecté !</p>
            <p className="collected-points">+{currentTreasure?.points} pts</p>
            <p className="collected-reward">{currentTreasure?.reward}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="hunt-root">
      {/* Barre de points */}
      <div className="points-badge">{totalPoints} pts</div>

      {/* Vue AR – tient tout l'écran */}
      <div className="ar-container">
        <MindARThreeViewer
          onMarkerFound={handleMarkerFound}
          onMarkerLost={handleMarkerLost}
          onTreasureAnimationEnd={handleTreasureAnimationEnd}
        />
      </div>

      {/* Overlay contextuel */}
      {renderOverlay()}
    </div>
  );
}

export default App;
