import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SyntheticEvent } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export function formatPrice(price: string | number): string {
  const n = parseFloat(price.toString());
  if (n === 0) return 'Free';
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function difficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'text-green-400 bg-green-400/10';
    case 'intermediate': return 'text-yellow-400 bg-yellow-400/10';
    case 'advanced': return 'text-red-400 bg-red-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

export function getErrorMessage(err: any): string {
  return err?.response?.data?.error || err?.message || 'Something went wrong';
}

// Shared fallback for any course/lesson thumbnail <img> — swaps to a local,
// always-available placeholder if the real thumbnail URL 404s or the host
// is unreachable, instead of showing a broken image icon.
export function handleThumbnailError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src.endsWith('/images/course-placeholder.svg')) return; // avoid loop
  img.src = '/images/course-placeholder.svg';
}
