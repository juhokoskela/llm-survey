import Link from "next/link";
import { Suspense } from "react";

import { ConsentActions } from "./consent-actions";

const consentItems = [
  "I am at least 18 years old.",
  "I can read and answer this survey in English.",
  "I understand that participation is voluntary.",
  "I understand that I can stop at any time by closing the page.",
  "I understand that my responses may be used for research or analysis.",
  "I understand that no direct identifiers are requested and my responses will be analyzed in de-identified form.",
  "I understand that the scenarios are fictional and not claims about any specific AI product.",
  "I understand that some questions involve emotion-like behavior, system shutdown, and user treatment of AI systems.",
  "I consent to participate.",
];

export default function ConsentPage() {
  return (
    <main className="shell">
      <section className="surface stack">
        <div>
          <h1>Before You Begin</h1>
          <p className="muted">
            Please read the checklist and privacy notice before deciding.
          </p>
        </div>

        <ul className="checklist">
          {consentItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p>
          Read the <Link href="/privacy">privacy notice</Link> before giving
          consent.
        </p>

        <Suspense>
          <ConsentActions />
        </Suspense>
      </section>
    </main>
  );
}
