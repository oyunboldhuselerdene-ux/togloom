import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Difficulty, GameText, RacerVehicle, Score } from "../types";
import { GAME_TEXTS } from "../data";
import { playCorrectSound, playErrorSound, playVictorySound, getMuted, setMuted } from "../lib/audio";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import Track from "./Track";
import StatsDisplay from "./StatsDisplay";
import { RotateCw, ArrowLeft, Trophy, Keyboard, Volume2, VolumeX, CheckCircle, AlertTriangle } from "lucide-react";

interface GameScreenProps {
  playerName: string;
  difficulty: Difficulty;
  vehicle: RacerVehicle;
  onBackToMenu: () => void;
  onViewLeaderboard: (newScoreId?: string) => void;
}

export default function GameScreen({
  playerName,
  difficulty,
  vehicle,
  onBackToMenu,
  onViewLeaderboard,
}: GameScreenProps) {
  // Select a random text from the list matching the chosen difficulty
  const [gameText, setGameText] = useState<GameText>(() => {
    const filtered = GAME_TEXTS.filter((t) => t.difficulty === difficulty);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex] || GAME_TEXTS[0];
  });

  const [inputValue, setInputValue] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [muted, setMutedState] = useState(getMuted());

  // Statistics
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Firestore saving state
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | undefined>(undefined);

  // References for intervals and inputs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorPlayedRef = useRef(false); // Prevents audio spam for the same mistake

  const textToType = gameText.text;

  // Auto focus input on load and keeps it active
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Compute correct matching prefix length
  let correctLength = 0;
  for (let i = 0; i < inputValue.length; i++) {
    if (inputValue[i] === textToType[i]) {
      correctLength++;
    } else {
      break;
    }
  }

  // Handle typing input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isFinished) return;

    // Start timer on first keystroke
    if (!startTime && value.length > 0) {
      const now = Date.now();
      setStartTime(now);
      timerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - now) / 1000);
      }, 100);
    }

    // Keep track of keystrokes (do not count backspaces as additional keystrokes for accuracy)
    if (value.length > inputValue.length) {
      setTotalKeystrokes((prev) => prev + 1);
    }

    setInputValue(value);

    // Audio and error checks
    const targetChar = textToType[value.length - 1];
    const inputChar = value[value.length - 1];

    if (value.length > 0) {
      // If the latest character is correct
      if (inputChar === targetChar && value.length === correctLength) {
        playCorrectSound();
        errorPlayedRef.current = false;
      } else {
        // Only trigger error buzzer once per incorrect character position
        if (!errorPlayedRef.current) {
          playErrorSound();
          setErrorsCount((prev) => prev + 1);
          errorPlayedRef.current = true;
        }
      }
    } else {
      errorPlayedRef.current = false;
    }

    // Check if game is completed
    if (value === textToType) {
      handleGameFinish();
    }
  };

  // Calculate live WPM and Accuracy
  useEffect(() => {
    if (startTime && !isFinished) {
      const minutes = elapsedTime / 60;
      if (minutes > 0) {
        // WPM = (characters / 5) / minutes
        const calculatedWpm = (correctLength / 5) / minutes;
        setWpm(calculatedWpm);
      }

      if (totalKeystrokes > 0) {
        // Accuracy = (total keystrokes - errors) / total keystrokes * 100
        const calculatedAcc = Math.max(0, ((totalKeystrokes - errorsCount) / totalKeystrokes) * 100);
        setAccuracy(calculatedAcc);
      }
    }
  }, [inputValue, elapsedTime, totalKeystrokes, errorsCount, startTime, isFinished, correctLength]);

  const handleGameFinish = async () => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    playVictorySound();

    // Final stat calculations
    const finalTime = elapsedTime || 1; // avoid divide by zero
    const finalWpm = (textToType.length / 5) / (finalTime / 60);
    const finalAcc = totalKeystrokes > 0 ? Math.max(0, ((totalKeystrokes - errorsCount) / totalKeystrokes) * 100) : 100;

    setWpm(finalWpm);
    setAccuracy(finalAcc);

    // Auto save score to Firestore
    await saveScoreToFirestore(finalWpm, finalAcc, errorsCount);
  };

  const saveScoreToFirestore = async (finalWpm: number, finalAcc: number, finalErrors: number) => {
    setSavingScore(true);
    setSaveError(null);
    try {
      const scoreData: Score = {
        name: playerName,
        wpm: Math.round(finalWpm * 10) / 10,
        accuracy: Math.round(finalAcc * 10) / 10,
        errors: finalErrors,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "typeracer_scores"), scoreData);
      setSavedDocId(docRef.id);
      setScoreSaved(true);
    } catch (err: any) {
      console.error("Error saving score:", err);
      setSaveError("Оноог хадгалахад алдаа гарлаа. Гэхдээ таны амжилт орон нутагт хадгалагдсан.");
    } finally {
      setSavingScore(false);
    }
  };

  const handleRestart = () => {
    // Select new random text
    const filtered = GAME_TEXTS.filter((t) => t.difficulty === difficulty);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    setGameText(filtered[randomIndex] || GAME_TEXTS[0]);

    setInputValue("");
    setStartTime(null);
    setElapsedTime(0);
    setIsFinished(false);
    setTotalKeystrokes(0);
    setErrorsCount(0);
    setWpm(0);
    setAccuracy(100);
    setScoreSaved(false);
    setSaveError(null);
    setSavedDocId(undefined);
    errorPlayedRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);

    // Auto focus
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setMutedState(nextMuted);
  };

  // Rendering character list with appropriate coloring
  const renderTextCharacters = () => {
    const chars = textToType.split("");

    return (
      <div className="text-lg md:text-xl font-sans tracking-wide leading-relaxed font-medium select-none text-slate-800 dark:text-neutral-200">
        {chars.map((char, index) => {
          let colorClass = "text-slate-400 dark:text-neutral-600";
          let bgClass = "";
          let isCursor = index === inputValue.length;

          if (index < correctLength) {
            // Correctly typed
            colorClass = "text-emerald-600 dark:text-emerald-400 font-semibold";
          } else if (index >= correctLength && index < inputValue.length) {
            // Incorrectly typed (the typo block)
            colorClass = "text-rose-600 dark:text-rose-400 font-semibold";
            bgClass = "bg-rose-100 dark:bg-rose-950/40 rounded px-0.5";
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

  const progressPercentage = (correctLength / textToType.length) * 100;
  const hasTypingError = inputValue.length > correctLength;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4" id="game-screen-container">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6" id="game-top-bar">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold cursor-pointer"
          id="exit-game-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Гарах
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700">
            Тоглогч: <strong className="text-slate-950">{playerName}</strong>
          </span>
          <button
            onClick={handleToggleMute}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all cursor-pointer"
            id="game-mute-btn"
          >
            {muted ? <VolumeX className="w-4.5 h-4.5 text-rose-500" /> : <Volume2 className="w-4.5 h-4.5 text-emerald-500" />}
          </button>
        </div>
      </div>

      {/* Visual Racing Track */}
      <Track progress={progressPercentage} vehicle={vehicle} isFinished={isFinished} />

      {/* Real-time stats */}
      <StatsDisplay
        wpm={wpm}
        accuracy={accuracy}
        errors={errorsCount}
        elapsedTime={elapsedTime}
        isComplete={isFinished}
      />

      {/* Main Game Card */}
      {!isFinished ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6 relative">
          {/* Difficulty and Source Badge */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 text-xs">
            <span className="font-mono text-slate-400">Эх сурвалж: {gameText.source}</span>
            <span className="font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              {difficulty === "easy" ? "Хялбар" : difficulty === "medium" ? "Дундаж" : "Хэцүү"}
            </span>
          </div>

          {/* Text Area */}
          <div className="mb-6 p-5 bg-slate-50 border border-slate-100 rounded-xl min-h-24 flex items-center">
            {renderTextCharacters()}
          </div>

          {/* Typing Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={startTime ? "Үргэлжлүүлэн бичнэ үү..." : "Энд бичиж эхэлснээр цаг эхэлнэ..."}
              className={`w-full px-5 py-4 text-base bg-slate-50 border-2 rounded-xl focus:outline-none transition-all ${
                hasTypingError
                  ? "border-rose-500 focus:ring-4 focus:ring-rose-100 focus:bg-rose-50/20"
                  : "border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white"
              }`}
              disabled={isFinished}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              id="game-text-input"
            />
            {hasTypingError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500 animate-pulse bg-rose-50 px-2 py-1 rounded border border-rose-200">
                Алдаатай байна!
              </span>
            )}
          </div>

          {/* Typing help overlay tips */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Keyboard className="w-4 h-4 text-slate-300" />
            <span>Зөвлөмж: Алдаагаа устгаж зассаны дараа урагшаа хөдөлнө.</span>
          </div>
        </div>
      ) : (
        /* Game Over Celebratory Panel */
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

          {/* Saving Status Alert */}
          <div className="max-w-md mx-auto p-4 border rounded-xl mb-8 flex items-center justify-center gap-3 bg-slate-50 border-slate-200">
            {savingScore ? (
              <div className="flex items-center gap-2 text-slate-600">
                <RotateCw className="w-4 h-4 animate-spin text-slate-500" />
                <span className="text-xs font-bold">Оноог Firestore руу хадгалж байна...</span>
              </div>
            ) : scoreSaved ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-bold">Таны оноо шилдэг Leaderboard-д хадгалагдлаа!</span>
              </div>
            ) : saveError ? (
              <div className="flex flex-col gap-1.5 items-center">
                <div className="flex items-center gap-1.5 text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold">{saveError}</span>
                </div>
                <button
                  onClick={() => saveScoreToFirestore(wpm, accuracy, errorsCount)}
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors"
                >
                  Дахин хадгалах
                </button>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="game-restart-btn"
            >
              <RotateCw className="w-4 h-4" />
              Дахин тоглох
            </button>

            <button
              onClick={() => onViewLeaderboard(savedDocId)}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-extrabold text-sm transition-all shadow-md cursor-pointer"
              id="game-leaderboard-btn"
            >
              Leaderboard харах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
