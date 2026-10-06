// Stock pitches, research projects, sources, valuation & financial models.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  FinancialModelRecord,
  ResearchProject,
  ResearchSection,
  Source,
  StockPitch,
  SubmitResult,
  ValuationModel,
} from '@/types/domain';

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function normalizePitch(p: StockPitch): StockPitch {
  return { ...p, current_price: num(p.current_price), target_price: num(p.target_price), score: num(p.score) };
}
function normalizeProject(p: ResearchProject): ResearchProject {
  return { ...p, current_price: num(p.current_price), target_price: num(p.target_price), score: num(p.score) };
}

// ------------------------------------------------------------ Pitches
export async function listMyPitches(userId: string): Promise<StockPitch[]> {
  const rows = unwrap(
    await supabase.from('stock_pitches').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ) as StockPitch[];
  return rows.map(normalizePitch);
}

export async function getPitch(id: string): Promise<StockPitch | null> {
  const row = unwrap(await supabase.from('stock_pitches').select('*').eq('id', id).maybeSingle()) as StockPitch | null;
  return row ? normalizePitch(row) : null;
}

export type PitchDraft = Partial<
  Pick<
    StockPitch,
    | 'company' | 'ticker' | 'exchange' | 'currency' | 'rating' | 'current_price' | 'target_price' | 'valuation_method'
    | 'thesis' | 'catalysts' | 'risks' | 'company_analysis' | 'financial_analysis' | 'forecast' | 'valuation'
    | 'variant_perception' | 'is_public'
  >
>;

export async function createPitch(input: PitchDraft & { format: StockPitch['format']; deadline_at?: string | null }): Promise<StockPitch> {
  const row = unwrap(await supabase.from('stock_pitches').insert(input).select('*').single()) as StockPitch;
  return normalizePitch(row);
}

export async function updatePitch(id: string, patch: PitchDraft): Promise<void> {
  unwrap(await supabase.from('stock_pitches').update(patch).eq('id', id));
}

export async function deletePitch(id: string): Promise<void> {
  unwrap(await supabase.from('stock_pitches').delete().eq('id', id));
}

export async function submitPitch(id: string): Promise<SubmitResult> {
  return unwrap(await supabase.rpc('submit_stock_pitch', { p_pitch: id })) as SubmitResult;
}

// ------------------------------------------------------------ Sources
export async function listSources(parent: { pitchId?: string; projectId?: string }): Promise<Source[]> {
  let q = supabase.from('sources').select('*').order('created_at');
  q = parent.pitchId ? q.eq('stock_pitch_id', parent.pitchId) : q.eq('research_project_id', parent.projectId!);
  return unwrap(await q) as Source[];
}

export async function addSource(
  parent: { pitchId?: string; projectId?: string },
  s: Pick<Source, 'title'> & Partial<Pick<Source, 'url' | 'publisher' | 'published_on' | 'note'>>,
): Promise<Source> {
  return unwrap(
    await supabase
      .from('sources')
      .insert({
        ...s,
        url: s.url?.trim() || null,
        stock_pitch_id: parent.pitchId ?? null,
        research_project_id: parent.projectId ?? null,
      })
      .select('*')
      .single(),
  ) as Source;
}

export async function deleteSource(id: string): Promise<void> {
  unwrap(await supabase.from('sources').delete().eq('id', id));
}

// ------------------------------------------------------------ Research
export async function listMyResearch(userId: string): Promise<ResearchProject[]> {
  const rows = unwrap(
    await supabase.from('research_projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ) as ResearchProject[];
  return rows.map(normalizeProject);
}

export async function getResearch(id: string): Promise<{ project: ResearchProject; sections: ResearchSection[] } | null> {
  const [p, s] = await Promise.all([
    supabase.from('research_projects').select('*').eq('id', id).maybeSingle(),
    supabase.from('research_sections').select('*').eq('project_id', id),
  ]);
  const project = unwrap(p) as ResearchProject | null;
  if (!project) return null;
  return { project: normalizeProject(project), sections: unwrap(s) as ResearchSection[] };
}

export type ResearchMeta = Partial<
  Pick<ResearchProject, 'title' | 'company' | 'ticker' | 'exchange' | 'currency' | 'rating' | 'current_price' | 'target_price' | 'is_public'>
>;

export async function createResearch(meta: ResearchMeta): Promise<ResearchProject> {
  return normalizeProject(unwrap(await supabase.from('research_projects').insert(meta).select('*').single()) as ResearchProject);
}

export async function updateResearch(id: string, patch: ResearchMeta): Promise<void> {
  unwrap(await supabase.from('research_projects').update(patch).eq('id', id));
}

export async function updateSection(sectionId: string, content: string): Promise<void> {
  const res = await supabase.from('research_sections').update({ content }).eq('id', sectionId).select('id');
  const rows = unwrap(res) as { id: string }[];
  if (!rows.length) throw new Error('This report is locked (already submitted).');
}

export async function duplicateResearch(id: string): Promise<string> {
  return unwrap(await supabase.rpc('duplicate_research_project', { p_project: id })) as string;
}

export async function deleteResearch(id: string): Promise<void> {
  unwrap(await supabase.from('research_projects').delete().eq('id', id));
}

export async function submitResearch(id: string): Promise<SubmitResult> {
  return unwrap(await supabase.rpc('submit_research_project', { p_project: id })) as SubmitResult;
}

// ------------------------------------------------------------ Valuation models
export async function listValuationModels(userId: string): Promise<ValuationModel[]> {
  return unwrap(
    await supabase.from('valuation_models').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ) as ValuationModel[];
}

export async function saveValuationModel(
  input: Pick<ValuationModel, 'name' | 'company' | 'ticker' | 'method' | 'currency' | 'current_price' | 'inputs' | 'outputs' | 'notes'>,
  id?: string,
): Promise<ValuationModel> {
  const q = id
    ? supabase.from('valuation_models').update(input).eq('id', id).select('*').single()
    : supabase.from('valuation_models').insert(input).select('*').single();
  return unwrap(await q) as ValuationModel;
}

export async function deleteValuationModel(id: string): Promise<void> {
  unwrap(await supabase.from('valuation_models').delete().eq('id', id));
}

// ------------------------------------------------------------ Financial models
export async function listFinancialModels(userId: string): Promise<FinancialModelRecord[]> {
  return unwrap(
    await supabase.from('financial_models').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ) as FinancialModelRecord[];
}

export async function getFinancialModel(id: string): Promise<FinancialModelRecord | null> {
  return unwrap(await supabase.from('financial_models').select('*').eq('id', id).maybeSingle()) as FinancialModelRecord | null;
}

export async function saveFinancialModel(
  input: Pick<FinancialModelRecord, 'name' | 'company' | 'ticker' | 'currency' | 'unit' | 'data' | 'notes'>,
  id?: string,
): Promise<FinancialModelRecord> {
  const q = id
    ? supabase.from('financial_models').update(input).eq('id', id).select('*').single()
    : supabase.from('financial_models').insert(input).select('*').single();
  return unwrap(await q) as FinancialModelRecord;
}

export async function deleteFinancialModel(id: string): Promise<void> {
  unwrap(await supabase.from('financial_models').delete().eq('id', id));
}
