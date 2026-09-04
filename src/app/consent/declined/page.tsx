import Link from "next/link";

export default function DeclinedConsentPage() {
  return (
    <main className="shell">
      <section className="surface stack">
        <h1>No Survey Data Was Stored</h1>
        <p>
          You chose not to participate. You can close this page, or return to
          the start if you selected this by mistake.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/">
            Return to start
          </Link>
        </div>
      </section>
    </main>
  );
}
