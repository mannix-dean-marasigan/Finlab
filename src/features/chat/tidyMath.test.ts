import { describe, expect, it } from 'vitest';
import { tidyMath } from './tidyMath';

describe('tidyMath', () => {
  it('turns display LaTeX into a bold plain formula', () => {
    expect(tidyMath('Here is the formula: $$\\text{Assets} = \\text{Liabilities} + \\text{Equity}$$')).toBe('Here is the formula:\n\n**Assets = Liabilities + Equity**');
  });
  it('handles fractions, times and percent inline', () => {
    expect(tidyMath('ROE is $\\frac{\\text{Net income}}{\\text{Equity}} \\times 100\\%$.')).toBe('ROE is (Net income) / (Equity) × 100%.');
  });
  it('leaves money and normal text alone', () => {
    expect(tidyMath('It costs $5 and $10 today, or ₱250.')).toBe('It costs $5 and $10 today, or ₱250.');
  });
});
