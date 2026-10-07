import { describe, expect, it } from 'vitest';
import type { CertificateView } from '@/types/domain';
import { linkedInAddCertUrl, linkedInPost, linkedInShareUrl, profileDescription, resumeLine } from './shareContent';

const URL_ = 'https://example.com/Finlab/verify/FLB-ABCD-1234';
const base: CertificateView = {
  code: 'FLB-ABCD-1234',
  kind: 'certification',
  recipient_name: 'Maria Santos',
  title: 'Certified Banking & Credit Analyst',
  subtitle: 'Banking & Credit Analyst',
  details: { modules: 10, estimated_hours: 7, average_score: 88.4 },
  issued_at: '2026-10-07T03:00:00Z',
  revoked_at: null,
  revoked_reason: null,
  handle: 'maria',
  program: { title: 'Banking & Credit Analyst', level: 'advanced', estimated_hours: 7, description: '' },
  competition: null,
};

describe('LinkedIn share content', () => {
  it('fills the add-certification form', () => {
    const u = new URL(linkedInAddCertUrl(base, URL_));
    expect(u.searchParams.get('name')).toBe('Certified Banking & Credit Analyst');
    expect(u.searchParams.get('organizationName')).toBe('FINLAB PH');
    expect(u.searchParams.get('issueYear')).toBe('2026');
    expect(u.searchParams.get('issueMonth')).toBe('10');
    expect(u.searchParams.get('certId')).toBe('FLB-ABCD-1234');
    expect(u.searchParams.get('certUrl')).toBe(URL_);
  });

  it('writes program-specific copy with the verify link', () => {
    for (const tone of ['professional', 'story', 'short'] as const) {
      const post = linkedInPost(base, URL_, tone);
      expect(post).toContain(URL_);
      expect(post.length).toBeLessThanOrEqual(3000);
      expect(post).toMatch(/#Finance/);
    }
    expect(linkedInPost(base, URL_, 'professional')).toContain('NPL');
    expect(linkedInPost(base, URL_, 'professional')).toContain('average challenge score of 88/100');
    expect(linkedInPost(base, URL_, 'story')).toContain('capstone');
    expect(profileDescription(base, URL_)).toContain('Skills: Credit Analysis');
    expect(resumeLine(base)).toMatch(/^Certified Banking & Credit Analyst \(FINLAB PH, 2026\) — assessed corporate borrowers/);
  });

  it('reads naturally for learning tracks and competitions', () => {
    const track = { ...base, kind: 'track' as const, title: 'Track Certificate — Deal Analysis', subtitle: 'Deal Analysis', program: { ...base.program!, title: 'Deal Analysis' } };
    expect(linkedInPost(track, URL_, 'short')).toContain('the Deal Analysis learning track');
    expect(linkedInPost(track, URL_, 'professional')).not.toContain('capstone');
    const comp = { ...base, kind: 'competition' as const, title: 'FINLAB Beta Cup', subtitle: 'Champion (1st Place)', program: null, competition: { name: 'FINLAB Beta Cup S1', ends_at: '2026-10-01' } };
    expect(linkedInPost(comp, URL_, 'professional')).toContain('Champion (1st Place) in FINLAB Beta Cup S1');
    expect(new URL(linkedInAddCertUrl(comp, URL_)).searchParams.get('name')).toBe('Champion (1st Place) — FINLAB Beta Cup S1');
  });

  it('uses honest wording for admin-awarded certificates', () => {
    const award = { ...base, issue_type: 'admin_award' as const, award_reason: 'Completed the in-person UST valuation workshop' };
    for (const tone of ['professional', 'story', 'short'] as const) {
      const post = linkedInPost(award, URL_, tone);
      expect(post).toContain('UST valuation workshop');
      expect(post).not.toContain('graded on submitted work');
    }
    expect(profileDescription(award, URL_)).toMatch(/^Awarded by FINLAB PH: Completed/);
    expect(resumeLine(award)).toContain('awarded by FINLAB PH');
  });

  it('encodes the post for the share composer', () => {
    expect(linkedInShareUrl('A & B #x')).toBe('https://www.linkedin.com/feed/?shareActive=true&text=A%20%26%20B%20%23x');
  });
});
