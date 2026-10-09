/** Gemini sometimes writes formulas as LaTeX ($$\text{Assets} = ...$$). Turns that into plain readable text. */
export function tidyMath(text: string): string {
  const plain = (m: string) =>
    m
      .replace(/\\(?:text|mathrm|textbf|mathbf|operatorname)\{([^{}]*)\}/g, '$1')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) / ($2)')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\div/g, '÷')
      .replace(/\\(?:leq|le)\b/g, '≤')
      .replace(/\\(?:geq|ge)\b/g, '≥')
      .replace(/\\approx/g, '≈')
      .replace(/\\%/g, '%')
      .replace(/\\[,;: ]/g, ' ')
      .replace(/\\left|\\right/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m: string) => `\n\n**${plain(m)}**\n\n`)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m: string) => `\n\n**${plain(m)}**\n\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m: string) => plain(m))
    .replace(/\$([^$\n]*\\[a-zA-Z][^$\n]*)\$/g, (_, m: string) => plain(m)) // inline $...$ only when it holds LaTeX, so "$5" stays
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
