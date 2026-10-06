import { useQuery, type QueryClient } from '@tanstack/react-query';
import { fetchReferenceData } from '@/services/api/reference';
import { fetchIsAdmin, fetchMyAchievements, fetchMyPreferences, fetchMyProfile, fetchMySkills, fetchMyStats } from '@/services/api/profile';
import { fetchMyRanks } from '@/services/api/compete';
import { useAuth } from './auth';

export const qk = {
  reference: ['reference'] as const,
  profile: (uid: string) => ['profile', uid] as const,
  isAdmin: (uid: string) => ['isAdmin', uid] as const,
  stats: (uid: string) => ['stats', uid] as const,
  skills: (uid: string) => ['skills', uid] as const,
  prefs: (uid: string) => ['prefs', uid] as const,
  achievements: (uid: string) => ['achievements', uid] as const,
  ranks: (uid: string) => ['ranks', uid] as const,
};

export function useReference() {
  return useQuery({ queryKey: qk.reference, queryFn: fetchReferenceData, staleTime: 30 * 60 * 1000 });
}

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.profile(user?.id ?? ''), queryFn: () => fetchMyProfile(user!.id), enabled: !!user });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.isAdmin(user?.id ?? ''), queryFn: () => fetchIsAdmin(user!.id), enabled: !!user, staleTime: 5 * 60 * 1000 });
}

export function useMyStats() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.stats(user?.id ?? ''), queryFn: () => fetchMyStats(user!.id), enabled: !!user });
}

export function useMySkills() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.skills(user?.id ?? ''), queryFn: () => fetchMySkills(user!.id), enabled: !!user });
}

export function useMyPreferences() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.prefs(user?.id ?? ''), queryFn: () => fetchMyPreferences(user!.id), enabled: !!user });
}

export function useMyAchievements() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.achievements(user?.id ?? ''), queryFn: () => fetchMyAchievements(user!.id), enabled: !!user });
}

export function useMyRanks() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.ranks(user?.id ?? ''), queryFn: fetchMyRanks, enabled: !!user });
}

/** Call after any action that can change scores, ranks or achievements. */
export function invalidateProgress(qc: QueryClient) {
  for (const key of ['stats', 'skills', 'ranks', 'achievements', 'notifications', 'activity', 'leaderboard', 'promotion', 'challengeStates', 'passport']) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}
