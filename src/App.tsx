import { useState, useEffect } from "react";
import RacerSetup from "./components/RacerSetup";
import GameScreen from "./components/GameScreen";
import Leaderboard from "./components/Leaderboard";
import MultiplayerGame from "./components/MultiplayerGame";
import { Difficulty, RacerVehicle } from "./types";
import { RACER_VEHICLES } from "./data";
import { Keyboard, Trophy, ShieldCheck } from "lucide-react";

type ActiveView = "setup" | "game" | "leaderboard" | "multiplayer";

export default function App() {
  const [view, setView] = useState<ActiveView>("setup");
  const [playerName, setPlayerName] = useState("Уралдагч");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [vehicle, setVehicle] = useState<RacerVehicle>(RACER_VEHICLES[0]);
  const [latestScoreId, setLatestScoreId] = useState<string | undefined>(undefined);

  // Multiplayer Specific States
  const [roomCode, setRoomCode] = useState("");
  const [isMultiplayerHost, setIsMultiplayerHost] = useState(false);
  const [playerId, setPlayerId] = useState("");

  // Load configuration from local storage on mount
  useEffect(() => {
    try {
      let id = localStorage.getItem("typeracer_player_id");
      if (!id) {
        id = "player_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("typeracer_player_id", id);
      }
      setPlayerId(id);

      const storedName = localStorage.getItem("typeracer_name");
      if (storedName) {
        setPlayerName(storedName);
      }
      
      const storedDiff = localStorage.getItem("typeracer_difficulty") as Difficulty;
      if (storedDiff && ["easy", "medium", "hard"].includes(storedDiff)) {
        setDifficulty(storedDiff);
      }

      const storedVehicleId = localStorage.getItem("typeracer_vehicle_id");
      if (storedVehicleId) {
        const found = RACER_VEHICLES.find((v) => v.id === storedVehicleId);
        if (found) setVehicle(found);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  const handleStartGame = (name: string, diff: Difficulty, selectedVehicle: RacerVehicle) => {
    setPlayerName(name);
    setDifficulty(diff);
    setVehicle(selectedVehicle);
    setLatestScoreId(undefined); // Reset newest score ID on new game start

    // Save configuration
    try {
      localStorage.setItem("typeracer_name", name);
      localStorage.setItem("typeracer_difficulty", diff);
      localStorage.setItem("typeracer_vehicle_id", selectedVehicle.id);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    setView("game");
  };

  const handleStartMultiplayer = (
    code: string,
    host: boolean,
    name: string,
    selectedVehicle: RacerVehicle
  ) => {
    setPlayerName(name);
    setVehicle(selectedVehicle);
    setRoomCode(code);
    setIsMultiplayerHost(host);
    setLatestScoreId(undefined);

    setView("multiplayer");
  };

  const handleViewLeaderboard = (scoreId?: string) => {
    if (scoreId) {
      setLatestScoreId(scoreId);
    }
    setView("leaderboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-indigo-100 selection:text-indigo-900" id="app-root-layout">
      {/* Upper Brand / Nav header (Professional Polish Theme) */}
      <header className="bg-indigo-700 text-white py-4 px-6 shadow-lg flex items-center justify-between transition-all" id="app-header">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setView("setup")}>
          <div className="w-9 h-9 bg-white text-indigo-700 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
            TR
          </div>
          <span className="font-extrabold tracking-tight text-white text-base">
            Typeracer Mongolian
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleViewLeaderboard()}
            className={`text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer px-3.5 py-2 rounded-lg border ${
              view === "leaderboard"
                ? "bg-white text-indigo-700 border-white shadow-sm"
                : "text-indigo-100 border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-600/50"
            }`}
            id="header-leaderboard-tab"
          >
            <Trophy className="w-3.5 h-3.5" />
             Leaderboard
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 flex flex-col justify-center">
        {view === "setup" && (
          <RacerSetup
            initialName={playerName}
            initialDifficulty={difficulty}
            initialVehicle={vehicle}
            onStart={handleStartGame}
            onStartMultiplayer={handleStartMultiplayer}
            onViewLeaderboard={() => handleViewLeaderboard()}
          />
        )}

        {view === "game" && (
          <GameScreen
            playerName={playerName}
            difficulty={difficulty}
            vehicle={vehicle}
            onBackToMenu={() => setView("setup")}
            onViewLeaderboard={handleViewLeaderboard}
          />
        )}

        {view === "multiplayer" && (
          <MultiplayerGame
            roomCode={roomCode}
            playerId={playerId}
            playerName={playerName}
            selectedVehicle={vehicle}
            onBackToMenu={() => setView("setup")}
          />
        )}

        {view === "leaderboard" && (
          <Leaderboard
            onBackToMenu={() => setView("setup")}
            currentScoreId={latestScoreId}
          />
        )}
      </main>

      {/* Footer Details */}
      <footer className="py-5 border-t border-slate-200 bg-white text-center text-[10px] text-slate-500 font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">Firebase Firestore Sync Active</span>
          </div>
          <div className="text-slate-400">
            &copy; {new Date().getFullYear()} Typeracer Mongolian. Бүх эрх хуулиар хамгаалагдсан.
          </div>
        </div>
      </footer>
    </div>
  );
}
