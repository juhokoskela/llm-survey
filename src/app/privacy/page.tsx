import { privacyNotice } from "@/lib/privacy-notice";
import { WithdrawalActions } from "./withdrawal-actions";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const notice = privacyNotice();

  return (
    <main className="shell">
      <article className="surface stack">
        <header>
          <h1>{notice.title}</h1>
          <p className="muted">Last updated: {notice.lastUpdated}</p>
        </header>

        {notice.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        {notice.sections.map((section) => (
          <section className="notice-section stack" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <WithdrawalActions />
      </article>
    </main>
  );
}
