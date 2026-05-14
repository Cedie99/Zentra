import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const LAST_UPDATED = 'May 14, 2026'

export const metadata = {
  title: 'Privacy Policy — Zentra',
  description: 'How Zentra collects, uses, and protects your data.',
}

export default function PrivacyPage() {
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
          <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-green-400" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Privacy Policy</span>
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
          Your Privacy, Explained
        </h1>
        <p className="text-muted-foreground text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zentra is a code analysis tool that generates production readiness reports for public GitHub repositories.
              This policy explains what data we collect, how we use it, and what we never do.
              We've written it to be readable, not to bury important details in legalese.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">What we collect</h2>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Account information</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When you sign in with GitHub, we receive your public GitHub username, display name, and email address.
                  When you sign up with email, we store your email and a bcrypt-hashed password — never the plaintext password.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Analysis reports</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When you run an analysis, we store the resulting report: repository name, health score, issue titles,
                  file paths, line numbers, descriptions, and suggested fixes. We do <strong className="text-foreground">not</strong> store
                  the actual source code of the repository.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Usage data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We track the number of analyses you run per month to enforce plan limits. We do not track
                  page views, clicks, or session behaviour beyond what is necessary for the application to function.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">What we never do</h2>
            <ul className="space-y-2">
              {[
                'We never request GitHub OAuth scopes that grant repository access. Our scope is limited to read:user and user:email.',
                'We never store your source code. Repository files are fetched, analysed in memory, and immediately discarded.',
                'We never sell, rent, or share your data with third parties for advertising or marketing purposes.',
                'We never analyse private repositories. Only public repositories accessible via the GitHub public API are supported.',
                'We never make your analysis reports visible to other users. Reports are private to your account.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">GitHub OAuth</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              If you sign in with GitHub, we request only the{' '}
              <code className="text-xs font-mono text-amber-400 bg-amber-500/8 border border-amber-500/15 px-1.5 py-0.5 rounded">
                read:user user:email
              </code>{' '}
              scopes. These allow us to identify you and associate reports with your account.
              They do not grant access to any repository, organisation, or code.
              You can verify this in the{' '}
              <a
                href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-amber-400 transition-colors"
              >
                GitHub OAuth scopes reference
              </a>
              . You can revoke our access at any time from your{' '}
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-amber-400 transition-colors"
              >
                GitHub Authorized OAuth Apps
              </a>{' '}
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">How we use your data</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Your account information is used solely to authenticate you and associate your reports with your account.
              Analysis reports are stored so you can view your history. We use the Claude AI API (Anthropic) to enhance
              analysis findings — repository file content is sent to Anthropic's API during analysis and is not retained
              by Anthropic beyond the duration of the API request, per their usage policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Data retention</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Analysis reports are retained for as long as your account is active. If you delete your account,
              all associated reports and personal data are permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Security</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Passwords are hashed using bcrypt before storage. GitHub access tokens, if stored, are encrypted at rest.
              All data is transmitted over HTTPS. We do not log or persist repository source code at any point in the
              analysis pipeline.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Changes to this policy</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              If we make material changes to this policy, we will update the "Last updated" date at the top and,
              where appropriate, notify users by email. Continued use of Zentra after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              If you have questions about this policy or want to request deletion of your data,
              open an issue on our{' '}
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
