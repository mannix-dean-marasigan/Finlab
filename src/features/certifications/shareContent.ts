// Ready-to-use LinkedIn copy for a FINLAB certificate (profile description,
// résumé line and post drafts). Pure functions so they can be unit-tested.
import type { CertificateView } from '@/types/domain';
import { ISSUER_NAME, LINKEDIN_ORG_ID } from '@/lib/brand';

export type PostTone = 'professional' | 'story' | 'short';

interface ProgramCopy {
  /** What the learner actually did — written as past-tense achievements. */
  highlights: string[];
  /** LinkedIn skills to add to the certification entry. */
  skills: string[];
  /** Biggest takeaway, for the story-style post. */
  takeaway: string;
  /** Short focus phrase: "hands-on {focus}". */
  focus: string;
  capstone: boolean;
}

const PROGRAMS: Record<string, ProgramCopy> = {
  'Financial Statement Analyst': {
    highlights: [
      'Built and linked income statements, balance sheets and cash flow statements',
      'Derived cash flow from operations and free cash flow using the indirect method',
      'Diagnosed profitability, returns, liquidity and earnings quality with ratio analysis',
      'Assessed credit risk using leverage, interest coverage and covenant headroom',
      'Passed a timed final exam and presented a recorded financial health review of a listed company',
    ],
    skills: ['Financial Statement Analysis', 'Financial Analysis', 'Ratio Analysis', 'Cash Flow Analysis', 'Credit Analysis', 'Accounting'],
    takeaway: 'profit is an opinion, cash is a fact — always check whether earnings turn into cash',
    focus: 'financial statement analysis',
    capstone: true,
  },
  'Equity Valuation Analyst': {
    highlights: [
      'Valued companies with P/E, P/B and EV/EBITDA comparables',
      'Derived justified P/B multiples from ROE, growth and the cost of equity',
      'Built WACC from CAPM and an after-tax cost of debt',
      'Built DCF models with terminal values and sensitivity tables',
      'Passed a timed final exam and defended a blended target price in a recorded presentation',
    ],
    skills: ['Equity Valuation', 'Discounted Cash Flow (DCF)', 'Comparable Company Analysis', 'Weighted Average Cost of Capital (WACC)', 'Financial Modeling', 'Corporate Finance'],
    takeaway: 'a valuation is a range, not a number — the skill is knowing which assumption moves it most',
    focus: 'valuation work',
    capstone: true,
  },
  'Equity Research Associate': {
    highlights: [
      'Structured equity research reports from thesis to risks',
      'Wrote earnings notes analysing results against consensus',
      'Flagged earnings-quality red flags such as receivables outgrowing revenue',
      'Valued income stocks and REITs on dividend yield',
      'Passed a timed exam writing a full investment thesis and pitched a stock to a mock investment committee',
    ],
    skills: ['Equity Research', 'Investment Thesis Development', 'Stock Pitching', 'Financial Analysis', 'Valuation', 'Financial Writing'],
    takeaway: 'a good pitch says what the market is missing and what event will prove it — not just that a company is "good"',
    focus: 'equity research',
    capstone: true,
  },
  'Banking & Credit Analyst': {
    highlights: [
      'Assessed corporate borrowers with leverage, coverage and covenant headroom',
      'Analysed bank earnings: net interest income, NIM, cost-to-income and ROE',
      'Measured asset quality with NPL ratios, coverage and credit costs',
      'Calculated risk-weighted assets, CET1 ratios, LCR and loan-to-deposit ratios',
      'Passed a timed final exam and presented a full review of a listed bank',
    ],
    skills: ['Credit Analysis', 'Bank Analysis', 'Credit Risk', 'Financial Analysis', 'Basel III', 'Risk Management'],
    takeaway: 'banks fail on liquidity and credit, not on headline profit — capital and asset quality tell you more than earnings',
    focus: 'bank and credit analysis',
    capstone: true,
  },
  'Accounting Foundations': {
    highlights: ['Linked the three financial statements', 'Built a cash flow statement with the indirect method', 'Completed hands-on accounting case challenges'],
    skills: ['Accounting', 'Financial Statements', 'Cash Flow Analysis'],
    takeaway: 'every number on one statement has a matching entry somewhere else',
    focus: 'accounting',
    capstone: false,
  },
  'Portfolio Management Essentials': {
    highlights: ['Built diversified portfolios to a mandate', 'Measured risk with volatility, beta and concentration', 'Applied CAPM to set expected returns'],
    skills: ['Portfolio Management', 'Asset Allocation', 'Risk Management', 'CAPM'],
    takeaway: 'diversification is the only free lunch — but only when correlations are genuinely low',
    focus: 'portfolio management',
    capstone: false,
  },
  'Deal Analysis': {
    highlights: ['Modelled accretion/dilution for M&A deals', 'Priced an IPO with a valuation discount and dilution analysis', 'Assessed synergies and deal structure'],
    skills: ['Mergers & Acquisitions (M&A)', 'Accretion/Dilution Analysis', 'IPO Valuation', 'Investment Banking'],
    takeaway: 'an accretive deal is not automatically a good deal — returns on capital decide that',
    focus: 'deal analysis',
    capstone: false,
  },
  'Investment Committee': {
    highlights: ['Sized markets bottom-up and defended assumptions', 'Evaluated projects with NPV, IRR and break-even analysis', 'Wrote investment committee recommendations'],
    skills: ['Investment Analysis', 'Market Sizing', 'Capital Budgeting', 'Business Case Development'],
    takeaway: 'lead with the recommendation, then prove it survives the downside case',
    focus: 'investment committee cases',
    capstone: false,
  },
};

