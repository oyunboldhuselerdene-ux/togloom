import React, { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Difficulty, RacerVehicle, Room, RoomPlayer, VehicleType } from "../types";
import { RACER_VEHICLES } from "../data";
import Track, { MultiplayerRacer } from "./Track";
import StatsDisplay from "./StatsDisplay";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Users,
  CheckCircle2,
  Keyboard,
  Copy,
  Check,
  Loader2,
  Play,
  RotateCw,
} from "lucide-react";
import {
  playCorrectSound,
  playErrorSound,
  playVictorySound,
  getMuted,
  setMuted,
} from "../lib/audio";

interface MultiplayerGameProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  selectedVehicle: RacerVehicle;
  onBackToMenu: () => void;
}

export default function MultiplayerGame({
  roomCode,
  playerId,
  playerName,
  selectedVehicle,
  onBackToMenu,
}: MultiplayerGameProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [muted, setMutedState] = useState(getMuted());
  const [inputValue, setInputValue] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localFinished, setLocalFinished] = useState(false);

  // References for timing and input
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHost = room?.players[playerId]?.isHost ?? false;

  // 1. Subscribe to Room updates
  useEffect(() => {
    const roomRef = doc(db, "typeracer_rooms", roomCode);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data() as Room;
          setRoom(roomData);

          // Handle starts and countdowns based on room status
          if (roomData.status === "starting" && countdown === null) {
            startCountdown();
          }
          if (roomData.status === "racing" && !startTime) {
            startRaceTimer();
          }
        } else {
          console.error("Room does not exist anymore");
        }
      },
      (error) => {
        console.error("Error listening to room:", error);
      }
    );

    return () => {
      unsubscribe();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [roomCode]);

  // 2. Start Countdown
  const startCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(5);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return 0;
        }
        // Play beep sound for countdown
        playCorrectSound();
        return prev - 1;
      });
    }, 1000);
  };

  // 3. Start Race Timer
  const startRaceTimer = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setCountdown(0);

    // Focus input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);
  };

  // Listen to countdown reaching 0 to transition to racing
  useEffect(() => {
    if (countdown === 0 && room?.status === "starting" && isHost) {
      // Host triggers the official racing state in Firestore
      const roomRef = doc(db, "typeracer_rooms", roomCode);
      updateDoc(roomRef, { status: "racing" }).catch((e) => {
        console.error("Error starting race:", e);
      });
    }
  }, [countdown, room?.status, isHost, roomCode]);

  // Handle countdown sound and complete
  useEffect(() => {
    if (countdown === 0) {
      playVictorySound(); // high chime for GO!
    }
  }, [countdown]);

  // Calculate stats
  const textToType = room?.textToType || "";
  const words = textToType.split(" ");
  const currentWordsTyped = inputValue.trim().split(" ").filter(Boolean).length;
  
  // Accuracy & correctness calculation
  let correctLength = 0;
  for (let i = 0; i < inputValue.length; i++) {
    if (inputValue[i] === textToType[i]) {
      correctLength++;
    } else {
      break;
    }
  }

  const hasTypingError = inputValue.length > correctLength;
  const currentProgress = textToType.length > 0 ? (correctLength / textToType.length) * 100 : 0;

  // Errors count
  const errorsCount = inputValue.split("").reduce((acc, char, idx) => {
    if (idx < inputValue.length && char !== textToType[idx]) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const accuracy = inputValue.length > 0 ? Math.max(0, ((inputValue.length - errorsCount) / inputValue.length) * 100) : 100;
  const wpm = elapsedTime > 0 ? (correctLength / 5) / (elapsedTime / 60) : 0;

  // Update stats in Firestore in real-time (throttled/on change)
  useEffect(() => {
    if (!room || room.status !== "racing" || localFinished) return;

    const roomRef = doc(db, "typeracer_rooms", roomCode);
    const updates: Record<string, any> = {
      [`players.${playerId}.progress`]: currentProgress,
      [`players.${playerId}.wpm`]: wpm,
      [`players.${playerId}.accuracy`]: accuracy,
      [`players.${playerId}.errors`]: errorsCount,
    };

    updateDoc(roomRef, updates).catch((e) => {
      console.error("Error updating real-time stats:", e);
    });
  }, [currentProgress, wpm, accuracy, errorsCount, room?.status, localFinished]);

  // Listen to typing changes and handle completion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (room?.status !== "racing" || localFinished) return;

    const val = e.target.value;

    // Only allow typing up to length of target text
    if (val.length <= textToType.length) {
      if (val.length > inputValue.length) {
        // Character added
        const lastCharTyped = val[val.length - 1];
        const correctChar = textToType[val.length - 1];
        if (lastCharTyped === correctChar) {
          playCorrectSound();
        } else {
          playErrorSound();
        }
      }
      setInputValue(val);

      // Check if finished
      if (val === textToType) {
        handleFinishRace();
      }
    }
  };

  const handleFinishRace = () => {
    setLocalFinished(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    playVictorySound();

    const roomRef = doc(db, "typeracer_rooms", roomCode);
    
    // Check if both players are finished
    const otherPlayers = (Object.values(room?.players || {}) as RoomPlayer[]).filter(p => p.id !== playerId);
    const allOthersFinished = otherPlayers.every(p => p.isFinished);

    const updates: Record<string, any> = {
      [`players.${playerId}.isFinished`]: true,
      [`players.${playerId}.progress`]: 100,
      [`players.${playerId}.wpm`]: wpm,
      [`players.${playerId}.accuracy`]: accuracy,
      [`players.${playerId}.errors`]: errorsCount,
      [`players.${playerId}.finishedAt`]: new Date().toISOString(),
    };

    if (allOthersFinished) {
      updates.status = "finished";
    }

    updateDoc(roomRef, updates)
      .then(() => {
        // Check if room needs status finished updated explicitly
        if (allOthersFinished && room) {
          updateDoc(roomRef, { status: "finished" }).catch(err => console.error(err));
        }
      })
      .catch((e) => {
        console.error("Error setting finish stats:", e);
      });
  };

  const triggerStartRace = () => {
    if (!isHost) return;
    const roomRef = doc(db, "typeracer_rooms", roomCode);
    updateDoc(roomRef, { status: "starting" }).catch((e) => {
      console.error("Error starting match:", e);
    });
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setMutedState(nextMuted);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text helper with coloring
  const renderTextCharacters = () => {
    const chars = textToType.split("");
    return (
      <div className="text-lg md:text-xl font-sans tracking-wide leading-relaxed font-medium select-none text-slate-800 dark:text-neutral-200">
        {chars.map((char, index) => {
          let colorClass = "text-slate-400 dark:text-neutral-600";
          let bgClass = "";
          let isCursor = index === inputValue.length;

          if (index < inputValue.length) {
            colorClass =
              inputValue[index] === char
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20";
          }

          return (
            <span
              key={index}
              className={`${colorClass} ${bgClass} transition-colors duration-100 relative ${
                isCursor ? "border-b-3 border-indigo-600 animate-pulse" : ""
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Өрөөний мэдээллийг татаж байна...</p>
      </div>
    );
  }

  // Map players to Track format
  const playersInRoom = Object.values(room.players) as RoomPlayer[];
  const trackRacers: MultiplayerRacer[] = playersInRoom.map((p) => {
    const foundVehicle = RACER_VEHICLES.find((v) => v.id === p.vehicleId) || RACER_VEHICLES[0];
    return {
      id: p.id,
      name: p.name,
      progress: p.progress,
      vehicle: foundVehicle,
      isFinished: p.isFinished,
      isMe: p.id === playerId,
    };
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6" id="multiplayer-game-container">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 mb-6" id="game-top-bar">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold cursor-pointer"
          id="exit-game-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Буцах</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 border border-indigo-100">
            Өрөөний код: <strong className="text-indigo-950 ml-1 font-mono">{roomCode}</strong>
          </span>
          <button
            onClick={copyCodeToClipboard}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all cursor-pointer flex items-center justify-center bg-white"
            title="Код хуулах"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleToggleMute}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all cursor-pointer bg-white"
            id="game-mute-btn"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>
      </div>

      {/* LOBBY LOBBY STATE */}
      {room.status === "waiting" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />
          <div className="inline-flex p-4 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 mb-4 animate-pulse">
            <Users className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Дуэль өрөө бэлэн боллоо! 🎉
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Найздаа доорх кодыг илгээн уралдаанд уриарай. Хоёр тоглогч нэгдсэнээр уралдааныг эхлүүлэх боломжтой.
          </p>

          {/* Large Room Code Display */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 max-w-xs mx-auto mb-8 relative flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ӨРӨӨНИЙ КОД</span>
              <span className="text-3xl font-black font-mono text-indigo-950 tracking-widest">{roomCode}</span>
            </div>
            <button
              onClick={copyCodeToClipboard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Хууллаа" : "Хуулах"}</span>
            </button>
          </div>

          {/* Connected players */}
          <div className="max-w-md mx-auto mb-8 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            <div className="bg-slate-100/80 px-4 py-2.5 text-xs font-extrabold text-slate-600 text-left border-b border-slate-150 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              ХОЛБОГДСОН ТОГЛОГЧИД ({playersInRoom.length}/2)
            </div>
            <div className="divide-y divide-slate-100">
              {playersInRoom.map((p) => {
                const vehicleObj = RACER_VEHICLES.find(v => v.id === p.vehicleId);
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{vehicleObj?.emoji || "🚗"}</span>
                      <div className="text-left">
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {p.name}
                          {p.isHost && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-bold uppercase">
                              Host
                            </span>
                          )}
                          {p.id === playerId && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase">
                              Та
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Хүлэг: {vehicleObj?.label}</div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Холбогдсон
                    </span>
                  </div>
                );
              })}
              {playersInRoom.length < 2 && (
                <div className="p-5 text-center bg-white text-slate-400 text-xs font-semibold animate-pulse flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  Найзыгаа нэгдэхийг хүлээж байна...
                </div>
              )}
            </div>
          </div>

          {/* Start Actions */}
          <div className="max-w-md mx-auto">
            {isHost ? (
              <button
                onClick={triggerStartRace}
                disabled={playersInRoom.length < 2}
                className={`w-full py-4 rounded-xl font-extrabold text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  playersInRoom.length >= 2
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:scale-[1.01]"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                Уралдааныг эхлүүлэх 🏁
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-slate-600 text-sm font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                Зохион байгуулагч уралдааныг эхлүүлэхийг хүлээж байна...
              </div>
            )}
          </div>
        </div>
      )}

      {/* COUNTDOWN OVERLAY ON ACTIVE STARTING STATE */}
      {room.status === "starting" && countdown !== null && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center mb-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-6">ХОЁР ТОГЛОГЧ ХОЛБОГДЛОО! УРАЛДААН ЭХЛЭХЭД</span>
          
          <div className="w-32 h-32 rounded-full bg-amber-50 border-4 border-amber-500 flex items-center justify-center mb-6 shadow-md">
            <span className="text-6xl font-black text-amber-600 font-mono animate-bounce">
              {countdown > 0 ? countdown : "GO!"}
            </span>
          </div>

          <p className="text-sm text-slate-500 font-semibold">
            Бэлэн байгаарай! Монгол хэлээр маш хурдан бөгөөд алдаагүй шивж барианд ороорой!
          </p>
        </div>
      )}

      {/* ACTIVE RACING GAMEPLAY */}
      {(room.status === "racing" || room.status === "finished") && (
        <>
          {/* Dual Lane Track */}
          <Track players={trackRacers} />

          {/* Real-time stats header */}
          <StatsDisplay
            wpm={wpm}
            accuracy={accuracy}
            errors={errorsCount}
            elapsedTime={elapsedTime}
            isComplete={localFinished}
          />

          {/* Typing Area (Only show if not finished yet locally) */}
          {!localFinished ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6 relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 text-xs">
                <span className="font-mono text-slate-400">Эх сурвалж: {room.textSource}</span>
                <span className="font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                  {room.difficulty === "easy" ? "Хялбар" : room.difficulty === "medium" ? "Дундаж" : "Хэцүү"}
                </span>
              </div>

              {/* Text characters display */}
              <div className="mb-6 p-5 bg-slate-50 border border-slate-100 rounded-xl min-h-24 flex items-center">
                {renderTextCharacters()}
              </div>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Энд бичиж эхэлнэ үү..."
                  className={`w-full px-5 py-4 text-base bg-slate-50 border-2 rounded-xl focus:outline-none transition-all ${
                    hasTypingError
                      ? "border-rose-500 focus:ring-4 focus:ring-rose-100 focus:bg-rose-50/20"
                      : "border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white"
                  }`}
                  disabled={localFinished || room.status !== "racing"}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  id="game-text-input"
                />
                {hasTypingError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500 animate-pulse bg-rose-50 px-2 py-1 rounded border border-rose-200">
                    Алдаатай байна!
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Keyboard className="w-4 h-4 text-slate-300" />
                <span>Зөвлөмж: Алдаагаа устгаж зассаны дараа урагшаа хөдөлнө.</span>
              </div>
            </div>
          ) : (
            /* LOCAL FINISH - CELEBRATION WAITING */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center mb-6">
              <div className="inline-flex p-4 bg-amber-50 rounded-full border border-amber-200 text-amber-500 mb-4">
                <Trophy className="w-12 h-12 animate-bounce" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Баяр хүргэе! Та барианд орлоо 🎉
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Та {textToType.length} тэмдэгттэй өгүүлбэрийг {elapsedTime.toFixed(1)} секундэд маш амжилттай бичиж дуусгалаа.
              </p>

              {/* Real-time other player status */}
              <div className="max-w-md mx-auto p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs font-bold">Уралдаан дуусахыг хүлээж байна...</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {playersInRoom.map(p => (
                    <div key={p.id} className="flex justify-between w-64 mt-1 font-semibold">
                      <span>{p.name}:</span>
                      <span className={p.isFinished ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                        {p.isFinished ? "Барианд орсон" : `Бичиж байна (${Math.round(p.progress)}%)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* GAME OVER FINISHED RESULTS VIEW */}
      {room.status === "finished" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center justify-center gap-2">
            🏆 Уралдааны үр дүн 🏆
          </h2>

          {/* Duel leaderboard pod */}
          <div className="max-w-md mx-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 mb-8">
            {playersInRoom
              .sort((a, b) => {
                // First order by progress (100 is higher), then by finish time or WPM
                if (a.isFinished && b.isFinished) {
                  return (a.finishedAt || "") < (b.finishedAt || "") ? -1 : 1;
                }
                return b.progress - a.progress;
              })
              .map((p, idx) => {
                const vehicleObj = RACER_VEHICLES.find(v => v.id === p.vehicleId);
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold font-mono text-slate-400 w-6">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="text-left">
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {p.name}
                          {p.id === playerId && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase">
                              Та
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">WPM: {Math.round(p.wpm)} | Accuracy: {p.accuracy.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-950 font-mono">
                        {Math.round(p.progress)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">ҮР ДҮН</div>
                    </div>
                  </div>
                );
              })}
          </div>

          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-extrabold text-sm transition-all shadow-md cursor-pointer"
            id="multiplayer-back-to-menu-btn"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      )}
    </div>
  );
}
