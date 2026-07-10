'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { useDesignerStore } from '@/stores/designer.store';
import DesignerLayout from '@/components/designer/DesignerLayout';
import DesignerToolbar from '@/components/designer/DesignerToolbar';
import RowPanel from '@/components/designer/RowPanel';
import SeatCanvas from '@/components/designer/SeatCanvas';
import PropertiesPanel from '@/components/designer/PropertiesPanel';
import TemplateSelector from '@/components/designer/TemplateSelector';
import api from '@/lib/axios';
import type { Theatre3DDataResponse } from '@/types';

const TheatreViewer = dynamic(
  () => import('@/components/theatre3d/TheatreViewer'),
  { ssr: false },
);

interface PageProps {
  params: Promise<{ theatreId: string; screenId: string }>;
}

export default function DesignerPage({ params }: PageProps) {
  const { theatreId, screenId } = use(params);
  const {
    layout,
    templates,
    viewMode,
    loadTemplates,
    createLayout,
    loadLayout,
  } = useDesignerStore();

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewer3DData, setViewer3DData] = useState<Theatre3DDataResponse | null>(null);

  // Check if layout already exists for this screen
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/theatre-design/theatres/${theatreId}/layouts`);
        const layouts = data.data || data;
        
        // Filter layouts for this specific screen
        const screenLayouts = layouts.filter(
          (l: any) => l.screenId === screenId || l.screenId?._id === screenId
        );

        // Prioritize draft/editable (non-published) layouts
        const draftLayout = screenLayouts.find((l: any) => l.status !== 'PUBLISHED');

        if (draftLayout) {
          await loadLayout(draftLayout._id);
        } else if (screenLayouts.length > 0) {
          // If only published layouts exist, create a new editable draft layout version based on it
          const published = screenLayouts[0];
          const { data: newLayoutRes } = await api.post('/theatre-design/layouts', {
            theatreId,
            screenId,
            layoutName: published.layoutName,
            rows: published.rows,
            aisles: published.aisles,
            zones: published.zones,
            screenConfig: published.screenConfig,
          });
          const newLayout = newLayoutRes.data || newLayoutRes;
          await loadLayout(newLayout._id);
        } else {
          // Fetch the screen to obtain its screenType format
          const { data: screenRes } = await api.get(`/screens/${screenId}`);
          const screen = screenRes.data || screenRes;

          // Fetch the templates list to find a match
          const { data: templatesRes } = await api.get('/theatre-design/templates');
          const templatesList = templatesRes.data || templatesRes;

          // Find the template that matches the screenType format
          const matchingTemplate = templatesList.find(
            (t: any) => t.screenType === screen.screenType
          );

          // ponytail: ScreenX uses 70mm film as its base screen — fall back to FILM_70MM if
          // dedicated SCREEN_X template isn't seeded yet
          const fallbackTemplate = !matchingTemplate && screen.screenType === 'SCREEN_X'
            ? templatesList.find((t: any) => t.screenType === 'FILM_70MM')
            : null;

          const resolvedTemplate = matchingTemplate || fallbackTemplate;

          if (resolvedTemplate) {
            await createLayout(theatreId, screenId, resolvedTemplate._id, `${screen.name} Layout`);
          } else {
            // Fallback if no matching template is found in database
            await loadTemplates();
            setShowTemplateSelector(true);
          }
        }
      } catch (err) {
        console.error('Failed to auto-resolve layout template:', err);
        // Last resort: try fetching templates for manual selection
        await loadTemplates();
        setShowTemplateSelector(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [theatreId, screenId, loadLayout, loadTemplates, createLayout]);

  // Load 3D data when switching to 3D view
  useEffect(() => {
    if (viewMode === '3d' && layout?.generated3DData && layout?._id) {
      (async () => {
        try {
          const { data } = await api.get(`/theatre-design/layouts/${layout._id}/3d-data`);
          setViewer3DData(data.data || data);
        } catch {
          setViewer3DData(null);
        }
      })();
    }
  }, [viewMode, layout?.generated3DData, layout?._id]);

  const handleTemplateSelect = async (templateId: string | null) => {
    setShowTemplateSelector(false);
    setLoading(true);
    try {
      await createLayout(theatreId, screenId, templateId, 'New Layout');
    } finally {
      setLoading(false);
    }
  };

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        templates={templates}
        onSelect={handleTemplateSelect}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--color-gold-500)]/30 border-t-[var(--color-gold-500)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading designer...</p>
        </div>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Failed to load layout</p>
      </div>
    );
  }

  return (
    <DesignerLayout
      toolbar={<DesignerToolbar theatreId={theatreId} />}
      leftPanel={<RowPanel />}
      centerPanel={
        viewMode === '2d' ? (
          <SeatCanvas />
        ) : viewer3DData ? (
          <TheatreViewer data={viewer3DData} />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
            <div className="text-center">
              <p className="text-sm">No 3D data generated yet</p>
              <p className="text-xs mt-1">Click &quot;Generate 3D&quot; in the toolbar</p>
            </div>
          </div>
        )
      }
      rightPanel={<PropertiesPanel />}
    />
  );
}
