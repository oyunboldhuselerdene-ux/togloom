import { GameText, RacerVehicle } from "./types";

export const GAME_TEXTS: GameText[] = [
  // Easy
  {
    id: "e1",
    text: "Actions speak louder than words, as the old saying goes.",
    difficulty: "easy",
    source: "Proverb"
  },
  {
    id: "e2",
    text: "Education is the window to the world and the greatest wealth in life.",
    difficulty: "easy",
    source: "Inspirational Quote"
  },
  {
    id: "e3",
    text: "Helping others brings joy and makes the world a better place.",
    difficulty: "easy",
    source: "Wisdom"
  },
  {
    id: "e4",
    text: "A healthy mind resides in a healthy body, so daily exercise is vital.",
    difficulty: "easy",
    source: "Health Advice"
  },
  // Medium
  {
    id: "m1",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    difficulty: "medium",
    source: "Winston Churchill"
  },
  {
    id: "m2",
    text: "Everyone is the master of their own destiny, which is achieved through diligence and persistence.",
    difficulty: "medium",
    source: "Personal Development"
  },
  {
    id: "m3",
    text: "Writing and speaking English correctly and beautifully is a great way to communicate with the world.",
    difficulty: "medium",
    source: "Language Study"
  },
  {
    id: "m4",
    text: "The shortest path to your goal is to start doing your work today without postponing it until tomorrow.",
    difficulty: "medium",
    source: "Advice"
  },
  // Hard
  {
    id: "h1",
    text: "The quick brown fox jumps over the lazy dog is an English pangram, containing every letter of the alphabet, which makes it perfect for typing practice.",
    difficulty: "hard",
    source: "Typing Practice"
  },
  {
    id: "h2",
    text: "With technology developing at an incredibly rapid pace, young professionals are constantly proving their competitiveness on the global stage.",
    difficulty: "hard",
    source: "Technology News"
  },
  {
    id: "h3",
    text: "Life is like a long flowing river, and it is important to greet every obstacle with a smile and turn it into a valuable lesson.",
    difficulty: "hard",
    source: "Life Philosophy"
  },
  {
    id: "h4",
    text: "Protecting mother nature is not just the responsibility of governments, but a sacred duty that depends directly on the conscious actions of every citizen.",
    difficulty: "hard",
    source: "Environmental Education"
  }
];

export const RACER_VEHICLES: RacerVehicle[] = [
  {
    id: "car",
    label: "Racing Car",
    emoji: "🚗",
    color: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50"
  },
  {
    id: "rocket",
    label: "Space Rocket",
    emoji: "🚀",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/50"
  },
  {
    id: "horse",
    label: "Fast Horse",
    emoji: "🐎",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50"
  }
];
