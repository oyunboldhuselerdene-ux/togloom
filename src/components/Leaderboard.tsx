import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Score } from "../types";
import { Award, Trophy, Medal, RotateCw, Search, Calendar } from "lucide-react";
import { motion } from "motion/react";

interface LeaderboardProps {
  onBackToMenu: () => void;
  currentScoreId?: string;
}

export default function Leaderboard({ onBackToMenu, currentScoreId }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "typeracer_scores"),
        orderBy("wpm", "desc"),
        limit(50) // Fetch top 50 to allow searching/filtering within top results, but display top 10 by default
      );
      const snapshot = await getDocs(q);
      const loadedScores: Score[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedScores.push({
          id: doc.id,
          name: data.name || "Anonymous",
          wpm: typeof data.wpm === "number" ? Math.round(data.wpm * 10) / 10 : 0,
          accuracy: typeof data.accuracy === "number" ? Math.round(data.accuracy * 10) / 10 : 0,
          errors: typeof data.errors === "number" ? data.errors : 0,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setScores(loadedScores);
    } catch (err: any) {
      console.error("Error fetching leaderboard:", err);
      setError("An error occurred while loading results. Please check your Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const filteredScores = scores
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10); // Strictly show TOP 10 after filter/search or as default

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Earlier";
    }
  };

  // Top 3 positions for the podium
  const topThree = scores.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="leaderboard-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 dark:text-white">
            <Trophy className="w-8 h-8 text-amber-500" />
            TOP 10 Leaderboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The fastest typing speed records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchScores}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:text-neutral-300"
            title="Refresh"
            id="refresh-btn"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-medium">Refresh</span>
          </button>
          <button
            onClick={onBackToMenu}
            className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer"
            id="back-menu-btn"
          >
            Home
          </button>
        </div>
      </div>

      {/* Podium Visualization */}
      {!loading && !error && topThree.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-3 max-w-lg mx-auto mb-10 pt-10 px-2">
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 shadow-sm">
                  <Medal className="w-5 h-5 text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-400 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800 truncate max-w-full text-center dark:text-neutral-200">
                {topThree[1].name}
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500 mb-1">
                {topThree[1].wpm} WPM
              </span>
              <div className="w-full bg-slate-200 border border-slate-300 rounded-t-xl h-20 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-400">2</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, y: 45 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center z-10"
            >
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-700 shadow-md animate-bounce">
                  <Trophy className="w-7 h-7 text-amber-500" />
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow">
                  1
                </div>
              </div>
              <span className="text-sm font-extrabold text-slate-900 truncate max-w-full text-center dark:text-white">
                {topThree[0].name}
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 mb-1">
                {topThree[0].wpm} WPM
              </span>
              <div className="w-full bg-gradient-to-b from-amber-400 to-amber-500 border border-amber-500 rounded-t-xl h-28 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-extrabold text-amber-950">1</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-full bg-slate-55 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 shadow-sm">
                  <Award className="w-5 h-5 text-amber-700" />
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800 truncate max-w-full text-center dark:text-neutral-200">
                {topThree[2].name}
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500 mb-1">
                {topThree[2].wpm} WPM
              </span>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-t-xl h-14 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-400">3</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          id="leaderboard-search"
        />
      </div>

      {/* Score Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-950 dark:border-neutral-900">
        {loading ? (
          <div className="py-20 text-center">
            <RotateCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading top players...</p>
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center text-rose-500">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchScores}
              className="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-medium text-xs hover:bg-rose-100 transition-colors cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
            >
              Try Again
            </button>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-sm">No scores recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to play and write your name in history!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 dark:bg-neutral-900/50 dark:border-neutral-850">
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">Rank</th>
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Player</th>
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Speed (WPM)</th>
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Accuracy</th>
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Errors</th>
                  <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {filteredScores.map((score, index) => {
                  const isCurrent = currentScoreId && score.id === currentScoreId;
                  let rankBadge = null;
                  if (index === 0) rankBadge = "🥇";
                  else if (index === 1) rankBadge = "🥈";
                  else if (index === 2) rankBadge = "🥉";

                  return (
                    <tr
                      key={score.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent
                          ? "bg-amber-50/45 hover:bg-amber-50/60 dark:bg-amber-950/10"
                          : ""
                      }`}
                      id={`score-row-${index}`}
                    >
                      <td className="py-4 px-5 text-center font-bold text-slate-800 dark:text-neutral-200">
                        {rankBadge ? (
                          <span className="text-lg leading-none">{rankBadge}</span>
                        ) : (
                          <span className="text-sm text-slate-400 font-mono">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold text-slate-900 dark:text-white ${isCurrent ? "text-amber-750 dark:text-amber-400 font-bold" : ""}`}>
                            {score.name}
                          </span>
                          {isCurrent && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-300">
                              New!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-extrabold text-slate-900 text-sm dark:text-white">
                        {score.wpm}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-slate-600 text-xs dark:text-neutral-400">
                        {score.accuracy}%
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-slate-600 text-xs dark:text-neutral-400">
                        {score.errors}
                      </td>
                      <td className="py-4 px-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(score.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
