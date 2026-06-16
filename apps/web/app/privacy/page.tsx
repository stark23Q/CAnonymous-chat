import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | NoTrace",
  description: "Privacy Policy for NoTrace — anonymous community chat."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b border-white/10 px-6 py-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg,#8B4AFF,#009FE2)" }}
            aria-hidden="true"
          >
            🎭
          </div>
          <span className="font-semibold text-white">NoTrace</span>
          <span className="text-white/30 mx-1">|</span>
          <span className="text-white/60 text-sm">Privacy Policy</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <section>
          <h1 className="text-3xl font-bold mb-2" style={{ background: "linear-gradient(135deg,#8B4AFF,#009FE2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Privacy Policy
          </h1>
          <p className="text-white/50 text-sm">Last updated: June 2026</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Overview</h2>
          <p className="text-white/70 leading-relaxed">
            NoTrace (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an anonymous community chat platform. We are committed to protecting your privacy. This policy explains what information we collect, how we use it, and what rights you have.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <h3 className="font-medium text-white mb-1">Anonymous Identity</h3>
              <p className="text-white/60 text-sm leading-relaxed">When you join a group, we assign you a randomly generated anonymous persona (name + avatar). This persona is unique per group and is not linked to any real identity.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <h3 className="font-medium text-white mb-1">Session Data</h3>
              <p className="text-white/60 text-sm leading-relaxed">We store session tokens to keep you authenticated. These expire after 30 days. We may log your IP address for security and rate-limiting purposes only.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <h3 className="font-medium text-white mb-1">Messages &amp; Content</h3>
              <p className="text-white/60 text-sm leading-relaxed">Messages you send are stored on our servers to power the chat. Ephemeral messages are automatically deleted after their configured expiry time. Confessions, polls, and Q&amp;A responses are stored anonymously — we cannot link them to your real identity.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <h3 className="font-medium text-white mb-1">What We Do NOT Collect</h3>
              <p className="text-white/60 text-sm leading-relaxed">We do not collect your name, email address, phone number, or any personally identifiable information unless you choose to provide it. We do not sell your data to third parties. We do not run ads.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="space-y-2 text-white/70 text-sm leading-relaxed list-none">
            {[
              "To provide and maintain the NoTrace service",
              "To enforce community guidelines and prevent abuse",
              "To improve app performance and security",
              "To respond to legal requests if required by law"
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "#8B4AFF" }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Data Retention</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            Regular messages are retained as long as the group exists. Ephemeral messages are deleted after their expiry time. If a group is deleted by its admin, all associated messages are permanently removed. Session data is deleted after 30 days of inactivity.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. Cookies &amp; Storage</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            We use HTTP-only cookies to store authentication tokens. We use browser localStorage only for UI preferences (e.g., dismissed prompts). We do not use advertising cookies or third-party tracking.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Third-Party Services</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            We use Railway for hosting and infrastructure. We use Amazon S3-compatible storage for media files. These providers have their own privacy policies. We do not share identifiable user data with them beyond what is technically necessary to operate the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Children&apos;s Privacy</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            NoTrace is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">8. Your Rights</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            Since we collect minimal data and tie it to anonymous personas rather than identities, most traditional data rights do not apply. However, you can:
          </p>
          <ul className="space-y-2 text-white/70 text-sm">
            {[
              "Leave a group at any time (your persona and messages remain unless deleted by an admin)",
              "Ask an admin to delete your messages",
              "Contact us to request deletion of any server-side data associated with your session"
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "#009FE2" }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">9. Changes to This Policy</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            We may update this Privacy Policy from time to time. Changes will be posted at this URL with an updated date. Continued use of NoTrace after changes constitutes acceptance of the new policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">10. Contact Us</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:privacy@notrace.app" className="underline" style={{ color: "#8B4AFF" }}>
              privacy@notrace.app
            </a>
          </p>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} NoTrace. All rights reserved.
        </div>
      </main>
    </div>
  );
}
