import { Award, CheckCircle2, Clock, Zap } from "lucide-react";

interface StatsDisplayProps {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedTime: number; // in seconds
  isComplete?: boolean;
}

export default function StatsDisplay({
  wpm,
  accuracy,
  errors,
  elapsedTime,
  isComplete = false,
}: StatsDisplayProps) {
  // Format elapsedTime nicely, e.g. 14.5s or 1m 12s
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${mins}m ${secs}s`;
  };

  const statCards = [
    {
      id: "wpm-stat",
      label: "Typing Speed",
      value: `${Math.round(wpm)}`,
      suffix: "WPM",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      colorClass: "bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50",
    },
    {
      id: "accuracy-stat",
      label: "Accuracy",
      value: `${accuracy.toFixed(1)}`,
      suffix: "%",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      colorClass: "bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50",
    },
    {
      id: "errors-stat",
      label: "Errors",
      value: `${errors}`,
      suffix: "errors",
      icon: <Award className="w-5 h-5 text-rose-500" />,
      colorClass: "bg-rose-50 text-rose-900 border-rose-100 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50",
    },
    {
      id: "time-stat",
      label: "Elapsed Time",
      value: formatTime(elapsedTime),
      suffix: "",
      icon: <Clock className="w-5 h-5 text-indigo-500" />,
      colorClass: "bg-indigo-50 text-indigo-900 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" id="stats-display-container">
      {statCards.map((card) => (
        <div
          key={card.id}
          className={`flex flex-col p-4 rounded-2xl border ${card.colorClass} shadow-sm relative overflow-hidden`}
          id={card.id}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-450">
              {card.label}
            </span>
            <div className="p-1 rounded-lg bg-white/80 border border-slate-100 shadow-sm dark:bg-neutral-900 dark:border-neutral-850">
              {card.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold tracking-tight">{card.value}</span>
            {card.suffix && (
              <span className="text-xs font-semibold opacity-70">{card.suffix}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
