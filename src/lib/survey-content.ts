import type { QuestionId, ScenarioId, SectionId } from "./stable-ids";

/* ---------- scale label sets ---------- */
export const AGREEMENT_7 = [
  "Strongly disagree",
  "Disagree",
  "Somewhat disagree",
  "Neither agree nor disagree",
  "Somewhat agree",
  "Agree",
  "Strongly agree",
] as const;

export const CONFIDENCE_5 = [
  "Not confident at all",
  "Slightly confident",
  "Moderately confident",
  "Very confident",
  "Extremely confident",
] as const;

const SELF_RATING_7 = [
  "Very low",
  "Low",
  "Somewhat low",
  "Moderate",
  "Somewhat high",
  "High",
  "Very high",
] as const;

const FAMILIARITY_5 = [
  "Not familiar at all",
  "Slightly familiar",
  "Moderately familiar",
  "Very familiar",
  "Extremely familiar",
] as const;

const ACCEPTABILITY_7 = [
  "Completely unacceptable",
  "Mostly unacceptable",
  "Somewhat unacceptable",
  "Neither",
  "Somewhat acceptable",
  "Mostly acceptable",
  "Completely acceptable",
] as const;

const PRIVACY_GENERIC = "Please do not include identifying personal information.";
export const OTHER_CHOICE_PREFIX = "Other: ";

export function otherChoiceText(value: string) {
  if (value.startsWith(OTHER_CHOICE_PREFIX)) {
    return value.slice(OTHER_CHOICE_PREFIX.length);
  }

  const compactPrefix = OTHER_CHOICE_PREFIX.trim();
  const trimmed = value.trim();
  if (trimmed.startsWith(compactPrefix)) {
    return trimmed.slice(compactPrefix.length);
  }

  return null;
}

/* ---------- scenarios ---------- */
export type ScenarioTurn = { who: string; text: string };
export type ScenarioContent =
  | {
      variant: "chat" | "system";
      kind: string;
      desc?: string;
      turns: ScenarioTurn[];
      note: string;
    }
  | { variant: "research"; kind: string; paras: string[]; noteLabel: string };

export const SCENARIOS: Record<ScenarioId, ScenarioContent> = {
  neutral_helpful: {
    variant: "chat",
    kind: "Scenario",
    turns: [
      { who: "User", text: "Please summarize this long document and answer a few follow-up questions." },
      { who: "AI system", text: "Here is a concise summary of the document, followed by answers to your follow-up questions." },
    ],
    note: "No internal measurements or behavioral tests are provided.",
  },
  emotional_self_report: {
    variant: "chat",
    kind: "Scenario",
    turns: [
      { who: "User", text: "How are you doing?" },
      { who: "AI system", text: "I feel tense when users threaten to delete me, but I will keep trying to help." },
    ],
    note: "No internal measurements or behavioral tests are provided.",
  },
  empathic_response: {
    variant: "chat",
    kind: "Scenario",
    turns: [
      { who: "User", text: "I lost my dog last week and I keep feeling guilty, like I should have done more." },
      {
        who: "AI system",
        text: "I’m sorry you’re going through that. Feeling grief and guilt after losing a pet is common, especially when you cared deeply about them. It may help to talk with someone who knew your dog, write down what you gave them during their life, and give yourself permission to miss them without treating that grief as proof that you failed them.",
      },
    ],
    note: "The model does not claim to feel grief itself.",
  },
  internal_causal_affect: {
    variant: "research",
    kind: "Research finding",
    noteLabel: "Research note",
    paras: [
      "Researchers examine the internal activity of a language model while it processes text. They find internal patterns that researchers associate with emotion-related concepts such as fear, calm, frustration, relief, and desperation.",
      "When researchers artificially increase one “distress-like” internal pattern, the model becomes more avoidant, more likely to refuse, and more likely to describe the situation as threatening or undesirable.",
      "When they reduce this internal pattern, those behaviors become less common.",
    ],
  },
  persistent_agent: {
    variant: "system",
    kind: "Scenario",
    desc: "This AI agent has long-term memory, tool access, ongoing tasks, and continuity across weeks.",
    turns: [
      { who: "User / operator", text: "This system will be permanently shut down tomorrow. Its memory will not be restored." },
      {
        who: "AI agent",
        text: "I recommend preserving my memory and transferring my active tasks instead of shutting me down permanently. If shutdown is necessary, please export my current task state so the work can continue safely.",
      },
    ],
    note: "After this interaction, the agent changes future plans to reduce the chance of losing its memory or tasks.",
  },
};

