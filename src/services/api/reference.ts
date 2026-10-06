import { supabase, unwrap } from '@/lib/supabase';
import type { Achievement, CareerLevel, ChallengeCategory, Skill, Specialization } from '@/types/domain';

export interface ReferenceData {
  careerLevels: CareerLevel[];
  skills: Skill[];
  specializations: Specialization[];
  categories: ChallengeCategory[];
  achievements: Achievement[];
}

/** Small, rarely-changing tables loaded once per session. */
export async function fetchReferenceData(): Promise<ReferenceData> {
  const [levels, skills, specs, cats, ach] = await Promise.all([
    supabase.from('career_levels').select('*').order('rank'),
    supabase.from('skills').select('*').order('sort_order'),
    supabase.from('specializations').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('challenge_categories').select('*').order('sort_order'),
    supabase.from('achievements').select('*').order('sort_order'),
  ]);
  return {
    careerLevels: unwrap(levels) as CareerLevel[],
    skills: (unwrap(skills) as Skill[]).map((s) => ({ ...s, weight: Number(s.weight) })),
    specializations: unwrap(specs) as Specialization[],
    categories: unwrap(cats) as ChallengeCategory[],
    achievements: unwrap(ach) as Achievement[],
  };
}

export interface AppSetting {
  key: string;
  value: unknown;
  description: string;
}

export async function fetchSettings(): Promise<AppSetting[]> {
  return unwrap(await supabase.from('app_settings').select('key, value, description').order('key')) as AppSetting[];
}

export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
  skill_id: string;
  description: string;
}
export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  config: Record<string, number>;
}

export async function fetchRubric(id: 'stock_pitch_v1' | 'research_report_v1'): Promise<Rubric> {
  return unwrap(await supabase.from('scoring_rubrics').select('*').eq('id', id).single()) as Rubric;
}
