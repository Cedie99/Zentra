import { ShieldCheck, Eye, EyeOff, Lock, ExternalLink, Server, Code2 } from 'lucide-react'

const points = [
  {
    icon: Lock,
    title: 'No repo access — ever',
    description:
      'We only request read:user and user:email from GitHub OAuth. These scopes let us know who you are — they give zero access to any repository, public or private.',
  },
  {
    icon: Server,
    title: 'Analysis runs on our server token',
    description:
      'Public repository files are fetched using our own server-side GitHub token via the public API. Your OAuth token is never used to read code.',
  },
  {
    icon: EyeOff,
    title: 'Your code is never stored',
    description:
      'Files are fetched, analysed in memory, and discarded immediately. We persist the report findings — file paths, issue descriptions, scores — never the source code itself.',
  },
  {
    icon: Eye,
    title: 'Sign-in is optional',
    description:
      'You can analyse any public repository by entering owner/repo — no GitHub account needed at all. Sign in only if you want to save report history.',
  },
]

export function TrustSecurity() {
  return (
    <section id="trust" className="py-28 px-4 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/4 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-wide uppercase mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy &amp; Security
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Your Code Stays <span className="text-green-400">Yours</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Minimal permissions, no code storage, full transparency. Here&apos;s exactly what we access and why.
          </p>
        </div>

        {/* OAuth scope callout — for the skeptics */}
        <div className="mb-8 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Code2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Exact GitHub OAuth scope we request
              </p>
              <code className="text-xs font-mono text-amber-400 bg-amber-500/8 border border-amber-500/15 px-2.5 py-1 rounded-lg inline-block">
                scope: &quot;read:user user:email&quot;
              </code>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This only lets us read your public profile and email address. It does not grant access to any repository — public or private. You can verify this in the{' '}
                <a
                  href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-amber-400 transition-colors"
                >
                  GitHub OAuth scopes reference
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {points.map((point) => (
            <div
              key={point.title}
              className="group bg-card border border-border rounded-2xl p-5 hover:border-green-500/25 transition-colors duration-200"
            >
              <div className="flex gap-4">
                <div className="w-9 h-9 bg-green-500/8 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 tracking-tight">
                    {point.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://github.com/Cedie99/Zentra"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-green-500/30 transition-colors duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            View the source code on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