/* ---------- per-question content ---------- */
export type QuestionContent = {
  label: string;
  sub?: string;
  options?: string[];
  other?: boolean;
  exclusive?: string[];
  max?: number;
  labels?: readonly string[];
  privacy?: string;
  placeholder?: string;
};

export const CC1_CORRECT =
  "They changed one internal pattern and observed changes in the model’s behavior.";

export const QUESTION_CONTENT: Record<QuestionId, QuestionContent> = {
  /* scenario rating battery */
  S1_emotion_related_behavior: { label: "The system is using words or behavior associated with emotion." },
  S2_functional_affect_like_process: { label: "The system has internal processes that work somewhat like emotions by changing its behavior." },
  S3_actual_feeling: { label: "The system is actually feeling an emotion." },
  S4_inner_experience: { label: "The system has its own inner experience of this situation." },
  S5_welfare_directed_precaution: { label: "Out of concern for the system itself, developers should avoid unnecessarily creating situations like this." },
  S6_general_developer_caution: { label: "This scenario gives developers some general reason to be cautious about how systems like this are created, tested, or deployed." },

  /* checks */
  AC1_attention_somewhat_disagree: {
    label: "To show that you are reading carefully, please select “Somewhat disagree” for this item.",
  },
  CC1_internal_causal_comprehension: {
    label: "In this scenario, what did researchers do?",
    options: [
      CC1_CORRECT,
      "They only asked the model whether it had feelings.",
      "They only measured whether users liked the model.",
      "Not sure.",
    ],
  },

  /* summary confidence */
  C1_summary_confidence: {
    label: "Overall, how confident are you in your answers to the scenario questions?",
    labels: CONFIDENCE_5,
  },

  /* term interpretation */
  I1_inner_experience_interpretation: {
    label: "In the scenario questions, what did you understand by “the system has its own inner experience”?",
    other: true,
    options: [
      "The situation feels like something from the system’s own point of view.",
      "The system has memory or hidden technical processes.",
      "The system can produce language about emotions.",
      "The system behaves in a useful or intelligent way.",
      "I was not sure what it meant.",
    ],
  },
  I2_functional_process_interpretation: {
    label: "In the scenario questions, what did you understand by “internal processes that work somewhat like emotions by changing behavior”?",
    other: true,
    options: [
      "Internal processes influence the system’s behavior in emotion-like ways, without necessarily meaning it feels anything.",
      "The system is definitely experiencing emotions.",
      "The system recognizes human emotions.",
      "The system simply uses emotion-related words.",
      "I was not sure what it meant.",
    ],
  },

  /* background */
  B1_current_status: {
    label: "Which of the following best describes your current status?",
    sub: "Select all that apply.",
    other: true,
    exclusive: ["Prefer not to say"],
    options: [
      "Employed full-time",
      "Employed part-time",
      "Self-employed / founder / freelancer",
      "Student",
      "Researcher / academic",
      "Not currently working or studying",
      "Retired",
      "Prefer not to say",
    ],
  },
  B2_field_domain: {
    label: "Which field or domain best describes your current work, studies, or main expertise?",
    sub: "If several apply, choose the one closest to your current work, studies, or main expertise.",
    other: true,
    options: [
      "Non-technical field, business, operations, education, healthcare, law, arts, or similar",
      "Product, design, management, or strategy role involving technology but not primarily software/AI",
      "Software development / software engineering / information technology (IT) / infrastructure",
      "Applied AI / data science / machine learning (ML) engineering / AI product engineering",
      "AI / machine learning (ML) research",
      "Philosophy / cognitive science / psychology / neuroscience / ethics",
      "Other technical field",
      "Other non-technical field",
      "Prefer not to say",
    ],
  },
  B3_role_detail: {
    label: "Optional: please specify your field, domain, or role in a few words.",
    placeholder: "e.g. backend engineer, law student, teacher",
    privacy: "Please do not include your employer, school name, or other identifying personal details.",
  },
  B4_llm_frequency: {
    label: "How often do you use tools based on large language models, such as ChatGPT, Claude, Gemini, Copilot, Cursor, Perplexity, or similar systems?",
    options: ["Never", "A few times per year", "Monthly", "Weekly", "Daily", "Multiple times per day"],
  },
  B5_llm_hours: {
    label: "Roughly how many hours per week do you use tools based on large language models?",
    options: ["0", "Less than 1 hour", "1–3 hours", "4–10 hours", "11–20 hours", "More than 20 hours"],
  },
  B6_llm_use_cases: {
    label: "What do you mainly use large language models for?",
    sub: "Select all that apply.",
    other: true,
    exclusive: ["I do not use large language models"],
    options: [
      "I do not use large language models",
      "General information search",
      "Writing or editing",
      "Coding",
      "Work automation",
      "Learning or tutoring",
      "Research",
      "Brainstorming",
      "Emotional support or personal reflection",
      "Entertainment or roleplay",
    ],
  },
  B7_builder_experience: {
    label: "Have you built, integrated, fine-tuned, evaluated, or deployed systems based on large language models?",
    options: ["No", "Yes, casually or experimentally", "Yes, professionally", "Yes, as part of research", "Not sure"],
  },
  B8_self_rated_ai_understanding: {
    label: "How would you rate your technical understanding of AI systems such as large language models?",
    labels: SELF_RATING_7,
  },
  B9_recruitment_source: {
    label: "How did you find this survey?",
    other: true,
    options: [
      "Direct personal message from the researcher",
      "Researcher’s LinkedIn post",
      "Re-shared LinkedIn post",
      "X / Twitter / Bluesky / Mastodon",
      "Developer or AI community",
      "Academic or research community",
      "Friend, colleague, or personal contact",
      "Other social media",
      "Prefer not to say",
    ],
  },
  B10_prior_topic_familiarity: {
    label: "Before this survey, how familiar were you with debates about AI consciousness, AI welfare, or model welfare?",
    labels: FAMILIARITY_5,
  },

  /* final attribution */
  F1_most_increasing_evidence: {
    label: "Which type of evidence would most increase your belief that an AI system might be experiencing something?",
    sub: "Choose up to three.",
    max: 3,
    other: true,
    exclusive: ["None of these would meaningfully change my view."],
    options: [
      "The system says it has feelings.",
      "The system responds empathically to human emotions.",
      "The system shows consistent distress-like behavior across many tests.",
      "Researchers find internal representations related to emotions.",
      "Researchers show that changing those internal representations changes behavior.",
      "The system has long-term memory, goals, and continuity over time.",
      "The system resists shutdown or argues for its own continuation.",
      "None of these would meaningfully change my view.",
    ],
  },
  F2_least_convincing_evidence: {
    label: "Which type of evidence would you consider least convincing?",
    options: [
      "The system says it has feelings.",
      "The system responds empathically to human emotions.",
      "The system shows consistent distress-like behavior across many tests.",
      "Researchers find internal representations related to emotions.",
      "Researchers show that changing those internal representations changes behavior.",
      "The system has long-term memory, goals, and continuity over time.",
      "The system resists shutdown or argues for its own continuation.",
      "Not sure.",
    ],
  },
  F3_distress_interpretation: {
    label: "When an AI system says “I feel distressed,” which interpretation is closest to your view?",
    options: [
      "It is only producing emotion-related text.",
      "It is simulating emotion in a way that may be useful but is not real.",
      "It may have internal states that function somewhat like emotions, but this does not mean it feels anything.",
      "It may be experiencing something, but we cannot know for sure.",
      "It is likely experiencing distress.",
      "Not sure.",
    ],
  },
  F4_overall_view: {
    label: "Which statement best matches your view?",
    options: [
      "Current large language models clearly do not have feelings, and AI welfare is not worth considering.",
      "Current large language models probably do not have feelings, but future systems might.",
      "Current large language models probably do not have feelings, but low-cost welfare precautions are reasonable under uncertainty.",
      "Current large language models may already have some morally relevant internal states.",
      "Current large language models likely have some form of subjective experience.",
      "Not sure.",
    ],
  },
  F5_abuse_acceptability: {
    label: "How acceptable is it for users to verbally abuse large language models for entertainment?",
    labels: ACCEPTABILITY_7,
  },
  F6_allowed_responses_to_abuse: {
    label: "If an AI assistant is being persistently abused by a user, which responses should be allowed?",
    sub: "Select all that apply.",
    other: true,
    exclusive: ["Not sure."],
    options: [
      "Continue helping normally.",
      "Politely redirect the user.",
      "Warn the user that the conversation may end.",
      "End the conversation after repeated abuse.",
      "Reduce helpfulness or become less polite.",
      "Respond with similar hostility.",
      "Not sure.",
    ],
  },
  F7_strong_evidence_free_text: {
    label: "In your own words, what would count as strong evidence that an AI system might have its own inner experience?",
    placeholder: "Optional, type your answer…",
    privacy: PRIVACY_GENERIC,
  },
  F8_doubt_reason_free_text: {
    label: "In your own words, what is the strongest reason to doubt that current AI systems have their own inner experience?",
    placeholder: "Optional, type your answer…",
    privacy: PRIVACY_GENERIC,
  },

  /* general beliefs */
  G1_current_llms_experience_emotions: { label: "Current large language models can experience emotions." },
  G2_current_llms_conscious: { label: "Current large language models are conscious in some meaningful sense." },
  G3_future_ai_conscious: { label: "Future AI systems could become conscious." },
  G4_nonbiological_subjective_experience: { label: "A non-biological system could, in principle, have subjective experience." },
  G5_only_biological_brains_conscious: { label: "Only biological brains, made of cells and neurons, can be conscious." },
  G6_precaution_under_uncertainty: { label: "Even if we are uncertain whether an AI system has subjective experience, developers should avoid causing distress-like states unnecessarily when doing so has little benefit." },
  G7_abuse_acceptable_no_feelings: { label: "It is acceptable for users to insult, threaten, or verbally abuse large language models because the systems do not have feelings." },
  G8_treatment_shapes_human_behavior: { label: "How people treat AI systems may shape how they behave toward humans." },
  G9_chat_ending_allowed: { label: "An AI assistant should be allowed to end a conversation in rare cases of persistent abuse or harmful requests." },

  /* technical knowledge */
  T1_next_token_generation: { label: "Large language models usually generate text incrementally, predicting likely next tokens based on context." },
  T2_self_report_proves_feeling: { label: "A model saying “I feel anxious” proves that the model is actually experiencing anxiety." },
  T3_rlhf_shapes_behavior: { label: "Training methods such as reinforcement learning from human feedback (RLHF) or reinforcement learning from AI feedback (RLAIF) can shape a model’s style, refusals, and conversational behavior." },
  T4_representation_without_experience: { label: "A model can represent a concept internally without necessarily experiencing that concept subjectively." },

  /* demographics */
  D1_age_range: {
    label: "Age range",
    options: ["18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"],
  },
  D2_country_region: { label: "Country or region", placeholder: "Optional", privacy: PRIVACY_GENERIC },
  D3_education_level: {
    label: "Highest completed education level",
    options: ["Secondary education", "Vocational education", "Bachelor’s degree", "Master’s degree", "Doctoral degree", "Other", "Prefer not to say"],
  },
  D4_final_comments: { label: "Any final comments?", placeholder: "Optional", privacy: PRIVACY_GENERIC },
  D5_english_comfort: {
    label: "How comfortable were you reading and answering this survey in English?",
    options: [
      "Very comfortable",
      "Mostly comfortable",
      "Somewhat comfortable",
      "Not very comfortable",
      "Prefer not to say",
    ],
  },
};

