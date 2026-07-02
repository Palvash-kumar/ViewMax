'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Monitor, Pencil, Eye, Box, Plus, Trash2, X, Settings, Film, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { EmptyState, Button } from '@/components/ui';
import type { Theatre, Screen, DemoVideo } from '@/types';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [layoutStatuses, setLayoutStatuses] = useState<Record<string, string>>({});

  // Theatre Modal
  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false);
  const [theatreModalMode, setTheatreModalMode] = useState<'create' | 'edit'>('create');
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  // Screen Modal
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [screenModalMode, setScreenModalMode] = useState<'create' | 'edit'>('create');
  const [selectedScreenForEdit, setSelectedScreenForEdit] = useState<string | null>(null);
  const [screenForm, setScreenForm] = useState({
    name: '',
    screenType: 'STANDARD',
    rows: 10,
    columns: 12,
  });

  const [submitting, setSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Demo Video state
  const [isDemoVideoModalOpen, setIsDemoVideoModalOpen] = useState(false);
  const [demoVideoScreenId, setDemoVideoScreenId] = useState<string | null>(null);
  const [demoVideoScreenName, setDemoVideoScreenName] = useState('');
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [demoVideoLoading, setDemoVideoLoading] = useState(false);
  const [demoVideoUploading, setDemoVideoUploading] = useState(false);
  const [demoVideoTitle, setDemoVideoTitle] = useState('');
  const posterInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/theatres/my')
      .then((res) => {
        const t = res.data.data || [];
        setTheatres(t);
        if (t.length > 0) setSelectedTheatre(t[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTheatre) {
      setScreens([]);
      return;
    }
    api.get(`/theatres/${selectedTheatre}/screens`)
      .then((res) => setScreens(res.data.data || []))
      .catch(() => setScreens([]));

    // Check layout statuses
    api.get(`/theatre-design/theatres/${selectedTheatre}/layouts`)
      .then((res) => {
        const layouts = res.data.data || res.data;
        const statuses: Record<string, string> = {};
        for (const layout of layouts) {
          const screenId = typeof layout.screenId === 'string' ? layout.screenId : layout.screenId?._id;
          if (screenId) statuses[screenId] = layout.status;
        }
        setLayoutStatuses(statuses);
      })
      .catch(() => setLayoutStatuses({}));
  }, [selectedTheatre]);

  const handleOpenCreateTheatre = () => {
    setTheatreForm({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: '',
    });
    setTheatreModalMode('create');
    setIsTheatreModalOpen(true);
  };

  const handleOpenEditTheatre = () => {
    const activeTheatre = theatres.find((t) => t._id === selectedTheatre);
    if (!activeTheatre) return;
    setTheatreForm({
      name: activeTheatre.name,
      description: activeTheatre.description || '',
      address: activeTheatre.address,
      city: activeTheatre.city,
      state: activeTheatre.state,
      country: activeTheatre.country,
    });
    setTheatreModalMode('edit');
    setIsTheatreModalOpen(true);
  };

  const handleTheatreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (theatreModalMode === 'create') {
        const res = await api.post('/theatres', theatreForm);
        const newTheatre = res.data.data;
        setTheatres((prev) => [...prev, newTheatre]);
        setSelectedTheatre(newTheatre._id);
      } else {
        const res = await api.patch(`/theatres/${selectedTheatre}`, theatreForm);
        const updatedTheatre = res.data.data;
        setTheatres((prev) =>
          prev.map((t) => (t._id === selectedTheatre ? updatedTheatre : t))
        );
      }
      setIsTheatreModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save theatre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteTheatre = () => {
    setDeleteConfirmName('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTheatreConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeTheatre = theatres.find((t) => t._id === selectedTheatre);
    if (!activeTheatre) return;

    if (deleteConfirmName !== activeTheatre.name) {
      alert('Theatre name does not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.delete(`/theatres/${selectedTheatre}`);
      const remaining = theatres.filter((t) => t._id !== selectedTheatre);
      setTheatres(remaining);
      if (remaining.length > 0) {
        setSelectedTheatre(remaining[0]._id);
      } else {
        setSelectedTheatre(null);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to delete theatre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateScreen = () => {
    setScreenForm({
      name: '',
      screenType: 'STANDARD',
      rows: 10,
      columns: 12,
    });
    setScreenModalMode('create');
    setIsScreenModalOpen(true);
  };

  const handleOpenEditScreen = (screen: Screen) => {
    setScreenForm({
      name: screen.name,
      screenType: screen.screenType,
      rows: screen.rows,
      columns: screen.columns,
    });
    setSelectedScreenForEdit(screen._id);
    setScreenModalMode('edit');
    setIsScreenModalOpen(true);
  };

  const handleScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (screenModalMode === 'create') {
        const res = await api.post(`/theatres/${selectedTheatre}/screens`, {
          name: screenForm.name,
          screenType: screenForm.screenType,
          rows: Number(screenForm.rows),
          columns: Number(screenForm.columns),
        });
        setScreens((prev) => [...prev, res.data.data]);
      } else {
        const res = await api.patch(`/screens/${selectedScreenForEdit}`, {
          name: screenForm.name,
          screenType: screenForm.screenType,
        });
        const updatedScreen = res.data.data;
        setScreens((prev) =>
          prev.map((s) => (s._id === selectedScreenForEdit ? updatedScreen : s))
        );
      }
      setIsScreenModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save screen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenDelete = async (screenId: string) => {
    if (!confirm('Are you sure you want to delete this screen? This cannot be undone.')) return;
    try {
      await api.delete(`/screens/${screenId}`);
      setScreens((prev) => prev.filter((s) => s._id !== screenId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete screen');
    }
  };

  // ─── Demo Video Handlers ──────────────────────────────────────────────────

  const handleOpenDemoVideos = async (screen: Screen) => {
    setDemoVideoScreenId(screen._id);
    setDemoVideoScreenName(screen.name);
    setIsDemoVideoModalOpen(true);
    setDemoVideoLoading(true);
    try {
      const res = await api.get(`/screens/${screen._id}/demo-videos`);
      setDemoVideos(res.data.data || res.data || []);
    } catch {
      setDemoVideos([]);
    } finally {
      setDemoVideoLoading(false);
    }
  };

  const handleDemoVideoUpload = async () => {
    if (!demoVideoScreenId) return;
    const posterFile = posterInputRef.current?.files?.[0];
    const videoFile = videoInputRef.current?.files?.[0];
    if (!posterFile || !videoFile) {
      alert('Please select both a poster image and a video file');
      return;
    }

    setDemoVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('poster', posterFile);
      formData.append('video', videoFile);
      formData.append('title', demoVideoTitle || 'Demo Video');

      const res = await api.post(
        `/screens/${demoVideoScreenId}/demo-videos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const newVideo = res.data.data || res.data;
      setDemoVideos((prev) => [...prev, newVideo]);
      setDemoVideoTitle('');
      if (posterInputRef.current) posterInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      alert('Failed to upload demo video');
    } finally {
      setDemoVideoUploading(false);
    }
  };

  const handleDemoVideoDelete = async (videoId: string) => {
    if (!confirm('Delete this demo video?')) return;
    try {
      await api.delete(`/demo-videos/${videoId}`);
      setDemoVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch {
      alert('Failed to delete demo video');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-display)]">
            <Building2 className="w-8 h-8 inline-block mr-2 text-[var(--color-gold-400)]" />
            Owner Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Manage your theatres, screens, and layouts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-5 animate-shimmer h-24" />)}
        </div>
      ) : theatres.length === 0 ? (
        <div className="glass-card p-10 text-center flex flex-col items-center justify-center">
          <EmptyState title="No Theatres" description="You haven't added any theatres yet." />
          <Button onClick={handleOpenCreateTheatre} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Theatre
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Theatre sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={handleOpenCreateTheatre}
              className="w-full mb-4 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-600)] text-[var(--color-bg-primary)] hover:shadow-lg hover:shadow-[var(--color-gold-500)]/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Theatre
            </button>
            <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Your Theatres</h3>
            {theatres.map((theatre) => (
              <button
                key={theatre._id}
                onClick={() => setSelectedTheatre(theatre._id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer
                  ${selectedTheatre === theatre._id
                    ? 'bg-[var(--color-gold-500)]/10 border border-[var(--color-gold-500)]/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
              >
                <h4 className="font-medium text-sm">{theatre.name}</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{theatre.city}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase
                  ${theatre.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)]'}`}>
                  {theatre.status}
                </span>
              </button>
            ))}
          </div>

          {/* Screens & Details */}
          <div className="lg:col-span-3">
            {selectedTheatre && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {theatres.find(t => t._id === selectedTheatre)?.name}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {theatres.find(t => t._id === selectedTheatre)?.address}, {theatres.find(t => t._id === selectedTheatre)?.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenEditTheatre}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer text-[var(--color-text-primary)]"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Theatre
                  </button>
                  <button
                    onClick={handleOpenDeleteTheatre}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Theatre
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[var(--color-gold-400)]" /> Screens
              </h3>
              <button
                onClick={handleOpenCreateScreen}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-500)]/20 border border-[var(--color-gold-500)]/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Screen
              </button>
            </div>

            {screens.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {screens.map((screen, i) => {
                  const layoutStatus = layoutStatuses[screen._id];

                  return (
                    <motion.div
                      key={screen._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold">{screen.name}</h4>
                          <button
                            onClick={() => handleOpenEditScreen(screen)}
                            className="p-1 rounded hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
                            title="Edit Screen Settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleScreenDelete(screen._id)}
                            className="p-1 rounded hover:bg-[var(--color-crimson-500)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-crimson-400)] transition-all cursor-pointer"
                            title="Delete Screen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {layoutStatus && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase ${
                              layoutStatus === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : layoutStatus === 'PREVIEW'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {layoutStatus}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400">
                            {screen.screenType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center mb-4">
                        <div>
                          <p className="text-xl font-bold">{screen.capacity}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">Capacity</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold">{screen.rows}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">Rows</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold">{screen.columns}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">Columns</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/owner/theatres/${selectedTheatre}/screens/${screen._id}/designer`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] hover:bg-[var(--color-gold-500)]/20 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Design Layout
                        </button>

                        <button
                          onClick={() => handleOpenDemoVideos(screen)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
                        >
                          <Film className="w-3 h-3" />
                          Videos
                        </button>

                        {(layoutStatus === 'PREVIEW' || layoutStatus === 'PUBLISHED') && (
                          <button
                            onClick={() => router.push(`/owner/theatres/${selectedTheatre}/screens/${screen._id}/preview`)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
                          >
                            <Box className="w-3 h-3" />
                            3D
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No screens configured for this theatre</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theatre Modal */}
      {isTheatreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsTheatreModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--color-gold-400)]" />
              {theatreModalMode === 'create' ? 'Add New Theatre' : 'Edit Theatre Details'}
            </h3>
            <form onSubmit={handleTheatreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  placeholder="e.g. IMAX Palace"
                  className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Description</label>
                <textarea
                  value={theatreForm.description}
                  onChange={(e) => setTheatreForm({ ...theatreForm, description: e.target.value })}
                  placeholder="Describe your cinematic experience..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={theatreForm.address}
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  placeholder="e.g. 123 Cinema Parkway"
                  className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    placeholder="Metropolis"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">State / Prov</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.state}
                    onChange={(e) => setTheatreForm({ ...theatreForm, state: e.target.value })}
                    placeholder="NY"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.country}
                    onChange={(e) => setTheatreForm({ ...theatreForm, country: e.target.value })}
                    placeholder="USA"
                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsTheatreModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  {theatreModalMode === 'create' ? 'Create Theatre' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Screen Modal */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsScreenModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 font-[var(--font-display)] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[var(--color-gold-400)]" />
              {screenModalMode === 'create' ? 'Add New Screen' : 'Edit Screen Settings'}
            </h3>
            <form onSubmit={handleScreenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Screen Name</label>
                <input
                  type="text"
                  required
                  value={screenForm.name}
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                  placeholder="e.g. Screen 1 - Laser Max"
                  className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Screen Format</label>
                <select
                  value={screenForm.screenType}
                  onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all cursor-pointer"
                >
                  <option value="STANDARD" className="bg-[var(--color-bg-primary)]">Standard Screen</option>
                  <option value="TRUE_IMAX" className="bg-[var(--color-bg-primary)]">True IMAX</option>
                  <option value="IMAX_DIGITAL" className="bg-[var(--color-bg-primary)]">IMAX Digital</option>
                  <option value="EPIC" className="bg-[var(--color-bg-primary)]">Epic Screen</option>
                  <option value="DOLBY" className="bg-[var(--color-bg-primary)]">Dolby Cinema</option>
                  <option value="FILM_35MM" className="bg-[var(--color-bg-primary)]">35mm Film</option>
                  <option value="FILM_70MM" className="bg-[var(--color-bg-primary)]">70mm Film</option>
                  <option value="CUSTOM" className="bg-[var(--color-bg-primary)]">Custom Format</option>
                  <option value="SCREEN_X" className="bg-[var(--color-bg-primary)]">ScreenX</option>
                </select>
              </div>

              {screenModalMode === 'create' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Rows (Max 30)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={screenForm.rows}
                      onChange={(e) => setScreenForm({ ...screenForm, rows: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Columns (Max 50)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={screenForm.columns}
                      onChange={(e) => setScreenForm({ ...screenForm, columns: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 focus:border-[var(--color-gold-500)]/50 focus:ring-1 focus:ring-[var(--color-gold-500)]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {screenModalMode === 'edit' && (
                <div className="text-xs text-[var(--color-text-muted)] bg-white/5 p-3 rounded-xl border border-white/5">
                  ⚠️ Seat Grid layout (Rows/Columns) cannot be edited once created to prevent data corruption.
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsScreenModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  {screenModalMode === 'create' ? 'Create Screen' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Theatre Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-[var(--color-crimson-400)] font-[var(--font-display)] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Theatre
            </h3>
            
            <div className="text-sm text-[var(--color-text-muted)] mb-4 space-y-2">
              <p>
                Are you sure you want to delete <span className="font-bold text-[var(--color-text-primary)]">{theatres.find(t => t._id === selectedTheatre)?.name}</span>?
              </p>
              <p className="text-xs text-[var(--color-crimson-400)]/85 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                ⚠️ Warning: This will permanently delete this theatre, including all associated screens, layouts, and seat coordinates. This action cannot be undone.
              </p>
            </div>

            <form onSubmit={handleDeleteTheatreConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Type <span className="text-[var(--color-text-primary)] select-all font-mono font-bold">{theatres.find(t => t._id === selectedTheatre)?.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Type theatre name"
                  className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  disabled={deleteConfirmName !== theatres.find(t => t._id === selectedTheatre)?.name}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed border-none hover:shadow-lg hover:shadow-red-500/20"
                >
                  Delete Permanently
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Demo Video Management Modal */}
      {isDemoVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsDemoVideoModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1 font-[var(--font-display)] flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              Demo Videos
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              {demoVideoScreenName} — Upload demo videos for customers to preview the format experience
            </p>

            {/* Upload new video */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--color-gold-400)]" />
                Upload New Demo Video
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={demoVideoTitle}
                    onChange={(e) => setDemoVideoTitle(e.target.value)}
                    placeholder="e.g. IMAX Laser Demo, Dolby Atmos Trailer"
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                      Poster Image
                    </label>
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-[var(--color-text-muted)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 file:cursor-pointer hover:file:bg-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                      Video File
                    </label>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="w-full text-xs text-[var(--color-text-muted)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 file:cursor-pointer hover:file:bg-purple-500/20"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  Videos ≤ 50MB go to Cloudinary CDN. Larger files are stored locally on the server.
                </p>
                <Button
                  variant="primary"
                  onClick={handleDemoVideoUpload}
                  loading={demoVideoUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 border-none"
                >
                  <Upload className="w-4 h-4" />
                  Upload Demo Video
                </Button>
              </div>
            </div>

            {/* Existing videos */}
            <h4 className="text-sm font-semibold mb-3">
              Uploaded Videos ({demoVideos.length})
            </h4>

            {demoVideoLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : demoVideos.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No demo videos uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demoVideos.map((video) => (
                  <div
                    key={video._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="w-16 h-10 rounded-md overflow-hidden shrink-0 bg-white/5">
                      <img
                        src={video.posterUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Storage: {video.videoStorage === 'cloudinary' ? '☁️ Cloudinary CDN' : '💾 Local Server'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDemoVideoDelete(video._id)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-all cursor-pointer"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
