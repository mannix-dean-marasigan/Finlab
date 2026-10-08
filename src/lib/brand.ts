// Public brand details used on certificates and LinkedIn links.
export const ISSUER_NAME = 'FINLAB PH';
export const LINKEDIN_PAGE_URL = 'https://www.linkedin.com/company/finlab-ph/';
/**
 * LinkedIn's numeric company ID. When set, "Add to profile" links the
 * certification to the FINLAB PH page (so it shows the logo). Find it in the
 * page's admin view URL: linkedin.com/company/<number>/admin/
 */
export const LINKEDIN_ORG_ID = '';

/**
 * Founder section on the About page. Hidden until filled in; only the founder's own words go here.
 * photo: a path under /public (e.g. '/founder.jpg') or a full URL.
 */
export const FOUNDER: { name: string; role: string; photo?: string; story: string[] } | null = null;

/** Public contact email shown on About and FAQ. Hidden while empty. */
export const CONTACT_EMAIL = '';