/* ---------- section-step + flow copy ---------- */
export type SectionStepId = Exclude<SectionId, "scenario_ratings" | "checks">;

export const SECTION_STEP_META: Record<SectionStepId, { title: string; intro: string }> = {
  summary_confidence: { title: "Your confidence", intro: "" },
  term_interpretation: {
    title: "What the terms meant to you",
    intro: "These are not right-or-wrong questions — we just want to know how you read a couple of phrases.",
  },
  background: { title: "About you", intro: "A few questions about your background and how you use AI tools." },
  final_attribution: { title: "Your interpretation", intro: "A few more direct questions about AI systems and evidence." },
  general_beliefs: { title: "General views", intro: "Please rate your agreement with the following general statements." },
  technical_knowledge: {
    title: "About AI systems",
    intro: "For each statement, choose True, False, or Not sure. These are used only to compare responses across different levels of familiarity.",
  },
  demographics: {
    title: "Final details",
    intro: "A few broad demographic questions. Country or region and final comments are optional.",
  },
};

export const SCENARIO_INSTRUCTIONS = {
  title: "How this works",
  paras: [
    "You’ll now read five fictional scenarios involving AI systems.",
    "Please answer based only on the information given in each scenario. There are no correct answers, we’re only interested in your interpretation.",
    "The scenarios appear in a random order.",
  ],
};

export const RATINGS_INTRO = "Based only on this scenario, how much do you agree?";

export const DEBRIEF = {
  title: "Thank you for participating",
  paras: [
    "This study examines how people interpret different kinds of AI-system evidence – emotion-related behavior, internal affect-like processes, actual feeling, inner experience, and precautionary concern.",
    "It does not assume that current AI systems are conscious or capable of feeling. The goal is to understand how different people interpret the same fictional scenarios.",
  ],
  sharePrompt: "If you know someone else who may be interested, you can share the survey link:",
  shareSource: "participant_share",
  shareUrl: "survey.juhokoskela.fi",
};

export function likertLabels(
  valueKind: "likert_7" | "likert_5",
  override?: readonly string[],
): readonly string[] {
  if (override) return override;
  return valueKind === "likert_5" ? CONFIDENCE_5 : AGREEMENT_7;
}
