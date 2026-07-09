import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | NoTrace",
  description: "Terms of Service for NoTrace — anonymous community chat."
};

export default function TermsOfServicePage() {
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
            ⚖️
          </div>
          <span className="font-semibold text-white">NoTrace</span>
          <span className="text-white/30 mx-1">|</span>
          <span className="text-white/60 text-sm">Terms of Service</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <section>
          <h1 className="text-3xl font-bold mb-2" style={{ background: "linear-gradient(135deg,#8B4AFF,#009FE2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Terms of Service
          </h1>
          <p className="text-white/50 text-sm">Last updated: July 2026</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Description of Service</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            Welcome to NoTrace (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By downloading, accessing, or using the NoTrace application (the &quot;App&quot;), you agree to be bound by these Terms of Service. 
            NoTrace is a platform that provides temporary, ephemeral, and anonymous communication channels. We do not permanently store messages, and we do not verify the true identity of our users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Age Restrictions</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            You must be at least 13 years old to use this App. By using the App, you represent and warrant that you meet this requirement.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. User Conduct and Responsibilities</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            You are solely responsible for the content you transmit through the App. You agree NOT to use the App to:
          </p>
          <ul className="space-y-2 text-white/70 text-sm leading-relaxed list-none">
            {[
              "Transmit illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, or obscene content.",
              "Share non-consensual explicit media or engage in child exploitation (which will result in an immediate ban and report to authorities).",
              "Impersonate any person or entity or falsely state your affiliation.",
              "Distribute spam, malware, or viruses.",
              "Harass, bully, or intimidate other users."
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: "#8B4AFF" }}>→</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-white/70 leading-relaxed text-sm mt-4 font-semibold text-red-400">
            We reserve the right to ban users, block IP addresses, and delete groups at our sole discretion, without prior notice, if we believe you have violated these Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Disclaimer of Liability (User Content)</h2>
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <h3 className="font-medium text-white mb-2">NoTrace is a Neutral Platform</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              We do not proactively monitor, endorse, or verify the accuracy, safety, or legality of the messages, confessions, or media sent by users. You understand that by using the App, you may be exposed to content that is offensive, indecent, or objectionable.
            </p>
            <p className="text-white/80 text-sm leading-relaxed font-semibold">
              Under no circumstances will the developer, creator, or owner of NoTrace be liable in any way for any user-generated content, including any errors, omissions, damages, or losses incurred as a result of the use of such content.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. &quot;As Is&quot; Disclaimer</h2>
          <p className="text-white/70 leading-relaxed text-sm uppercase">
            The App is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We disclaim all warranties, including implied warranties of merchantability and fitness for a particular purpose. We do not warrant that the app will be uninterrupted or secure. We do not guarantee that ephemeral messages cannot be screenshotted or recorded by other users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
          <p className="text-white/70 leading-relaxed text-sm uppercase">
            To the maximum extent permitted by law, in no event shall Malhar Solanki, Cerebulb, or any affiliated developers be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of the use or inability to use the app.
          </p>
          <p className="text-white/90 leading-relaxed text-sm font-semibold">
            Your sole and exclusive remedy for dissatisfaction with the App is to stop using the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Intellectual Property</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            All original content, features, branding, logos, and functionality of the App are owned by Malhar Solanki and are protected by international copyright, trademark, and intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the App without express written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
          <p className="text-white/70 leading-relaxed text-sm">
            If you have questions about these Terms, please contact us at:{" "}
            <a href="mailto:malhar.solanki@cerebulb.com" className="underline" style={{ color: "#8B4AFF" }}>
              malhar.solanki@cerebulb.com
            </a>
          </p>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} Malhar Solanki. All rights reserved.
        </div>
      </main>
    </div>
  );
}
