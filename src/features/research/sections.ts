import type { ResearchSectionKey } from '@/types/domain';

export const RESEARCH_SECTIONS: { key: ResearchSectionKey; title: string; prompt: string; target: number; list?: boolean }[] = [
  { key: 'investment_thesis', title: 'Investment Thesis', prompt: 'State the call, the target and the 2–3 reasons the market is wrong. Quantify.', target: 150 },
  { key: 'company_overview', title: 'Company Overview', prompt: 'Business model, segments and revenue mix, strategy, management.', target: 150 },
  { key: 'industry_overview', title: 'Industry Overview', prompt: 'Market size and growth, structure, regulation, key drivers.', target: 150 },
  { key: 'competitive_analysis', title: 'Competitive Analysis', prompt: 'Positioning vs peers, moat, market share, threats.', target: 150 },
  { key: 'financial_analysis', title: 'Financial Analysis', prompt: 'Historical growth, margins, returns, cash flow and balance sheet, with figures.', target: 200 },
  { key: 'forecast', title: 'Forecast', prompt: 'Explicit assumptions and the resulting revenue / earnings path.', target: 120 },
  { key: 'valuation', title: 'Valuation', prompt: 'Method(s), key inputs, target price derivation, sensitivity.', target: 150 },
  { key: 'catalysts', title: 'Catalysts', prompt: 'One per line, with expected timing.', target: 3, list: true },
  { key: 'risks', title: 'Risks', prompt: 'One per line, with what would signal the risk is materialising.', target: 3, list: true },
  { key: 'conclusion', title: 'Conclusion', prompt: 'Restate the recommendation and what would change your mind.', target: 80 },
];
