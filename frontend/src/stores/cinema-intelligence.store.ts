import { create } from 'zustand';
import api from '@/lib/axios';
import type {
  SeatScore,
  SeatRanking,
  HeatmapEntry,
  HeatmapMode,
  SeatComparisonResult,
  PersonalizedRecommendation,
  CinemaUserPreference,
  SeatExplanation,
  ViewingPreference,
  PositionPreference,
  PriorityPreference,
  WatchingWith,
} from '@/types';

interface CinemaIntelligenceState {
  // Data
  scores: SeatScore[];
  rankings: SeatRanking | null;
  heatmapData: HeatmapEntry[];
  heatmapMode: HeatmapMode;
  selectedSeat: SeatScore | null;
  selectedExplanation: SeatExplanation | null;
  comparisonSeats: SeatScore[];
  comparisonResult: SeatComparisonResult | null;
  userPreferences: CinemaUserPreference | null;
  recommendation: PersonalizedRecommendation | null;

  // UI State
  isLoading: boolean;
  isCalculating: boolean;
  showExperienceModal: boolean;
  showComparisonPanel: boolean;
  showPreferenceWizard: boolean;
  error: string | null;

  // Actions
  calculateScores: (layoutId: string, force?: boolean) => Promise<void>;
  fetchScores: (layoutId: string) => Promise<void>;
  fetchRankings: (layoutId: string) => Promise<void>;
  fetchHeatmap: (layoutId: string, mode?: HeatmapMode) => Promise<void>;
  setHeatmapMode: (mode: HeatmapMode) => void;
  selectSeat: (seat: SeatScore) => void;
  clearSelectedSeat: () => void;
  fetchExplanation: (seatScoreId: string) => Promise<void>;
  addToComparison: (seat: SeatScore) => void;
  removeFromComparison: (seatId: string) => void;
  clearComparison: () => void;
  compareSeats: (layoutId: string) => Promise<void>;
  savePreferences: (prefs: {
    viewingPreference: ViewingPreference;
    positionPreference: PositionPreference;
    priorityPreference: PriorityPreference;
    watchingWith: WatchingWith;
  }) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  getRecommendations: (
    layoutId: string,
    prefs?: {
      viewingPreference?: ViewingPreference;
      positionPreference?: PositionPreference;
      priorityPreference?: PriorityPreference;
      watchingWith?: WatchingWith;
    },
  ) => Promise<void>;
  setShowExperienceModal: (show: boolean) => void;
  setShowComparisonPanel: (show: boolean) => void;
  setShowPreferenceWizard: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  scores: [],
  rankings: null,
  heatmapData: [],
  heatmapMode: 'overall' as HeatmapMode,
  selectedSeat: null,
  selectedExplanation: null,
  comparisonSeats: [],
  comparisonResult: null,
  userPreferences: null,
  recommendation: null,
  isLoading: false,
  isCalculating: false,
  showExperienceModal: false,
  showComparisonPanel: false,
  showPreferenceWizard: false,
  error: null,
};

export const useCinemaIntelligenceStore = create<CinemaIntelligenceState>(
  (set, get) => ({
    ...initialState,

    calculateScores: async (layoutId, force = false) => {
      set({ isCalculating: true, error: null });
      try {
        await api.post(`/cinema-intelligence/layouts/${layoutId}/calculate`, {
          force,
        });
        // After calculation, fetch the results
        await get().fetchScores(layoutId);
        await get().fetchRankings(layoutId);
        await get().fetchHeatmap(layoutId, get().heatmapMode);
      } catch (err: any) {
        set({
          error:
            err.response?.data?.message || 'Failed to calculate scores',
        });
      } finally {
        set({ isCalculating: false });
      }
    },

    fetchScores: async (layoutId) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.get(
          `/cinema-intelligence/layouts/${layoutId}/scores`,
        );
        set({ scores: data.data || data });
      } catch (err: any) {
        if (err.response?.status !== 404) {
          set({
            error:
              err.response?.data?.message || 'Failed to fetch scores',
          });
        }
      } finally {
        set({ isLoading: false });
      }
    },

    fetchRankings: async (layoutId) => {
      try {
        const { data } = await api.get(
          `/cinema-intelligence/layouts/${layoutId}/rankings`,
        );
        set({ rankings: data.data || data });
      } catch {
        // Rankings may not exist yet — that's OK
      }
    },

    fetchHeatmap: async (layoutId, mode = 'overall') => {
      try {
        const { data } = await api.get(
          `/cinema-intelligence/layouts/${layoutId}/heatmap`,
          { params: { mode } },
        );
        set({ heatmapData: data.data || data, heatmapMode: mode });
      } catch {
        // Heatmap may not exist yet
      }
    },

    setHeatmapMode: (mode) => set({ heatmapMode: mode }),

    selectSeat: (seat) =>
      set({
        selectedSeat: seat,
        showExperienceModal: true,
        selectedExplanation: null,
      }),

    clearSelectedSeat: () =>
      set({
        selectedSeat: null,
        showExperienceModal: false,
        selectedExplanation: null,
      }),

    fetchExplanation: async (seatScoreId) => {
      try {
        const { data } = await api.get(
          `/cinema-intelligence/seats/${seatScoreId}/explain`,
        );
        set({ selectedExplanation: data.data || data });
      } catch {
        // Explanation fetch failed — non-critical
      }
    },

    addToComparison: (seat) => {
      const current = get().comparisonSeats;
      if (current.length >= 4) return;
      if (current.find((s) => s.seatId === seat.seatId)) return;
      set({ comparisonSeats: [...current, seat] });
    },

    removeFromComparison: (seatId) => {
      set({
        comparisonSeats: get().comparisonSeats.filter(
          (s) => s.seatId !== seatId,
        ),
        comparisonResult: null,
      });
    },

    clearComparison: () =>
      set({ comparisonSeats: [], comparisonResult: null }),

    compareSeats: async (layoutId) => {
      const seats = get().comparisonSeats;
      if (seats.length < 2) return;

      try {
        const { data } = await api.post(
          `/cinema-intelligence/layouts/${layoutId}/compare`,
          { seatIds: seats.map((s) => s.seatId) },
        );
        set({
          comparisonResult: data.data || data,
          showComparisonPanel: true,
        });
      } catch (err: any) {
        set({
          error: err.response?.data?.message || 'Failed to compare seats',
        });
      }
    },

    savePreferences: async (prefs) => {
      try {
        const { data } = await api.post(
          '/cinema-intelligence/preferences',
          prefs,
        );
        set({ userPreferences: data.data || data });
      } catch (err: any) {
        set({
          error: err.response?.data?.message || 'Failed to save preferences',
        });
      }
    },

    fetchPreferences: async () => {
      try {
        const { data } = await api.get('/cinema-intelligence/preferences');
        set({ userPreferences: data.data || data });
      } catch {
        // No preferences stored yet
      }
    },

    getRecommendations: async (layoutId, prefs = {}) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.post(
          `/cinema-intelligence/layouts/${layoutId}/recommend`,
          prefs,
        );
        set({ recommendation: data.data || data });
      } catch (err: any) {
        set({
          error:
            err.response?.data?.message || 'Failed to get recommendations',
        });
      } finally {
        set({ isLoading: false });
      }
    },

    setShowExperienceModal: (show) => set({ showExperienceModal: show }),
    setShowComparisonPanel: (show) => set({ showComparisonPanel: show }),
    setShowPreferenceWizard: (show) => set({ showPreferenceWizard: show }),

    reset: () => set(initialState),
  }),
);
