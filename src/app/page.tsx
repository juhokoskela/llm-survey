import Link from "next/link";

type LandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const params = searchParams ? await searchParams : {};
  const consentParams = new URLSearchParams();
  const source = firstParam(params.src);
  const legacySource = firstParam(params.source);

  if (source) consentParams.set("src", source);
  if (legacySource) consentParams.set("source", legacySource);

  const consentHref = consentParams.size > 0 ? `/consent?${consentParams}` : "/consent";

  return (
    <main className="shell">
      <section className="surface stack">
        <div>
          <h1>AI System Scenario Study</h1>
          <p className="muted">
            A 7-10 minute survey about how people interpret fictional AI-system
            behavior and research findings.
          </p>
        </div>

        <p>
          This survey asks how people interpret short fictional scenarios
          involving AI systems. You will read several scenarios and rate what
          you think they show about the system&apos;s behavior and possible
          internal processes.
        </p>

        <p>
          The scenarios are hypothetical and are not claims about any specific
          real AI product. Your responses will be analyzed in de-identified
          form. No account is required.
        </p>

        <div className="actions">
          <Link className="button" href={consentHref}>
            Start survey
          </Link>
          <Link className="button secondary" href="/privacy">
            Privacy notice
          </Link>
        </div>
      </section>
    </main>
  );
}
