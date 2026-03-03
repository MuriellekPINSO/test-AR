import React, { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";
import MindARThreeViewer from "./mindar-three-viewer";
import { AR_CONFIG } from "./config";
import {
  playScanSound,
  playArrowSpinSound,
  playTreasureOpenSound,
  playCollectSound,
  playVictorySound,
  playClickSound,
  vibrate,
  vibrateCollect,
  vibrateVictory,
} from "./sounds";

// ── Helpers localStorage ─────────────────────────────────────────
const STORAGE_KEY = "ar-treasure-hunt";

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function persistSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadBestScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + "-best");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveBestScore(entry) {
  const scores = loadBestScores();
  scores.push(entry);
  scores.sort((a, b) => b.points - a.points);
  const top10 = scores.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY + "-best", JSON.stringify(top10));
  } catch { /* ignore */ }
  return top10;
}

// ── Compteurs depuis config ──────────────────────────────────────
const TOTAL_CLUES = AR_CONFIG.markers.filter((m) => m.type === "clue").length;
const TOTAL_TREASURES = AR_CONFIG.markers.filter((m) => m.type === "treasure").length;

/**
 * Écrans du jeu :
 *   'splash'   – écran d'accueil + saisie du nom
 *   'playing'  – caméra AR active
 *   'victory'  – tous les trésors collectés
 */
