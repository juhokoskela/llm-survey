import Link from "next/link";

import { researchContactEmail } from "@/lib/server-env";

export function SiteFooter() {
  const contactEmail = researchContactEmail();

  return (
    <footer className="site-foot">
      <div>
        <strong>AI System Scenario Study</strong>
      </div>
      <div>
        Researcher: Juho Koskela &middot; Independent researcher &middot;{" "}
        <Link href="/privacy">Privacy notice</Link> &middot;{" "}
        <a href={`mailto:${contactEmail}`}>Contact</a>
      </div>
    </footer>
  );
}
