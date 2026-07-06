import { motion } from "motion/react";
import { RacerVehicle } from "../types";
import { Flag } from "lucide-react";

export interface MultiplayerRacer {
  id: string;
  name: string;
  progress: number;
  vehicle: RacerVehicle;
  isFinished: boolean;
  isMe: boolean;
}

interface TrackProps {
  progress?: number; // 0 to 100
  vehicle?: RacerVehicle;
  isFinished?: boolean;
  players?: MultiplayerRacer[];
}

export default function Track({ progress = 0, vehicle, isFinished = false, players }: TrackProps) {
  // Bound progress between 0 and 100
  const percentage = Math.min(Math.max(progress, 0), 100);

  if (players && players.length > 0) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden mb-6" id="multiplayer-track-container">
        {/* Decorative Track Details */}
        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 pointer-events-none">
          <span className="flex items-center gap-1">🚩 START</span>
          <span className="text-indigo-400">DUEL RACE!</span>
          <span className="flex items-center gap-1 text-emerald-400 font-extrabold">FINISH 🏁</span>
        </div>

        {/* Lanes stacked vertically */}
        <div className="space-y-6 relative" id="multiplayer-lanes">
          {players.map((p) => {
            const playerPercent = Math.min(Math.max(p.progress, 0), 100);
            return (
              <div 
                key={p.id} 
                className={`relative h-16 bg-gradient-to-r from-slate-800 to-slate-850 rounded-xl flex items-center px-4 overflow-hidden border transition-colors ${
                  p.isMe 
                    ? "border-indigo-500/50 bg-slate-800/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" 
                    : "border-slate-700/80"
                }`}
                id={`lane-${p.id}`}
              >
                {/* Zebra Start Line Pattern */}
                <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-between opacity-30">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-full ${i % 2 === 0 ? "bg-white" : "bg-black"}`}
                    />
                  ))}
                </div>

                {/* Trail */}
                <div
                  className={`absolute left-3 h-1 bg-gradient-to-r ${
                    p.isMe ? "from-indigo-600 to-indigo-400" : "from-slate-600 to-slate-400"
                  } rounded-full opacity-60 transition-all duration-300`}
                  style={{ width: `${Math.max(playerPercent - 4, 0)}%` }}
                />

                {/* Car/Avatar wrapper */}
                <motion.div
                  className="absolute z-20 flex items-center justify-center animate-duration-75"
                  animate={{
                    left: `calc(${playerPercent}% - ${playerPercent > 50 ? "40px" : "10px"})`,
                    scale: p.isFinished ? [1, 1.15, 1] : 1,
                    y: playerPercent > 0 && !p.isFinished ? [-1.5, 1.5, -1.5] : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 70,
                    damping: 15,
                  }}
                  style={{ transformOrigin: "center bottom" }}
                  id={`avatar-wrapper-${p.id}`}
                >
                  <div className="relative flex flex-col items-center">
                    <span className={`text-3xl filter drop-shadow-md select-none transform transition-transform ${
                      p.vehicle.id === "rocket" ? "-rotate-45" : ""
                    } ${p.isFinished ? "animate-bounce" : ""}`}>
                      {p.vehicle.emoji}
                    </span>

                    {/* Mini Player tag */}
                    <span className={`absolute -bottom-5 font-bold font-mono text-[8px] px-1.5 py-0.5 rounded border whitespace-nowrap shadow uppercase ${
                      p.isMe 
                        ? "bg-indigo-600 text-white border-indigo-400" 
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}>
                      {p.isMe ? "YOU" : p.name} ({Math.round(playerPercent)}%)
                    </span>
                  </div>
                </motion.div>

                {/* Zebra Finish Line Pattern */}
                <div className="absolute right-12 top-0 bottom-0 w-3 flex flex-col justify-between opacity-70">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-full ${i % 2 === 0 ? "bg-white" : "bg-black"}`}
                    />
                  ))}
                </div>

                {/* Winner Flag Indicator */}
                <div className="absolute right-3 flex items-center justify-center h-full">
                  <div
                    className={`p-1 rounded-full ${
                      p.isFinished
                        ? "bg-emerald-500 text-white animate-bounce shadow-md"
                        : "bg-slate-700 text-slate-450"
                    } transition-all duration-300`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden mb-6" id="racing-track-container">
      {/* Track Background Accent Lines */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 border-t-2 border-dashed border-slate-700/60 pointer-events-none" />

      {/* Decorative Track Details */}
      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 pointer-events-none">
        <span className="flex items-center gap-1">🚩 START</span>
        <span className="hidden sm:inline">STRAIGHT AHEAD!</span>
        <span className="flex items-center gap-1 text-emerald-400 font-extrabold">FINISH 🏁</span>
      </div>

      {/* Actual Racetrack Canvas */}
      <div className="relative h-20 bg-gradient-to-r from-slate-800 to-slate-850 rounded-xl flex items-center px-4 overflow-hidden border border-slate-700">
        {/* Zebra Start Line Pattern */}
        <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-between opacity-30">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`h-3 w-full ${i % 2 === 0 ? "bg-white" : "bg-black"}`}
            />
          ))}
        </div>

        {/* Lane Center Line */}
        <div className="absolute left-3 right-12 h-0.5 border-t border-dashed border-slate-600/40" />

        {/* Dynamic Trail / Path Completed Visualizer */}
        <div
          className="absolute left-3 h-1 bg-gradient-to-r from-slate-700 to-indigo-500 rounded-full opacity-60 transition-all duration-300"
          style={{ width: `${Math.max(percentage - 4, 0)}%` }}
        />

        {/* Racer Avatar Wrapper (animated with motion) */}
        <motion.div
          className="absolute z-20 flex items-center justify-center"
          animate={{
            left: `calc(${percentage}% - ${percentage > 50 ? "40px" : "10px"})`,
            scale: isFinished ? [1, 1.15, 1] : 1,
            y: progress > 0 && !isFinished ? [-1.5, 1.5, -1.5] : 0, // gallop/bobbing effect
          }}
          transition={{
            type: "spring",
            stiffness: 70,
            damping: 15,
            y: {
              repeat: Infinity,
              duration: vehicle.id === "rocket" ? 0.25 : vehicle.id === "horse" ? 0.35 : 0.45,
              ease: "easeInOut",
            },
          }}
          style={{
            transformOrigin: "center bottom",
          }}
          id="racer-avatar-wrapper"
        >
          <div className="relative flex flex-col items-center">
            {/* Dust / Flame particle effects based on vehicle */}
            {percentage > 0 && !isFinished && (
              <div className="absolute -left-6 bottom-1 flex gap-1 items-center justify-end w-6">
                {vehicle.id === "rocket" && (
                  <motion.span
                    animate={{ scale: [1, 1.8, 0.5], opacity: [0.8, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.15 }}
                    className="text-orange-500 font-mono text-xs leading-none drop-shadow"
                  >
                    🔥
                  </motion.span>
                )}
                {vehicle.id === "car" && (
                  <motion.span
                    animate={{ y: [0, -5], scale: [0.5, 1.2], opacity: [0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                    className="text-slate-400 text-[10px]"
                  >
                    💨
                  </motion.span>
                )}
                {vehicle.id === "horse" && (
                  <motion.span
                    animate={{ x: [0, -8], y: [2, -2], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.25 }}
                    className="text-amber-800 text-[10px] select-none"
                  >
                    ░
                  </motion.span>
                )}
              </div>
            )}

            {/* Selected Racer Avatar Icon */}
            <span
              className={`text-4xl filter drop-shadow-md select-none transform transition-transform ${
                vehicle.id === "rocket" ? "-rotate-45" : ""
              } ${isFinished ? "animate-bounce" : ""}`}
            >
              {vehicle.emoji}
            </span>

            {/* Mini Player Marker */}
            <span className="absolute -bottom-5 bg-slate-900 text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow uppercase">
              YOU ({Math.round(percentage)}%)
            </span>
          </div>
        </motion.div>

        {/* Zebra Finish Line Pattern */}
        <div className="absolute right-12 top-0 bottom-0 w-3 flex flex-col justify-between opacity-70">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`h-3 w-full ${i % 2 === 0 ? "bg-white" : "bg-black"}`}
            />
          ))}
        </div>

        {/* Flashing Winner Flag Indicator */}
        <div className="absolute right-3 flex items-center justify-center h-full">
          <div
            className={`p-1.5 rounded-full ${
              isFinished
                ? "bg-emerald-500 text-white animate-bounce shadow-md"
                : "bg-slate-700 text-slate-400"
            } transition-all duration-300`}
          >
            <Flag className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
