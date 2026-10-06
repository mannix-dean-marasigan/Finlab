import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wordCount(text: string | null | undefined): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function itemCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.split('\n').filter((l) => l.replace(/^[\s\-*•]+/, '').trim() !== '').length;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
