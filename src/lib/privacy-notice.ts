import {
  privacyNoticeLastUpdated,
  researchContactEmail,
} from "./server-env";

export type PrivacyNoticeSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PrivacyNotice = {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PrivacyNoticeSection[];
};

export function privacyNotice(): PrivacyNotice {
  const contactEmail = researchContactEmail();

  return {
    title: "Privacy Notice",
    lastUpdated: privacyNoticeLastUpdated(),
    intro: [
      "This notice explains how personal data is handled in the AI System Scenario Study.",
      "No direct identifiers are requested. Responses are analyzed in de-identified form, but the data is treated as pseudonymous or de-identified personal data during collection and cleaning because free text and technical metadata can sometimes indirectly identify a person.",
    ],
    sections: [
      {
        heading: "Controller and Contact",
        paragraphs: [
          "Controller: Juho Koskela, independent researcher.",
          `Research contact: ${contactEmail}.`,
        ],
      },
      {
        heading: "Purpose",
        paragraphs: [
          "The purpose is to conduct and analyze an academic or independent survey about how respondents interpret fictional AI-system scenarios. The study compares how people distinguish emotion-related behavior, affect-like internal processes, actual feeling, inner experience, welfare-directed precaution, and general developer caution.",
          "Results may be reported in aggregated, de-identified form in research writing, public summaries, preregistration materials, or related analysis outputs.",
        ],
      },
      {
        heading: "Legal Basis",
        paragraphs: [
          "The legal basis for processing survey responses is consent. Participation is voluntary, and refusing to participate has no consequences.",
          "The legal basis for limited operational processing, such as security, abuse prevention, troubleshooting, and service reliability, is legitimate interests in running a secure and reliable research website.",
          "You may stop at any time by closing the page. You may also withdraw consent later by contacting the research contact, where your response can still be located and has not already been cleaned, aggregated, or otherwise de-linked.",
        ],
      },
      {
        heading: "Data Collected",
        bullets: [
          "Survey answers, scenario ratings, attention-check and comprehension-check answers.",
          "Optional free-text answers. Please do not include names, contact details, employer names, school names, or other identifying details.",
          "Broad background and optional demographic answers, such as field/domain, large-language-model usage, age range, country or region, and education level.",
          "Recruitment source from web-address tags and from the survey item asking how you found the survey.",
          "Coarse technical metadata, such as device type, browser family, timestamps, page timings, completion time, and session identifier.",
          "Temporary rate-limit counters may be derived from coarse request metadata using a private keyed hash. These counters are kept in application process memory for abuse prevention and are not stored in the survey response database.",
          "The survey application database does not store raw Internet Protocol (IP) addresses or raw user-agent strings.",
        ],
      },
      {
        heading: "Recipients and Processors",
        paragraphs: [
          "The survey is deployed on Amazon Web Services (AWS), and survey response data is stored and retained in Sweden.",
          "Research collaborators involved in analysis may access de-identified or cleaned data. Public sharing is limited to cleaned data with direct or accidental identifiers removed from free text.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Raw or pseudonymous response data is retained for up to 24 months after collection closes, or until publication or project completion, whichever is later.",
          "Cleaned, de-identified analysis data may be retained longer for reproducibility. Free-text answers are reviewed for accidental identifying information before any sharing or publication.",
        ],
      },
      {
        heading: "Your Rights",
        paragraphs: [
          "Subject to General Data Protection Regulation (GDPR) conditions and practical feasibility, you may request access, rectification, erasure, restriction of processing, and data portability where applicable. Because the survey does not request direct identifiers, some rights requests may require you to provide enough information to locate your response.",
          "You may withdraw consent at any time by using the withdrawal control on this page while your browser still has the survey withdrawal token, or by contacting the research contact. Withdrawal does not affect processing that already occurred before withdrawal, and it may not be possible to remove data that has already been fully de-identified or aggregated.",
        ],
      },
      {
        heading: "Complaint Route",
        paragraphs: [
          "You may lodge a complaint with a supervisory authority. In Finland, the supervisory authority is the Office of the Data Protection Ombudsman.",
          "Office of the Data Protection Ombudsman: https://tietosuoja.fi/en/home, email tietosuoja(at)om.fi.",
        ],
      },
      {
        heading: "Automated Decision-Making",
        paragraphs: [
          "The survey does not use automated decision-making or profiling that produces legal or similarly significant effects for respondents.",
        ],
      },
    ],
  };
}
