import React from "react";
import "../App.css";

const MarkerInfo = ({ markers = [] }) => {
  return (
    <div className="marker-info">
      <h3>📍 Marqueurs AR Chargés:</h3>
      <ul>
        {markers.map((marker, idx) => (
          <li key={idx}>
            <strong>{marker.name}</strong>
            <br />
            <small>{marker.description}</small>
          </li>
        ))}
      </ul>
      <p className="info-text">
        ⏱️ L'animation démarre 2 secondes après la détection du marqueur
      </p>
    </div>
  );
};

export default MarkerInfo;