const GENERIC: ProgramCopy = {
  highlights: ['Completed scored lessons and knowledge checks', 'Solved hands-on finance case challenges', 'Met every module\'s passing standard'],
  skills: ['Financial Analysis', 'Finance'],
  takeaway: 'finance is learned by doing the work, not by watching it',
  focus: 'finance work',
  capstone: false,
};

function programName(c: CertificateView): string {
  return c.program?.title ?? c.subtitle;
}

/** Certifications use their certificate title; tracks read better by program name. */
function credName(c: CertificateView): string {
  return c.kind === 'track' ? programName(c) : c.title;
}

export function programCopy(c: CertificateView): ProgramCopy {
  return PROGRAMS[programName(c)] ?? GENERIC;
}

function hashtags(c: CertificateView): string {
  const tags = new Set(['#Finance', '#FINLABPH']);
  for (const s of programCopy(c).skills.slice(0, 3)) {
    const tag = s.replace(/\(.*?\)/g, '').replace(/[^A-Za-z0-9]+/g, '');
    if (tag && tag.length <= 30) tags.add(`#${tag}`);
  }
  if (c.kind === 'competition') tags.add('#CaseCompetition');
  return [...tags].join(' ');
}

/** Program scope, e.g. ["~7 hours", "10 modules"]. */
function stats(c: CertificateView): string[] {
  const out: string[] = [];
  if (c.details.estimated_hours) out.push(`~${Number(c.details.estimated_hours)} hours`);
  if (c.details.modules) out.push(`${c.details.modules} modules`);
  return out;
}

function avgScore(c: CertificateView): number | null {
  return c.details.average_score ? Math.round(Number(c.details.average_score)) : null;
}

function assessment(c: CertificateView, copy: ProgramCopy): string {
  if (c.kind === 'track') return 'Every module is scored on submitted work — no "mark as complete".';
  return copy.capstone
    ? 'It ends with a timed final exam and a recorded capstone presentation scored against a rubric — every module is graded on submitted work.'
    : 'It ends with a timed final exam — every module is graded on submitted work.';
}

/** Text for the "Description" field of the LinkedIn certification entry. */
export function profileDescription(c: CertificateView, verifyUrl: string): string {
  if (c.issue_type === 'admin_award') {
    return [`Awarded by ${ISSUER_NAME}${c.award_reason ? `: ${c.award_reason}` : '.'}`, `Verify: ${verifyUrl}`].join('\n');
  }
  if (c.kind === 'competition') {
    return [
      `${c.subtitle} in ${c.competition?.name ?? c.title}, a ${ISSUER_NAME} finance competition.`,
      'Competed on timed, scored finance cases against other analysts.',
      `Verify: ${verifyUrl}`,
    ].join('\n');
  }
  const copy = programCopy(c);
  const s = stats(c);
  const score = avgScore(c);
  if (score !== null) s.push(`average challenge score ${score}/100`);
  return [
    `${ISSUER_NAME} ${c.kind === 'track' ? 'learning track' : 'certification'} in ${programName(c)}${s.length ? ` (${s.join(', ')})` : ''}.`,
    ...copy.highlights.map((h) => `• ${h}`),
    `Skills: ${copy.skills.join(', ')}`,
    `Verify: ${verifyUrl}`,
  ].join('\n');
}

/** One-line résumé bullet. */
export function resumeLine(c: CertificateView): string {
  const year = new Date(c.issued_at).getFullYear();
  if (c.issue_type === 'admin_award') return `${c.title} (awarded by ${ISSUER_NAME}, ${year})${c.award_reason ? ` — ${c.award_reason}` : ''}.`;
  if (c.kind === 'competition') return `${c.subtitle}, ${c.competition?.name ?? c.title} (${ISSUER_NAME}, ${year})`;
  const copy = programCopy(c);
  const parts = copy.highlights.slice(0, 3).map((h) => h.charAt(0).toLowerCase() + h.slice(1));
  return `${credName(c)} ${c.kind === 'track' ? 'learning track ' : ''}(${ISSUER_NAME}, ${year}) — ${parts.join('; ')}.`;
}

