import { useState, FormEvent } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Difficulty, RacerVehicle, VehicleType } from "../types";
import { RACER_VEHICLES, GAME_TEXTS } from "../data";
import {
  User,
  Flame,
  Keyboard,
  Volume2,
  VolumeX,
  ShieldAlert,
  Loader2,
  Lock,
  PlusCircle,
  Key,
} from "lucide-react";
import { motion } from "motion/react";
import { getMuted, setMuted } from "../lib/audio";

interface RacerSetupProps {
  initialName: string;
  initialDifficulty: Difficulty;
  initialVehicle: RacerVehicle;
  onStart: (name: string, difficulty: Difficulty, vehicle: RacerVehicle) => void;
  onStartMultiplayer: (roomCode: string, isHost: boolean, name: string, vehicle: RacerVehicle) => void;
  onViewLeaderboard: () => void;
}

export default function RacerSetup({
  initialName,
  initialDifficulty,
  initialVehicle,
  onStart,
  onStartMultiplayer,
  onViewLeaderboard,
}: RacerSetupProps) {
  const [name, setName] = useState(initialName);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [selectedVehicle, setSelectedVehicle] = useState<RacerVehicle>(initialVehicle);
  const [muted, setMutedState] = useState(getMuted());
  const [nameError, setNameError] = useState("");

  // Multiplayer Specific States
  const [gameMode, setGameMode] = useState<"solo" | "multiplayer">("solo");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomError, setRoomError] = useState("");

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setMutedState(nextMuted);
  };

  const handleStartSolo = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Please enter your name!");
      return;
    }
    if (trimmedName.length > 30) {
      setNameError("Name must be at most 30 characters.");
      return;
    }
    setNameError("");
    onStart(trimmedName, difficulty, selectedVehicle);
  };

  const handleCreateRoom = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Please enter your name!");
      return;
    }
    if (trimmedName.length > 30) {
      setNameError("Name must be at most 30 characters.");
      return;
    }
    setNameError("");
    setLoading(true);
    setRoomError("");

    try {
      // Generate 6 digit uppercase alphanumeric code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const filteredTexts = GAME_TEXTS.filter((t) => t.difficulty === difficulty);
      const randomText = filteredTexts[Math.floor(Math.random() * filteredTexts.length)];

      let playerId = localStorage.getItem("typeracer_player_id");
      if (!playerId) {
        playerId = "player_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("typeracer_player_id", playerId);
      }

      const roomRef = doc(db, "typeracer_rooms", roomCode);
      const newRoom = {
        roomCode,
        status: "waiting",
        difficulty,
        textToType: randomText.text,
        textSource: randomText.source,
        createdAt: new Date().toISOString(),
        players: {
          [playerId]: {
            id: playerId,
            name: trimmedName,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            errors: 0,
            isHost: true,
            isFinished: false,
            vehicleId: selectedVehicle.id,
            finishedAt: null,
          },
        },
      };

      await setDoc(roomRef, newRoom);

      // Save local preferences
      localStorage.setItem("typeracer_name", trimmedName);
      localStorage.setItem("typeracer_vehicle_id", selectedVehicle.id);

      onStartMultiplayer(roomCode, true, trimmedName, selectedVehicle);
    } catch (e: any) {
      console.error("Room creation error:", e);
      setRoomError("Error creating room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Please enter your name!");
      return;
    }
    if (trimmedName.length > 30) {
      setNameError("Name must be at most 30 characters.");
      return;
    }
    setNameError("");

    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setRoomError("Please enter the room code!");
      return;
    }

    setLoading(true);
    setRoomError("");

    try {
      const roomRef = doc(db, "typeracer_rooms", code);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        setRoomError("Sorry, room not found. Please check your code.");
        return;
      }

      const roomData = snapshot.data();
      if (roomData.status !== "waiting") {
        setRoomError("Sorry, this race has already started.");
        return;
      }

      const players = roomData.players || {};
      const numPlayers = Object.keys(players).length;
      if (numPlayers >= 2) {
        setRoomError("The room is full (maximum 2 players).");
        return;
      }

      let playerId = localStorage.getItem("typeracer_player_id");
      if (!playerId) {
        playerId = "player_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("typeracer_player_id", playerId);
      }

      // Add self to room
      const updatedPlayers = {
        ...players,
        [playerId]: {
          id: playerId,
          name: trimmedName,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          errors: 0,
          isHost: false,
          isFinished: false,
          vehicleId: selectedVehicle.id,
          finishedAt: null,
        },
      };

      await updateDoc(roomRef, { players: updatedPlayers });

      // Save local preferences
      localStorage.setItem("typeracer_name", trimmedName);
      localStorage.setItem("typeracer_vehicle_id", selectedVehicle.id);

      onStartMultiplayer(code, false, trimmedName, selectedVehicle);
    } catch (e: any) {
      console.error("Room join error:", e);
      setRoomError("Error joining the room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const difficulties: { value: Difficulty; label: string; desc: string; color: string }[] = [
    { value: "easy", label: "Easy", desc: "Short sentences", color: "border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-400" },
    { value: "medium", label: "Medium", desc: "Medium sentences", color: "border-amber-200 text-amber-700 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/10 dark:text-amber-400" },
    { value: "hard", label: "Hard", desc: "Long sentences", color: "border-rose-200 text-rose-700 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/10 dark:text-rose-400" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6" id="setup-container">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3.5 bg-indigo-700 text-white rounded-3xl mb-4 dark:bg-indigo-100 dark:text-indigo-950 shadow-md"
        >
          <Keyboard className="w-9 h-9" />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight dark:text-white">
          TypeRacer English
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Type fast in English and race with others! 🏎️💨
        </p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 max-w-sm mx-auto border border-slate-200 dark:bg-neutral-900 dark:border-neutral-850">
        <button
          type="button"
          onClick={() => {
            setGameMode("solo");
            setRoomError("");
          }}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            gameMode === "solo"
              ? "bg-white text-indigo-700 shadow dark:bg-neutral-950 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-800 dark:text-neutral-400"
          }`}
        >
          Solo Race
        </button>
        <button
          type="button"
          onClick={() => {
            setGameMode("multiplayer");
            setRoomError("");
          }}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            gameMode === "multiplayer"
              ? "bg-white text-indigo-700 shadow dark:bg-neutral-950 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-800 dark:text-neutral-400"
          }`}
        >
          Multiplayer Duel
        </button>
      </div>

      <div className="space-y-6">
        {/* Name Input Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-neutral-950 dark:border-neutral-900">
          <label className="block text-sm font-bold text-slate-800 mb-2 dark:text-neutral-200 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Player Name
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your name here..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={`w-full px-4 py-3.5 bg-slate-50 border ${
                nameError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-950`}
              maxLength={30}
              id="player-name-input"
            />
          </div>
          {nameError && (
            <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {nameError}
            </p>
          )}
        </div>

        {/* Racer Vehicle Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-neutral-950 dark:border-neutral-900">
          <label className="block text-sm font-bold text-slate-800 mb-3 dark:text-neutral-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-500" />
            Racing Vehicle (Avatar)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RACER_VEHICLES.map((v) => {
              const isSelected = selectedVehicle.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${v.bgColor} ring-2 ring-indigo-600 dark:ring-indigo-400 font-bold scale-[1.02] shadow`
                      : "border-slate-200 hover:bg-slate-50 text-slate-750 dark:border-neutral-850 dark:hover:bg-neutral-900 dark:text-neutral-350"
                  }`}
                  id={`vehicle-select-${v.id}`}
                >
                  <span className="text-3xl leading-none">{v.emoji}</span>
                  <div>
                    <div className="text-sm font-bold">{v.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification Block */}
        {roomError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>{roomError}</span>
          </div>
        )}

        {/* Loading overlay state */}
        {loading && (
          <div className="p-4 bg-indigo-50 border border-indigo-150 text-indigo-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>Please wait, processing action...</span>
          </div>
        )}

        {/* SOLO MODE CONTENT */}
        {gameMode === "solo" ? (
          <form onSubmit={handleStartSolo} className="space-y-6">
            {/* Difficulty Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-neutral-950 dark:border-neutral-900">
              <label className="block text-sm font-bold text-slate-800 mb-3 dark:text-neutral-200">
                Difficulty Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {difficulties.map((diff) => {
                  const isSelected = difficulty === diff.value;
                  return (
                    <button
                      key={diff.value}
                      type="button"
                      onClick={() => setDifficulty(diff.value)}
                      className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${diff.color} ring-2 ring-indigo-600 dark:ring-indigo-400 font-bold scale-[1.02] shadow`
                          : "border-slate-200 hover:bg-slate-50 text-slate-750 dark:border-neutral-850 dark:hover:bg-neutral-900 dark:text-neutral-350"
                      }`}
                      id={`diff-select-${diff.value}`}
                    >
                      <span className="text-sm font-bold">{diff.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {diff.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onViewLeaderboard}
                className="w-full sm:w-1/3 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-sm transition-all text-center cursor-pointer dark:border-neutral-800 dark:hover:bg-neutral-900 dark:text-neutral-250"
                id="view-leaderboard-setup-btn"
              >
                View Leaderboard
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="w-full sm:w-auto p-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-2 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:text-neutral-300"
                title={muted ? "Unmute" : "Mute"}
                id="mute-toggle-btn"
              >
                {muted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
                <span className="sm:hidden">{muted ? "Muted" : "Unmuted"}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-extrabold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer disabled:opacity-50"
                id="start-race-submit"
              >
                Start Race 🏁
              </button>
            </div>
          </form>
        ) : (
          /* MULTIPLAYER LOBBY CONTROLS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between dark:bg-neutral-950 dark:border-neutral-900 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-neutral-200 flex items-center gap-2 mb-1.5">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  Create New Room
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Select a difficulty level to create a room, then invite a friend with a duel code.
                </p>

                {/* Local Difficulty select */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Difficulty Level</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.value}
                        type="button"
                        onClick={() => setDifficulty(diff.value)}
                        className={`py-2 px-1.5 rounded-lg border text-xs text-center transition-all cursor-pointer font-bold ${
                          difficulty === diff.value
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                            : "border-slate-200 hover:bg-slate-50 text-slate-500"
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                Create Room 🔑
              </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between dark:bg-neutral-950 dark:border-neutral-900 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-neutral-200 flex items-center gap-2 mb-1.5">
                  <Key className="w-5 h-5 text-emerald-500" />
                  Join Room
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Enter the 6-digit room code provided by the host to join the race.
                </p>

                {/* Room Code Entry Input */}
                <div className="space-y-2 mb-6">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Example: A9X2D4"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-center text-lg font-black font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                Join with Code 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
