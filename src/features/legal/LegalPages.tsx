import { Markdown } from '@/components/common';
import { Card } from '@/components/ui/card';
import { PublicShell } from '@/features/passport/PublicPassportPage';

const UPDATED = 'October 8, 2026';

const TERMS = `
# Terms of Use

*Last updated ${UPDATED}*

FINLAB is an **educational finance simulation** operated as an early beta. By creating an account you agree to these terms.

## 1. Educational use only — not investment advice
Everything on FINLAB — lessons, challenges, scores, ratings, target prices, market events and portfolio results — is for **learning and practice**. Nothing on FINLAB is investment, financial, legal or tax advice, or a recommendation to buy or sell any security. Do not make real investment decisions based on FINLAB content.

## 2. Simulated money and sample data
The portfolio simulator uses **virtual money only**. Market data is **curated sample data** that is illustrative and static; it is not real-time or historical market data and may not reflect actual prices.

## 3. Your account
- Provide accurate information and keep your password secure.
- One account per person. Do not share accounts.
- You can delete your account at any time in **Settings**.

## 4. Fair play
Scores, ranks, achievements and certificates must reflect your own work. You must not:
- share or publish challenge or exam answers,
- submit work that is not your own,
- automate submissions, exploit bugs, or attempt to manipulate scores or rankings,
- harass other users or post unlawful content.

We may adjust scores, revoke achievements or certificates, or suspend accounts that break these rules.

## 5. Certificates
FINLAB PH certificates attest that the holder completed FINLAB's own programs or competitions, or (where the certificate says so) was **awarded** it by a FINLAB administrator for the reason shown on its verification page. They are **not** accredited professional qualifications (such as the CFA designation) and are not endorsed by any regulator, university or employer. Certificates marked **TEST** are created by administrators to test the platform and are **not credentials**. We may revoke a certificate that was obtained unfairly.

## 5a. Invitations
During the closed beta, accounts require an invite code. Do not share your code publicly; codes may be limited, switched off or expire.

## 5b. Peer review
When you review another analyst's pitch you must be honest, constructive and respectful. Reviews are anonymous to the author but visible to administrators.

## 6. Your content
You keep ownership of pitches, reports and models you create. You grant FINLAB permission to store and display them as needed to run the service, and to show content you mark **public** on your Finance Passport.

## 7. Beta service
FINLAB is provided **"as is"** during the beta. Features may change, and data may occasionally be reset or lost. To the extent permitted by law, FINLAB is not liable for losses arising from use of the service.

## 8. Changes
We may update these terms. Material changes will be announced in the app.

## 9. Contact
Questions? Use the **Feedback** button in the app.
`;

const PRIVACY = `
# Privacy Notice

*Last updated ${UPDATED}*

This notice explains what FINLAB collects and why, in line with the Philippine **Data Privacy Act of 2012 (RA 10173)**.

## What we collect
| Data | Why |
|---|---|
| Name, email, password (stored hashed by our auth provider) | To create and secure your account |
| Country, university, specialization, interests, experience, goal | Onboarding, recommendations and leaderboards |
| Invite code used to join | To run the closed beta and see which invitations are used |
| Your work: answers, pitches, reports, models, trades, decisions, flashcard progress, daily challenge answers, capstone links and summaries | To score your work and build your track record |
| Peer reviews you write or receive | To provide anonymous peer feedback |
| Calculated data: scores, skills, ranks, achievements, certificates | Core features of the platform |
| Feedback you send, including the page and browser type | To fix bugs and improve FINLAB |
| Activity such as streaks, XP and sign-in time | To show your progress and to understand how the platform is used |

We do **not** collect payment information, and we do **not** sell your data or use it for advertising.

## Who can see what
- **Public profile on** (default): your name, school, level, scores, ranks, achievements, certificates and work you mark public appear on your Finance Passport and leaderboards.
- **Public profile off:** you are hidden from other users on leaderboards and your passport link stops working.
- **Certificates** can be verified by anyone who has the code, so that employers can check them.
- **Administrators** can see account and submission data (including your email address, invite code, feedback, peer reviews you wrote and capstone links) to review work, run competitions, give awards and provide support. Administrators may export data to keep backups.
- **Peer reviews** are anonymous to the pitch's author; the author sees "Peer analyst #N", not your name.

## Where data is stored
FINLAB uses **Supabase** (database and authentication) and **GitHub Pages** (website hosting). Data may be processed outside the Philippines by these providers.

## Your rights
Under the Data Privacy Act you have the right to be informed, to access and correct your data, to object, to ask for blocking or erasure, to data portability and to claim damages. In practice you can view and edit your profile in **Settings**, control your visibility, and **permanently delete your account** in Settings, which deletes your profile and all associated work, scores and certificates. For other requests (for example a copy of your data), use the Feedback button and an administrator will respond. You may also lodge a complaint with the **National Privacy Commission** (privacy.gov.ph).

## Retention
Data is kept while your account exists. When you delete your account it is removed from the live database; backups, if any, expire on the provider's schedule.
`;

export function TermsPage() {
  return (
    <PublicShell>
      <Card className="mx-auto max-w-3xl p-6 sm:p-10">
        <Markdown>{TERMS}</Markdown>
      </Card>
    </PublicShell>
  );
}

export function PrivacyPage() {
  return (
    <PublicShell>
      <Card className="mx-auto max-w-3xl p-6 sm:p-10">
        <Markdown>{PRIVACY}</Markdown>
      </Card>
    </PublicShell>
  );
}