export function linkedInPost(c: CertificateView, verifyUrl: string, tone: PostTone): string {
  const tags = hashtags(c);
  if (c.issue_type === 'admin_award') {
    const why = c.award_reason ? `${c.award_reason}.` : '';
    if (tone === 'short') return `Awarded the ${c.title} by ${ISSUER_NAME} 🎓 ${why}\n\nVerify: ${verifyUrl}\n\n${tags}`;
    if (tone === 'story') return `Grateful to receive the ${c.title} from ${ISSUER_NAME}. 🎓\n\n${why}\n\nIt was a great chance to learn alongside other aspiring analysts — and I'm excited to keep building.\n\nCertificate: ${verifyUrl}\n\n${tags}`;
    return `I'm happy to share that I've been awarded the ${c.title} by ${ISSUER_NAME}! 🎓\n\n${why}\n\nVerify: ${verifyUrl}\n\n${tags}`;
  }
  if (c.kind === 'competition') {
    const comp = c.competition?.name ?? c.title;
    if (tone === 'short') return `${c.subtitle} at ${comp} on ${ISSUER_NAME}! 🏆 Timed, scored finance cases against other analysts.\n\nVerify: ${verifyUrl}\n\n${tags}`;
    if (tone === 'story')
      return `I didn't expect to place when I signed up for ${comp}. 🏆\n\nThe cases were timed and scored on the work itself — numbers, judgment and writing — against analysts I'd never met. I finished: ${c.subtitle}.\n\nWhat it taught me: preparation compounds. The frameworks I'd practised were what I reached for under the clock.\n\nCertificate: ${verifyUrl}\n\n${tags}`;
    return `I'm proud to share that I placed ${c.subtitle} in ${comp}, a ${ISSUER_NAME} finance competition. 🏆\n\nThe competition tested financial analysis, valuation and investment judgment on timed, scored cases.\n\nThank you to everyone who competed — I learned a lot from the challenge.\n\nVerify: ${verifyUrl}\n\n${tags}`;
  }

  const copy = programCopy(c);
  const s = stats(c);
  const what = c.kind === 'track' ? 'learning track' : 'certification';
  if (tone === 'short') {
    return `Just earned the ${credName(c)} ${what} from ${ISSUER_NAME} 🎓 — ${s.length ? `${s.join(' across ')} of ` : ''}hands-on ${copy.focus}${c.kind === 'certification' ? `, a timed exam${copy.capstone ? ' and a recorded capstone' : ''}` : ''}.\n\nVerify: ${verifyUrl}\n\n${tags}`;
  }
  if (tone === 'story') {
    return [
      `I wanted to get better at ${copy.focus} by actually doing it — so I took on the ${programName(c)} ${what} on ${ISSUER_NAME}.`,
      '',
      `Today I earned it. 🎓 ${assessment(c, copy)}`,
      '',
      `My biggest takeaway: ${copy.takeaway}.`,
      '',
      'Along the way I:',
      ...copy.highlights.slice(0, 3).map((h) => `→ ${h}`),
      '',
      `Certificate: ${verifyUrl}`,
      '',
      tags,
    ].join('\n');
  }
  return [
    `I'm happy to share that I've earned the ${credName(c)} ${what} from ${ISSUER_NAME}! 🎓`,
    '',
    `${s.length ? `Over ${s.join(' and ')}, I` : 'In the program, I'}:`,
    ...copy.highlights.map((h) => `✅ ${h}`),
    '',
    'Every module was graded on submitted work, not attendance.' + (avgScore(c) !== null ? ` I finished with an average challenge score of ${avgScore(c)}/100.` : ''),
    '',
    `Skills: ${copy.skills.slice(0, 5).join(' · ')}`,
    '',
    `Verify: ${verifyUrl}`,
    '',
    tags,
  ].join('\n');
}

/** LinkedIn share composer with the text pre-filled (falls back to copy/paste if LinkedIn ignores it). */
export function linkedInShareUrl(text: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

/** LinkedIn "Add licence or certification" form, pre-filled. */
export function linkedInAddCertUrl(c: CertificateView, verifyUrl: string): string {
  const d = new Date(c.issued_at);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.kind === 'competition' ? `${c.subtitle} — ${c.competition?.name ?? c.title}` : c.title,
    organizationName: ISSUER_NAME,
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
    certUrl: verifyUrl,
    certId: c.code,
  });
  // With the company ID, LinkedIn links the entry to the FINLAB PH page (logo included).
  if (LINKEDIN_ORG_ID) params.set('organizationId', LINKEDIN_ORG_ID);
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