function App() {
  const [screen, setScreen] = useState("splash");
  const [playerName, setPlayerName] = useState("");
  const [gamePhase, setGamePhase] = useState("idle");
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTreasure, setCurrentTreasure] = useState(null);
  const [collectedIds, setCollectedIds] = useState([]);
  const [cluesFound, setCluesFound] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [bestScores, setBestScores] = useState(loadBestScores());
  const [confetti, setConfetti] = useState([]);

  const timerRef = useRef(null);

  // ── Charger une sauvegarde existante ──────────────────────────
  useEffect(() => {
    const save = loadSave();
    if (save && save.playerName) {
      setPlayerName(save.playerName);
    }
  }, []);

  // ── Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === "playing" && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen, startTime]);

  // ── Persistance automatique ───────────────────────────────────
  useEffect(() => {
    if (screen === "playing") {
      persistSave({
        playerName,
        totalPoints,
        collectedIds,
        cluesFound,
        startTime,
      });
    }
  }, [totalPoints, collectedIds, cluesFound, playerName, screen, startTime]);

  // ── Vérifier victoire ─────────────────────────────────────────
  useEffect(() => {
    if (
      screen === "playing" &&
      collectedIds.length === TOTAL_TREASURES &&
      gamePhase !== "collected"
    ) {
      // Petite tempo après la dernière collecte
      const t = setTimeout(() => {
        clearInterval(timerRef.current);
        playVictorySound();
        vibrateVictory();
        generateConfetti();
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(finalTime);
        const scores = saveBestScore({
          name: playerName,
          points: totalPoints,
          time: finalTime,
          date: new Date().toLocaleDateString("fr-FR"),
        });
        setBestScores(scores);
        setScreen("victory");
        // Nettoyer la sauvegarde en cours
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
      }, 2800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectedIds, screen]);

  // ── Confettis ─────────────────────────────────────────────────
  const generateConfetti = () => {
    const colors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#ff9ff3", "#54a0ff", "#5f27cd"];
    const items = [];
    for (let i = 0; i < 80; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      });
    }
    setConfetti(items);
  };

  // ── Format timer ──────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Callbacks AR ──────────────────────────────────────────────
  const handleMarkerFound = useCallback(
    (markerCfg) => {
      if (markerCfg.type === "clue") {
        playScanSound();
        playArrowSpinSound();
        vibrate([40]);
        setGamePhase("clue-found");
        setCurrentTreasure(null);
        setCluesFound((prev) =>
          prev.includes(markerCfg.id) ? prev : [...prev, markerCfg.id]
        );
      } else if (markerCfg.type === "treasure") {
        setCollectedIds((prev) => {
          if (prev.includes(markerCfg.id)) return prev; // déjà collecté
          playScanSound();
          playTreasureOpenSound();
          vibrate([60, 40, 60]);
          setCurrentTreasure(markerCfg);
          setGamePhase("treasure-animating");
          return prev;
        });
      }
    },
    []
  );

  const handleMarkerLost = useCallback(() => {
    setGamePhase((prev) => (prev === "collected" ? prev : "idle"));
    setCurrentTreasure((prev) => {
      // Ne pas effacer pendant la phase collected
      return prev; // On garde pour l'affichage du flash
    });
  }, []);

  const handleTreasureAnimationEnd = useCallback(() => {
    setGamePhase("treasure-ready");
  }, []);

  const handleCollect = () => {
    if (!currentTreasure) return;
    playCollectSound();
    vibrateCollect();
    setTotalPoints((prev) => prev + currentTreasure.points);
    setCollectedIds((prev) => [...prev, currentTreasure.id]);
    setGamePhase("collected");
    setTimeout(() => {
      setGamePhase("idle");
      setCurrentTreasure(null);
    }, 2500);
  };

  // ── Démarrer le jeu ───────────────────────────────────────────
  const handleStart = () => {
    if (!playerName.trim()) return;
    playClickSound();
    vibrate([30]);
    setTotalPoints(0);
    setCollectedIds([]);
    setCluesFound([]);
    setGamePhase("idle");
    setStartTime(Date.now());
    setElapsed(0);
    setScreen("playing");
  };

  // ── Rejouer ───────────────────────────────────────────────────
  const handleReplay = () => {
    playClickSound();
    vibrate([30]);
    setConfetti([]);
    setTotalPoints(0);
    setCollectedIds([]);
    setCluesFound([]);
    setCurrentTreasure(null);
    setGamePhase("idle");
    setStartTime(Date.now());
    setElapsed(0);
    setScreen("playing");
  };

  const handleBackToMenu = () => {
    playClickSound();
    setConfetti([]);
    setScreen("splash");
  };

  // ══════════════════════════════════════════════════════════════
  // ── ÉCRAN D'ACCUEIL ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (screen === "splash") {
    return (
      <div className="splash-root">
        {/* Particules de fond animées */}
        <div className="splash-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="splash-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>

        <div className="splash-content">
          {/* Logo / Titre */}
          <div className="splash-logo">
            <div className="splash-icon">🗺️</div>
            <h1 className="splash-title">Chasse au Trésor</h1>
            <p className="splash-subtitle">Réalité Augmentée</p>
          </div>

          {/* Règles rapides */}
          <div className="splash-rules">
            <div className="rule-item">
              <span className="rule-icon">📷</span>
              <span>Scannez les images pour trouver les indices</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🗺️</span>
              <span>Suivez les flèches directionnelles</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">💰</span>
              <span>Collectez les {TOTAL_TREASURES} trésors cachés !</span>
            </div>
          </div>

          {/* Saisie du nom */}
          <div className="splash-input-group">
            <label className="splash-label">Votre nom de chasseur</label>
            <input
              type="text"
              className="splash-input"
              placeholder="Entrez votre nom…"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Bouton démarrer */}
          <button
            className={`splash-btn ${playerName.trim() ? "active" : "disabled"}`}
            onClick={handleStart}
            disabled={!playerName.trim()}
          >
            🏴‍☠️ Commencer la chasse
          </button>

          {/* Meilleurs scores */}
          {bestScores.length > 0 && (
            <div className="splash-scores">
              <h3 className="scores-title">🏆 Meilleurs scores</h3>
              <div className="scores-list">
                {bestScores.slice(0, 5).map((s, i) => (
                  <div key={i} className="score-row">
                    <span className="score-rank">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span className="score-name">{s.name}</span>
                    <span className="score-pts">{s.points} pts</span>
                    <span className="score-time">{formatTime(s.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── ÉCRAN DE VICTOIRE ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (screen === "victory") {
    return (
      <div className="victory-root">
        {/* Confettis */}
        <div className="confetti-container">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                backgroundColor: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                width: `${c.size}px`,
                height: `${c.size * 1.5}px`,
                transform: `rotate(${c.rotation}deg)`,
              }}
            />
          ))}
        </div>

        <div className="victory-content">
          <div className="victory-trophy">🏆</div>
          <h1 className="victory-title">
            Félicitations {playerName} !
          </h1>
          <p className="victory-subtitle">Tu as gagné ! 🎉</p>

          {/* Résumé */}
          <div className="victory-stats">
            <div className="stat-card">
              <div className="stat-value">{totalPoints}</div>
              <div className="stat-label">Points</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatTime(elapsed)}</div>
              <div className="stat-label">Temps</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{collectedIds.length}/{TOTAL_TREASURES}</div>
              <div className="stat-label">Trésors</div>
            </div>
          </div>

          {/* Récompenses */}
          <div className="victory-rewards">
            <h3 className="rewards-title">Butin collecté</h3>
            <div className="rewards-list">
              {AR_CONFIG.markers
                .filter((m) => m.type === "treasure" && collectedIds.includes(m.id))
                .map((m) => (
                  <div key={m.id} className="reward-badge">
                    <span className="reward-icon">💎</span>
                    <span>{m.reward}</span>
                    <span className="reward-pts">+{m.points}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="victory-actions">
            <button className="victory-btn primary" onClick={handleReplay}>
              🔄 Rejouer
            </button>
            <button className="victory-btn secondary" onClick={handleBackToMenu}>
              🏠 Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── ÉCRAN DE JEU ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const renderOverlay = () => {
    switch (gamePhase) {
      case "idle":
        return (
          <div className="scan-prompt">
            <div className="scan-frame" />
            <p className="scan-label">Scannez une image</p>
          </div>
        );
      case "clue-found":
        return (
          <div className="scan-prompt">
            <p className="clue-label">
              🗺️ Indice trouvé !<br />
              Suivez la flèche…
            </p>
          </div>
        );
      case "treasure-animating":
        return (
          <div className="bottom-bar">
            <button className="collect-btn disabled" disabled>
              Récupérer le trésor
            </button>
          </div>
        );
      case "treasure-ready":
        return (
          <div className="bottom-bar">
            <button className="collect-btn active" onClick={handleCollect}>
              💰 Récupérer le trésor
            </button>
          </div>
        );
      case "collected":
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
      {/* HUD supérieur */}
      <div className="hud-top">
        <div className="hud-timer">{formatTime(elapsed)}</div>
        <div className="hud-player">{playerName}</div>
        <div className="points-badge">{totalPoints} pts</div>
      </div>

      {/* Barre de progression */}
      <div className="progress-bar-container">
        <div className="progress-info">
          <span>🗺️ {cluesFound.length}/{TOTAL_CLUES}</span>
          <span>💰 {collectedIds.length}/{TOTAL_TREASURES}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(collectedIds.length / TOTAL_TREASURES) * 100}%` }}
          />
        </div>
      </div>

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
