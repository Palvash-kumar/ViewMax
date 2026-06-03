'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain,
  Wand2,
  RefreshCw,
  Loader2,
  AlertCircle,
  GitCompareArrows,
} from 'lucide-react';
import { useCinemaIntelligenceStore } from '@/stores/cinema-intelligence.store';
import SeatHeatmap from '@/components/intelligence/SeatHeatmap';
import SeatExperienceModal from '@/components/intelligence/SeatExperienceModal';
import SeatComparison from '@/components/intelligence/SeatComparison';
import RankingsPanel from '@/components/intelligence/RankingsPanel';
import PreferenceWizard from '@/components/intelligence/PreferenceWizard';
import RecommendationCard from '@/components/intelligence/RecommendationCard';
import type { SeatScore, HeatmapMode } from '@/types';

export default function IntelligenceDashboardPage() {
  const params = useParams();
  const layoutId = params.layoutId as string;

  const {
    scores,
    rankings,
    heatmapData,
    heatmapMode,
    selectedSeat,
    selectedExplanation,
    comparisonSeats,
    comparisonResult,
    recommendation,
    isLoading,
    isCalculating,
    showExperienceModal,
    showComparisonPanel,
    showPreferenceWizard,
    error,
    calculateScores,
    fetchScores,
    fetchRankings,
    fetchHeatmap,
    setHeatmapMode,
    selectSeat,
    clearSelectedSeat,
    fetchExplanation,
    addToComparison,
    removeFromComparison,
    clearComparison,
    compareSeats,
    getRecommendations,
    setShowComparisonPanel,
    setShowPreferenceWizard,
    reset,
  } = useCinemaIntelligenceStore();

  // Load data on mount
  useEffect(() => {
    if (layoutId) {
      fetchScores(layoutId);
      fetchRankings(layoutId);
      fetchHeatmap(layoutId, heatmapMode);
    }
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId]);

  const handleModeChange = useCallback(
    (mode: HeatmapMode) => {
      setHeatmapMode(mode);
      fetchHeatmap(layoutId, mode);
    },
    [layoutId, setHeatmapMode, fetchHeatmap],
  );

  const handleSeatClick = useCallback(
    (seat: SeatScore) => {
      selectSeat(seat);
    },
    [selectSeat],
  );

  const handleCompare = useCallback(
    (seat: SeatScore) => {
      addToComparison(seat);
      clearSelectedSeat();
      setShowComparisonPanel(true);
    },
    [addToComparison, clearSelectedSeat, setShowComparisonPanel],
  );

  const handleRankingSeatSelect = useCallback(
    (seatId: string) => {
      const seat = scores.find((s) => s.seatId === seatId);
      if (seat) selectSeat(seat);
    },
    [scores, selectSeat],
  );

  const handleRecommendationView = useCallback(
    (seatId: string) => {
      const seat = scores.find((s) => s.seatId === seatId);
      if (seat) selectSeat(seat);
    },
    [scores, selectSeat],
  );

  const handleWizardComplete = useCallback(
    (prefs: any) => {
      setShowPreferenceWizard(false);
      getRecommendations(layoutId, prefs);
    },
    [layoutId, setShowPreferenceWizard, getRecommendations],
  );

  const handleCalculate = useCallback(() => {
    calculateScores(layoutId, true);
  }, [layoutId, calculateScores]);

  const comparisonSeatIds = useMemo(
    () => comparisonSeats.map((s) => s.seatId),
    [comparisonSeats],
  );

  const hasScores = scores.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Hero Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(10,14,26,0) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                >
                  <Brain size={20} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-text-primary">
                    Cinema Intelligence
                  </h1>
                  <p className="text-xs text-text-muted">
                    Seat Experience Analysis & Recommendations
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Preference Wizard Button */}
              <button
                onClick={() => setShowPreferenceWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#c4b5fd',
                }}
              >
                <Wand2 size={16} />
                <span className="hidden sm:inline">Find My Seat</span>
              </button>

              {/* Comparison toggle */}
              {comparisonSeats.length > 0 && (
                <button
                  onClick={() => setShowComparisonPanel(!showComparisonPanel)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: '#c084fc',
                  }}
                >
                  <GitCompareArrows size={16} />
                  <span className="hidden sm:inline">
                    Compare ({comparisonSeats.length})
                  </span>
                </button>
              )}

              {/* Calculate / Recalculate */}
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: hasScores
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.15))',
                  border: hasScores
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(59,130,246,0.3)',
                  color: hasScores ? '#94a3b8' : '#93c5fd',
                }}
              >
                {isCalculating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                <span className="hidden sm:inline">
                  {isCalculating
                    ? 'Calculating...'
                    : hasScores
                      ? 'Recalculate'
                      : 'Calculate Scores'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {!hasScores && !isLoading && !isCalculating ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <Brain size={36} className="text-blue-400/60" />
            </div>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
              Ready to Analyze
            </h2>
            <p className="text-sm text-text-muted max-w-md mb-6">
              Click &ldquo;Calculate Scores&rdquo; to compute experience metrics for every
              seat in this theatre. This requires 3D data to be generated first.
            </p>
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#93c5fd',
                boxShadow: '0 0 30px rgba(59,130,246,0.1)',
              }}
            >
              {isCalculating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Brain size={16} />
              )}
              {isCalculating ? 'Calculating...' : 'Calculate Seat Scores'}
            </button>
          </motion.div>
        ) : (
          // Dashboard layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main area: Heatmap */}
            <div className="lg:col-span-2 space-y-6">
              <SeatHeatmap
                scores={scores}
                heatmapData={heatmapData}
                heatmapMode={heatmapMode}
                onModeChange={handleModeChange}
                onSeatClick={handleSeatClick}
                selectedSeatId={selectedSeat?.seatId}
                comparisonSeatIds={comparisonSeatIds}
              />

              {/* Comparison panel (below heatmap) */}
              {showComparisonPanel && comparisonSeats.length > 0 && (
                <SeatComparison
                  seats={comparisonSeats}
                  result={comparisonResult}
                  isOpen={showComparisonPanel}
                  onClose={() => {
                    setShowComparisonPanel(false);
                    clearComparison();
                  }}
                  onRemoveSeat={removeFromComparison}
                  onCompare={() => compareSeats(layoutId)}
                />
              )}

              {/* Recommendation card */}
              {recommendation && (
                <RecommendationCard
                  recommendation={recommendation}
                  onViewSeat={handleRecommendationView}
                />
              )}
            </div>

            {/* Sidebar: Rankings */}
            <div className="space-y-6">
              {rankings && (
                <RankingsPanel
                  rankings={rankings}
                  onSeatSelect={handleRankingSeatSelect}
                />
              )}

              {/* Quick Stats */}
              {rankings && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-display font-semibold text-text-primary mb-3">
                    Theatre Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: 'Total Seats',
                        value: scores.length,
                        color: '#94a3b8',
                      },
                      {
                        label: 'Elite',
                        value: rankings.categoryDistribution.elite,
                        color: '#22c55e',
                      },
                      {
                        label: 'Excellent',
                        value: rankings.categoryDistribution.excellent,
                        color: '#3b82f6',
                      },
                      {
                        label: 'Avoid',
                        value: rankings.categoryDistribution.avoid,
                        color: '#ef4444',
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-xl text-center"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <p
                          className="text-xl font-display font-bold tabular-nums"
                          style={{ color: stat.color }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Experience Modal */}
      {selectedSeat && (
        <SeatExperienceModal
          seat={selectedSeat}
          explanation={selectedExplanation}
          isOpen={showExperienceModal}
          onClose={clearSelectedSeat}
          onCompare={handleCompare}
          onFetchExplanation={fetchExplanation}
        />
      )}

      {/* Preference Wizard */}
      {showPreferenceWizard && (
        <PreferenceWizard
          onComplete={handleWizardComplete}
          onClose={() => setShowPreferenceWizard(false)}
        />
      )}
    </div>
  );
}
