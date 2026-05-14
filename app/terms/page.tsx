import Link from 'next/link'
import { ArrowLeft, ScrollText } from 'lucide-react'

const LAST_UPDATED = 'May 14, 2026'

export const metadata = {
  title: 'Terms of Service — Zentra',
  description: 'The terms that govern your use of Zentra.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12 group text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Terms of Service</span>
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              By accessing or using Zentra ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service. These terms apply to all users, whether or not
              you have created an account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. What Zentra does</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Zentra analyses publicly available GitHub repositories and produces automated reports covering
              code quality, security patterns, architecture, and production readiness. Reports are generated
              using a combination of static analysis rules and the Claude AI API (Anthropic).
              Zentra only analyses public repositories accessible via the GitHub public API.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed text-sm mb-3">You agree not to:</p>
            <ul className="space-y-2">
              {[
                'Use the Service to analyse repositories you do not have permission to analyse. (Note: all repositories analysable by Zentra are already public on GitHub.)',
                'Attempt to circumvent rate limits, plan limits, or access controls.',
                'Use automated scripts or bots to submit analysis requests in bulk.',
                'Use the Service in any way that violates GitHub\'s Terms of Service or API usage policies.',
                'Attempt to reverse-engineer, disassemble, or extract proprietary logic from the Service.',
                'Misrepresent analysis results or use them to deceive others.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Accounts</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              You are responsible for maintaining the security of your account credentials. You may not share
              your account with others or use another person's account without their permission.
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Free and paid plans</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Zentra offers a free tier with a limited number of analyses per month and a paid Pro plan
              with higher or unlimited limits. Plan limits are enforced per account and reset at the
              start of each calendar month. We reserve the right to modify plan limits and pricing with
              reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Accuracy of reports</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Analysis reports are generated automatically and may contain errors, false positives, or
              missed issues. Reports are intended to assist developers in identifying potential problems —
              they are not a guarantee of code quality, security, or fitness for production.
              You are solely responsible for any decisions made based on Zentra reports.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Intellectual property</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Zentra and its original content, features, and functionality are owned by Zentra and protected
              by applicable intellectual property laws. Analysis reports generated for your repositories are
              yours to use. You may not reproduce or redistribute the Zentra platform itself.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Third-party services</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Zentra uses the GitHub API to fetch repository data and the Anthropic Claude API to enhance
              analysis results. Use of these services is subject to their respective terms of service.
              We are not affiliated with GitHub or Anthropic beyond standard API usage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              To the fullest extent permitted by law, Zentra is provided "as is" without warranties of any kind.
              We are not liable for any damages arising from your use of the Service, reliance on analysis reports,
              or interruptions to the Service. Our total liability to you shall not exceed the amount you paid
              for the Service in the three months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              You may stop using the Service at any time. We reserve the right to suspend or terminate your
              access if you violate these Terms. Upon termination, your right to use the Service ceases
              immediately. Account data deletion is handled per our{' '}
              <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-amber-400 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to these terms</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We may update these Terms from time to time. Material changes will be communicated by updating
              the "Last updated" date and, where appropriate, notifying users by email.
              Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Questions about these Terms can be directed via our{' '}
              <a
                href="https://github.com/Cedie99/Zentra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-amber-400 transition-colors"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
