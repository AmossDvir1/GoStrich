import type { Workout, WorkoutSummary } from "@/types/workout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WorkoutState {
  workouts: WorkoutSummary[];

  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  getWorkout: (id: string) => WorkoutSummary | undefined;
  clearHistory: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: [],

      addWorkout: (workout) =>
        set((state) => {
          const { gpsPoints: _, ...summary } = workout;
          return { workouts: [summary, ...state.workouts] };
        }),

      removeWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),

      getWorkout: (id) => get().workouts.find((w) => w.id === id),

      clearHistory: () => set({ workouts: [] }),
    }),
    {
      name: "gostrich-workouts",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
