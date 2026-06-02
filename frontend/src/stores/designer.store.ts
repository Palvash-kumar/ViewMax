'use client';

import { create } from 'zustand';
import api from '@/lib/axios';
import type {
  TheatreLayout,
  TheatreTemplate,
  LayoutRow,
  LayoutAisle,
  LayoutZone,
  ScreenConfig,
  SeatMapItem,
  SeatCategory,
} from '@/types';

interface DesignerState {
  layout: TheatreLayout | null;
  templates: TheatreTemplate[];
  selectedSeats: string[];
  selectedRow: string | null;
  viewMode: '2d' | '3d';
  isDirty: boolean;
  isSaving: boolean;
  isGenerating: boolean;

  // Actions
  loadTemplates: () => Promise<void>;
  createLayout: (theatreId: string, screenId: string, templateId: string | null, name: string) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  setLayout: (layout: TheatreLayout) => void;

  // Row management
  addRow: () => void;
  removeRow: (label: string) => void;
  updateRow: (label: string, updates: Partial<LayoutRow>) => void;
  reorderRows: (fromIndex: number, toIndex: number) => void;

  // Seat management
  selectSeats: (seatIds: string[]) => void;
  clearSelection: () => void;
  updateSeatCategory: (seatIds: string[], category: SeatCategory) => void;
  toggleSeatStatus: (seatId: string) => void;

  // Aisle management
  addAisle: (aisle: LayoutAisle) => void;
  removeAisle: (index: number) => void;

  // Zone management
  addZone: (zone: LayoutZone) => void;
  removeZone: (index: number) => void;

  // Screen config
  updateScreenConfig: (config: Partial<ScreenConfig>) => void;

  // Persistence
  saveLayout: () => Promise<void>;
  generateLayout: () => Promise<void>;
  publishLayout: () => Promise<void>;

  // View
  setViewMode: (mode: '2d' | '3d') => void;
  selectRow: (label: string | null) => void;
}

