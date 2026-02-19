import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://timer-sounds.onrender.com";

function App() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [initialSeconds, setInitialSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sounds, setSounds] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);

  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const radius = 140;
  const circumference = 2 * Math.PI * radius;

  /* ========================= */
  /* TUTORIAL */
  /* ========================= */

  useEffect(() => {
    const seen = localStorage.getItem("tutorial_seen");
    if (!seen) setShowTutorial(true);
  }, []);

  const closeTutorial = () => {
    localStorage.setItem("tutorial_seen", "true");
    setShowTutorial(false);
  };

  /* ========================= */
  /* TIMER */
  /* ========================= */

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            playRandomSound();
            return initialSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, initialSeconds]);

  const toggleTimer = () => {
    if (totalSeconds <= 0) return;
    setIsRunning((prev) => !prev);
  };

  const reset = () => {
    setIsRunning(false);
    setTotalSeconds(initialSeconds);
  };

  const formatTime = () => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const handleEdit = (e) => {
    const value = e.target.value;
    const parts = value.split(":").map(Number);

    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      const newSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];

      if (newSeconds > 0) {
        setTotalSeconds(newSeconds);
        setInitialSeconds(newSeconds);
      }
    }
  };

  const progress =
    initialSeconds > 0 ? totalSeconds / initialSeconds : 0;

  const strokeDashoffset = circumference * (1 - progress);

  const playRandomSound = () => {
    if (sounds.length === 0) return;

    const random =
      sounds[Math.floor(Math.random() * sounds.length)];

    const audio = new Audio(
      `${API_URL}/uploads/${random}`
    );

    audio.play().catch(() => {});
  };

  /* ========================= */
  /* SONS */
  /* ========================= */

  useEffect(() => {
    refreshSounds();
  }, []);

  const refreshSounds = async () => {
    try {
      const res = await axios.get(`${API_URL}/sounds`);
      setSounds(res.data);
      localStorage.setItem("sounds", JSON.stringify(res.data));
    } catch (err) {
      console.error("Erro ao carregar sons");
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("sounds", files[i]);
    }

    try {
      await axios.post(`${API_URL}/upload`, formData);

      setTimeout(async () => {
        await refreshSounds();
      }, 300);

    } catch (err) {
      console.error("Erro no upload:", err);
    }
  };

  const deleteSound = async (name) => {
    try {
      await axios.delete(
        `${API_URL}/delete/${encodeURIComponent(name)}`
      );

      const updated = sounds.filter((s) => s !== name);
      setSounds(updated);
      localStorage.setItem(
        "sounds",
        JSON.stringify(updated)
      );
    } catch (err) {
      console.error("Erro ao deletar arquivo");
    }
  };

  /* ========================= */
  /* RENDER */
  /* ========================= */

  return (
    <div className="app">
      <h1 className="app-title">Timer Sounds</h1>

      <div className="circle-container">
        <svg width="320" height="320">
          <circle
            stroke="#2a2a2a"
            fill="transparent"
            strokeWidth="10"
            r={radius}
            cx="160"
            cy="160"
          />

          <circle
            stroke="#f28b82"
            fill="transparent"
            strokeWidth="10"
            r={radius}
            cx="160"
            cy="160"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 160 160)"
            style={{
              transition:
                "stroke-dashoffset 1s linear, opacity 0.3s ease",
              opacity: isRunning ? 1 : 0.25,
            }}
          />
        </svg>

        {isEditing ? (
          <input
            className="edit-input"
            defaultValue={formatTime()}
            onBlur={(e) => {
              handleEdit(e);
              setIsEditing(false);
            }}
            autoFocus
          />
        ) : (
          <div
            className="time-display"
            onClick={() =>
              !isRunning && setIsEditing(true)
            }
          >
            {formatTime()}
          </div>
        )}
      </div>

      <div className="controls">
        <button className="btn main" onClick={toggleTimer}>
          {isRunning ? "❚❚" : "▶"}
        </button>

        <button className="btn secondary" onClick={reset}>
          ↺
        </button>
      </div>

      <div className="sound-container">
        <button
          className="upload-btn"
          onClick={() =>
            fileInputRef.current.click()
          }
        >
          + Upload
        </button>

        <input
          type="file"
          multiple
          accept="audio/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleUpload}
        />

        <div className="sound-grid">
          {sounds.map((sound) => (
            <div key={sound} className="sound-card">
              <span
                className="delete-btn"
                onClick={() =>
                  deleteSound(sound)
                }
              >
                ✖
              </span>

              <div className="sound-icon">🎵</div>
              <div className="sound-name">
                {sound}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer
        className={`footer ${
          sounds.length > 0 ? "hidden" : ""
        }`}
      >
        © {new Date().getFullYear()} Timer Sounds — Todos os direitos reservados.
      </footer>

      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <h2>Bem-vindo ao Timer Sounds 💨</h2>

            <p>
              Aqui ficam seus áudios enviados.
              Use o botão <strong>+ Upload</strong>.
            </p>

            <p>
              O timer tocará um som aleatório
              sempre que o tempo zerar.
            </p>

            <p>
              Clique no tempo para editar.
              Use ▶ para iniciar e ↺ para resetar.
            </p>

            <button onClick={closeTutorial}>
              Entendi 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;