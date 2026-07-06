export interface Score {
  id?: string;
  name: string;
  wpm: number;
  accuracy: number;
  errors: number;
  createdAt: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface GameText {
  id: string;
  text: string;
  difficulty: Difficulty;
  source: string;
}

export type VehicleType = "car" | "rocket" | "horse";

export interface RacerVehicle {
  id: VehicleType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  errors: number;
  isHost: boolean;
  isFinished: boolean;
  vehicleId: VehicleType;
  finishedAt: string | null;
}

export interface Room {
  roomCode: string;
  status: "waiting" | "starting" | "racing" | "finished";
  difficulty: Difficulty;
  textToType: string;
  textSource: string;
  createdAt: string;
  players: Record<string, RoomPlayer>;
}