function generateSeatMap(rows: LayoutRow[]): SeatMapItem[] {
  const seatMap: SeatMapItem[] = [];
  for (const row of rows) {
    for (let s = 1; s <= row.seatCount; s++) {
      seatMap.push({
        id: `${row.label}${s}`,
        row: row.label,
        seatNumber: s,
        category: row.category,
        status: 'ACTIVE',
      });
    }
  }
  return seatMap;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  layout: null,
  templates: [],
  selectedSeats: [],
  selectedRow: null,
  viewMode: '2d',
  isDirty: false,
  isSaving: false,
  isGenerating: false,

  loadTemplates: async () => {
    try {
      const { data } = await api.get('/theatre-design/templates');
      set({ templates: data.data || data });
    } catch {
      console.error('Failed to load templates');
    }
  },

  createLayout: async (theatreId, screenId, templateId, name) => {
    const { data } = await api.post('/theatre-design/layouts', {
      theatreId,
      screenId,
      templateId: templateId || undefined,
      layoutName: name,
    });
    set({ layout: data.data || data, isDirty: false });
  },

  loadLayout: async (layoutId) => {
    const { data } = await api.get(`/theatre-design/layouts/${layoutId}`);
    set({ layout: data.data || data, isDirty: false });
  },

  setLayout: (layout) => set({ layout, isDirty: false }),

  addRow: () => {
    const { layout } = get();
    if (!layout) return;

    const existingLabels = layout.rows.map((r) => r.label);
    let nextLabel = 'A';
    for (let i = 0; i < 26; i++) {
      const label = String.fromCharCode(65 + i);
      if (!existingLabels.includes(label)) {
        nextLabel = label;
        break;
      }
    }

    const newRow: LayoutRow = {
      label: nextLabel,
      order: layout.rows.length,
      seatCount: layout.rows.length > 0 ? layout.rows[layout.rows.length - 1].seatCount : 16,
      category: 'STANDARD',
      offset: 0,
    };

    const newRows = [...layout.rows, newRow];
    const newSeatMap = generateSeatMap(newRows);

    set({
      layout: {
        ...layout,
        rows: newRows,
        seatMap: newSeatMap,
        totalRows: newRows.length,
        totalCapacity: newSeatMap.filter((s) => s.status === 'ACTIVE').length,
      },
      isDirty: true,
    });
  },

  removeRow: (label) => {
    const { layout } = get();
    if (!layout) return;

    const newRows = layout.rows
      .filter((r) => r.label !== label)
      .map((r, i) => ({ ...r, order: i }));
    const newSeatMap = generateSeatMap(newRows);

    set({
      layout: {
        ...layout,
        rows: newRows,
        seatMap: newSeatMap,
        totalRows: newRows.length,
        totalCapacity: newSeatMap.filter((s) => s.status === 'ACTIVE').length,
      },
      isDirty: true,
      selectedRow: null,
    });
  },

  updateRow: (label, updates) => {
    const { layout } = get();
    if (!layout) return;

    const newRows = layout.rows.map((r) =>
      r.label === label ? { ...r, ...updates } : r,
    );
    const newSeatMap = generateSeatMap(newRows);

    set({
      layout: {
        ...layout,
        rows: newRows,
        seatMap: newSeatMap,
        totalCapacity: newSeatMap.filter((s) => s.status === 'ACTIVE').length,
      },
      isDirty: true,
    });
  },

  reorderRows: (fromIndex, toIndex) => {
    const { layout } = get();
    if (!layout) return;

    const newRows = [...layout.rows];
    const [moved] = newRows.splice(fromIndex, 1);
    newRows.splice(toIndex, 0, moved);
    const reordered = newRows.map((r, i) => ({ ...r, order: i }));

    set({
      layout: { ...layout, rows: reordered },
      isDirty: true,
    });
  },

  selectSeats: (seatIds) => set({ selectedSeats: seatIds }),
  clearSelection: () => set({ selectedSeats: [], selectedRow: null }),

  updateSeatCategory: (seatIds, category) => {
    const { layout } = get();
    if (!layout) return;

    const newSeatMap = layout.seatMap.map((s) =>
      seatIds.includes(s.id) ? { ...s, category } : s,
    );

    set({
      layout: { ...layout, seatMap: newSeatMap },
      isDirty: true,
    });
  },

  toggleSeatStatus: (seatId) => {
    const { layout } = get();
    if (!layout) return;

    const newSeatMap = layout.seatMap.map((s) =>
      s.id === seatId
        ? { ...s, status: s.status === 'ACTIVE' ? ('BLOCKED' as const) : ('ACTIVE' as const) }
        : s,
    );

    set({
      layout: {
        ...layout,
        seatMap: newSeatMap,
        totalCapacity: newSeatMap.filter((s) => s.status === 'ACTIVE').length,
      },
      isDirty: true,
    });
  },

  addAisle: (aisle) => {
    const { layout } = get();
    if (!layout) return;
    set({
      layout: { ...layout, aisles: [...layout.aisles, aisle] },
      isDirty: true,
    });
  },

  removeAisle: (index) => {
    const { layout } = get();
    if (!layout) return;
    set({
      layout: {
        ...layout,
        aisles: layout.aisles.filter((_, i) => i !== index),
      },
      isDirty: true,
    });
  },

  addZone: (zone) => {
    const { layout } = get();
    if (!layout) return;
    set({
      layout: { ...layout, zones: [...layout.zones, zone] },
      isDirty: true,
    });
  },

  removeZone: (index) => {
    const { layout } = get();
    if (!layout) return;
    set({
      layout: {
        ...layout,
        zones: layout.zones.filter((_, i) => i !== index),
      },
      isDirty: true,
    });
  },

  updateScreenConfig: (config) => {
    const { layout } = get();
    if (!layout) return;
    set({
      layout: {
        ...layout,
        screenConfig: { ...layout.screenConfig, ...config },
      },
      isDirty: true,
    });
  },

  saveLayout: async () => {
    const { layout } = get();
    if (!layout) return;

    set({ isSaving: true });
    try {
      const { data } = await api.patch(`/theatre-design/layouts/${layout._id}`, {
        layoutName: layout.layoutName,
        rows: layout.rows,
        aisles: layout.aisles,
        zones: layout.zones,
        screenConfig: layout.screenConfig,
      });
      set({ layout: data.data || data, isDirty: false });
    } finally {
      set({ isSaving: false });
    }
  },

  generateLayout: async () => {
    const { layout, saveLayout } = get();
    if (!layout) return;

    // Save first if dirty
    if (get().isDirty) await saveLayout();

    set({ isGenerating: true });
    try {
      const { data } = await api.post(`/theatre-design/layouts/${layout._id}/generate`);
      set({ layout: data.data || data, isDirty: false, viewMode: '3d' });
    } finally {
      set({ isGenerating: false });
    }
  },

  publishLayout: async () => {
    const { layout } = get();
    if (!layout) return;

    const { data } = await api.post(`/theatre-design/layouts/${layout._id}/publish`);
    set({ layout: data.data || data });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  selectRow: (label) => set({ selectedRow: label }),
}));
