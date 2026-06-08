'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Camera,
  Loader2,
  Save,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Ticket,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/axios';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Notification states
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic counts for quick nav cards
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch bookings count
      api.get('/bookings')
        .then((res) => {
          const bookings = res.data.data.data || res.data.data || [];
          setBookingCount(bookings.length);
        })
        .catch(() => {});

      // Fetch active sessions count
      api.get('/security/sessions')
        .then((res) => {
          const sessions = res.data.data || [];
          setSessionCount(sessions.length);
        })
        .catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if avatar has a valid non-empty string URL or path to prevent 404 errors
  const hasValidAvatar = user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/'));

  const hasChanges = firstName.trim() !== user.firstName || lastName.trim() !== user.lastName;

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      triggerAlert('error', 'First name and Last name are required');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch('/users/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      
      const updatedUser = data.data;
      setUser(updatedUser);
      triggerAlert('success', 'Profile updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      triggerAlert('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      triggerAlert('error', 'Image size must be less than 5MB');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      triggerAlert('error', 'Only image files are allowed');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload file to Cloudinary via backend
      const uploadRes = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadRes.data.data.url;

      // 2. Save avatar URL to user profile
      const updateRes = await api.patch('/users/profile', {
        avatar: imageUrl,
      });

      setUser(updateRes.data.data);
      triggerAlert('success', 'Profile picture updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload profile picture';
      triggerAlert('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').toLowerCase();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] bg-[radial-gradient(ellipse_at_top_right,_var(--color-gold-700)/5,_transparent_50%)] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Banner Notification */}
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-20 right-4 sm:right-12 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ${
                alert.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-950/70 text-emerald-400'
                  : 'border-red-500/20 bg-red-950/70 text-red-400'
              }`}
            >
              <div className={`p-1 rounded-lg ${alert.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {alert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
              <span className="text-sm font-semibold tracking-wide">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Title */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)] animate-pulse" />
              <p className="text-[10px] font-bold text-[var(--color-gold-400)] uppercase tracking-widest">Cinema Account</p>
            </div>
            <h1 className="text-4xl font-black text-gradient-gold font-display tracking-tight leading-none">
              Account Overview
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1.5 text-sm font-medium">
              Manage your cinema credentials, view bookings, and secure your sessions.
            </p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Left Side: Avatar & Verification Status Card */}
          <div className="glass-card p-8 flex flex-col items-center justify-between text-center relative overflow-hidden group">
            {/* Top gold bar glow */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[var(--color-gold-400)] via-[var(--color-gold-500)] to-[var(--color-gold-600)] shadow-[0_1px_15px_rgba(245,158,11,0.5)]" />
            
            <div className="w-full flex flex-col items-center">
              {/* Profile Image with Upload Trigger */}
              <div className="relative mb-6">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] rounded-full blur-md opacity-25 group-hover:opacity-40 transition duration-300" />
                <div 
                  onClick={handleAvatarClick}
                  className="relative w-36 h-36 rounded-full cursor-pointer overflow-hidden border-2 border-white/5 bg-[var(--color-bg-secondary)] flex items-center justify-center shadow-2xl transition-all duration-300 hover:border-[var(--color-gold-500)]/80 group/avatar"
                >
                  {hasValidAvatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] flex items-center justify-center text-4xl font-black text-gradient-gold font-display">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                  )}

                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-[2px]">
                    <Camera className="w-5 h-5 text-[var(--color-gold-400)] mb-1.5 animate-bounce" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Update Photo</span>
                  </div>

                  {/* Uploading Spinner */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-[var(--color-gold-400)] animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />

              <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display tracking-tight truncate max-w-full leading-tight">
                {user.firstName} {user.lastName}
              </h2>
              
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="capitalize px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] border border-[var(--color-gold-500)]/20 tracking-wider uppercase">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Bottom badges/meta */}
            <div className="w-full pt-6 border-t border-white/5 mt-8 space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-[var(--color-text-muted)]" /> Member Since</span>
                <span className="font-semibold text-[var(--color-text-secondary)]">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4 text-[var(--color-text-muted)]" /> Verification</span>
                {user.isVerified ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold uppercase tracking-wider text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold uppercase tracking-wider text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Account Details & Editing Form */}
          <div className="glass-card p-8 md:col-span-2 flex flex-col justify-between relative">
            <form onSubmit={handleSave} className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-display flex items-center gap-2.5">
                  <UserIcon className="w-5 h-5 text-[var(--color-gold-500)]" /> Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)]/40 focus:bg-white/10 transition-all text-sm font-semibold shadow-inner"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold-500)]/40 focus:bg-white/10 transition-all text-sm font-semibold shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed text-sm font-semibold select-none shadow-inner opacity-75"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                      <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-55" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Authentication Source
                  </label>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/5 shadow-inner">
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                      {user.provider === 'google' ? 'Google Account' : 'Credentials Identity'}
                    </span>
                    <span className="text-[9px] bg-white/5 px-2.5 py-0.5 rounded border border-white/5 font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* Bottom Actions banner - floats when there are modifications */}
            <div className="mt-8 pt-6 border-t border-white/5 min-h-[48px]">
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 15 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 15 }}
                    className="flex flex-col sm:flex-row items-center gap-3 justify-end overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/5 hover:bg-white/10 text-sm font-bold text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer bg-white/3"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      onClick={handleSave}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] hover:shadow-lg hover:shadow-[var(--color-gold-500)]/20 hover:scale-[1.01] active:scale-98 text-[var(--color-bg-primary)] text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Settings
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!hasChanges && (
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs py-2 select-none">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-text-muted)] opacity-60" />
                  Your account details are fully synchronized.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Quick Nav Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Security Dashboard navigation */}
          <Link href="/profile/security" className="group">
            <div className="glass-card p-6 flex flex-col justify-between h-44 transition-all duration-300 hover:bg-white/10 hover:border-[var(--color-gold-500)]/30 hover:translate-y-[-3px] hover:shadow-[0_20px_40px_rgba(245,158,11,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-gold-500)]/5 rounded-full blur-2xl group-hover:bg-[var(--color-gold-500)]/10 transition-all duration-300" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-gold-500)]/10 flex items-center justify-center text-[var(--color-gold-400)] group-hover:bg-[var(--color-gold-500)]/20 transition-all border border-[var(--color-gold-500)]/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 uppercase tracking-widest">
                    Security Center <ExternalLink className="w-3 h-3 opacity-55" />
                  </span>
                </div>
                <h4 className="font-bold text-[var(--color-text-primary)] font-display group-hover:text-[var(--color-gold-400)] transition-colors text-lg">
                  Security Settings
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed font-medium">
                  {sessionCount !== null ? `${sessionCount} active device session${sessionCount !== 1 ? 's' : ''}` : 'View details & session security'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[var(--color-gold-400)] text-xs font-bold uppercase tracking-wider mt-4">
                Verify Activity <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Bookings History navigation */}
          <Link href="/bookings" className="group">
            <div className="glass-card p-6 flex flex-col justify-between h-44 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:translate-y-[-3px] hover:shadow-[0_20px_40px_rgba(168,85,247,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all border border-purple-500/20">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 uppercase tracking-widest">
                    History <ExternalLink className="w-3 h-3 opacity-55" />
                  </span>
                </div>
                <h4 className="font-bold text-[var(--color-text-primary)] font-display group-hover:text-purple-400 transition-colors text-lg">
                  My Movie Tickets
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed font-medium">
                  {bookingCount !== null ? `You have booked ${bookingCount} showtime ticket${bookingCount !== 1 ? 's' : ''}` : 'View your movie ticket history'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-purple-400 text-xs font-bold uppercase tracking-wider mt-4">
                View Bookings <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}
