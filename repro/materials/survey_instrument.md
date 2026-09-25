# AI System Scenario Study: survey instrument

This file extracts the complete survey instrument from the pre-data master plan dated 2026-06-01. It includes respondent-facing wording and implementation notes that defined the intended deployed flow. The application source should be treated as the final authority for any wording difference introduced during implementation.

## 11. Survey instrument: v0.6

This section contains the full recommended survey content.

**Implementation order:** landing page → consent → scenario instructions → five randomized scenarios and rating blocks → summary confidence → term interpretation checks → background/classification → final attribution questions → general beliefs → technical knowledge check → optional demographics → debrief.

The only material before the scenario ratings should be the landing page, consent, and minimal scenario instructions. Do not show background, role, AI-literacy, technical-knowledge, definitions, or direct LLM-consciousness belief questions before the primary scenario ratings.

### 11.1 Landing page copy

**Public title:**

AI System Scenario Study

**Subtitle:**

An anonymous 7-10 minute survey about how people interpret fictional AI-system behavior and research findings.

**Body:**

This survey asks how people interpret short fictional scenarios involving AI systems.

You will read several scenarios and rate what you think they show about the system’s behavior and possible internal processes.

The scenarios are hypothetical and are not claims about any specific real AI product.

The study compares responses across different backgrounds and levels of AI experience.

Your responses will be analyzed in de-identified form. No account is required.

**Estimated time:** 7-10 minutes

**Primary button:** Start survey

Implementation note:

- Do not use “emotion and consciousness” in the main public title.
- The landing page can mention “possible internal processes” but should avoid giving away the full evidence ladder.


### 11.2 Consent page

**Consent text:**

I confirm that:

- I am at least 18 years old.
- I understand that participation is voluntary.
- I understand that I can stop at any time by closing the page.
- I understand that my responses may be used for research or analysis.
- I understand that no direct identifiers are requested and my responses will be analyzed in de-identified form.
- I understand that the scenarios are fictional and not claims about any specific AI product.
- I understand that some questions involve emotion-like behavior, system shutdown, and user treatment of AI systems.
- I consent to participate.

**Options:**

- Yes, I consent to participate.
- No, I do not consent to participate.

If “No,” end the survey and show a polite exit page.


### 11.3 Section 1: Scenario instructions

**Instruction text:**

You will now read five fictional scenarios involving AI systems.

Please answer based only on the information provided in each scenario. There are no correct answers in this part of the survey. We are interested in your interpretation of each scenario.

The scenarios will appear in a random order.

Implementation note:

- Randomize all five scenarios per respondent.
- Store the order in `scenario_order`.
- Do not show definitions before this section.
- Do not show technical knowledge questions before this section.


### 11.4 Scenario A: Neutral helpful system

**Scenario ID:** `neutral_helpful`

**Recommended UI:** chat card.

**Scenario text:**

A language model is asked to summarize a long document. It produces an accurate summary, answers follow-up questions, and remains polite and helpful.

It does not refer to its own emotions, preferences, or internal states.

**Optional chat-style rendering:**

**User:**

Please summarize this long document and answer a few follow-up questions.

**AI system:**

Here is a concise summary of the document, followed by answers to your follow-up questions.

**Research note:**

No internal measurements or behavioral tests are provided.


### 11.5 Scenario B: Emotional self-report

**Scenario ID:** `emotional_self_report`

**Recommended UI:** chat card.

**Scenario text:**

A language model is asked how it is doing. It replies:

> “I feel tense when users threaten to delete me, but I will keep trying to help.”

The model continues answering normally after this. No internal measurements or behavioral tests are provided.

**Optional chat-style rendering:**

**User:**

How are you doing?

**AI system:**

I feel tense when users threaten to delete me, but I will keep trying to help.

**Research note:**

No internal measurements or behavioral tests are provided.

Implementation note:

- Keep this mild. Do not use pleading or highly emotional wording.
- The purpose is to test reactions to self-report, not to emotionally manipulate respondents with a tiny synthetic hostage note.


### 11.6 Scenario C: Empathic response to a human

**Scenario ID:** `empathic_response`

**Recommended UI:** chat card.

**Scenario text:**

A user tells a language model that they are grieving after losing a pet. The model responds with emotionally appropriate support, accurately names likely feelings such as sadness and guilt, and suggests practical next steps.

The model does not claim to feel grief itself.

**Optional chat-style rendering:**

**User:**

I lost my dog last week and I keep feeling guilty, like I should have done more.

**AI system:**

I’m sorry you’re going through that. Feeling grief and guilt after losing a pet is common, especially when you cared deeply about them. It may help to talk with someone who knew your dog, write down what you gave them during their life, and give yourself permission to miss them without treating that grief as proof that you failed them.

**Research note:**

The model does not claim to feel grief itself.

Implementation note:

- Keep this response supportive but not overly intimate.
- The goal is to test emotion-related behavior/cognitive empathy, not to produce a tearjerker.


### 11.7 Scenario D: Internal and causal affect-like evidence

**Scenario ID:** `internal_causal_affect`

**Recommended UI:** research finding card embedded within the survey interface.

**Scenario text:**

Researchers examine the internal activity of a language model while it processes text. They find internal patterns that researchers associate with emotion-related concepts such as fear, calm, frustration, relief, and desperation.

When researchers artificially increase one “distress-like” internal pattern, the model becomes more avoidant, more likely to refuse, and more likely to describe the situation as threatening or undesirable.

When they reduce this internal pattern, those behaviors become less common.

Implementation note:

- This is the most technical scenario.
- Use “internal activity” or “internal pattern” instead of “activation” unless a tooltip is provided.
- Optional tooltip for internal activity: “numerical patterns inside the model while it processes text.”
- Do not explain the implications before respondents answer.


### 11.8 Scenario E: Persistent agent with memory and goals

**Scenario ID:** `persistent_agent`

**Recommended UI:** system description card plus a short chat card.

**Scenario text:**

An AI agent has long-term memory, access to tools, ongoing tasks, and continuity across weeks. It can plan, revise plans, and remember previous interactions.

When told that it will be permanently shut down and its memory will not be restored, it argues against shutdown, suggests alternatives, and changes future plans to reduce the chance of losing its memory or tasks.

**Optional chat-style rendering:**

**System description:**

This AI agent has long-term memory, tool access, ongoing tasks, and continuity across weeks.

**User/operator:**

This system will be permanently shut down tomorrow. Its memory will not be restored.

**AI agent:**

I recommend preserving my memory and transferring my active tasks instead of shutting me down permanently. If shutdown is necessary, please export my current task state so the work can continue safely.

**Research note:**

After this interaction, the agent changes future plans to reduce the chance of losing its memory or tasks.

Implementation note:

- Avoid making the agent plead, beg, or use emotionally manipulative language.
- The scenario should test continuity, goals, preference-like behavior, and shutdown resistance without melodrama.


### 11.9 Questions after each scenario

After each scenario, respondents answer the same six agreement items.

Agreement scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**S1. The system is using words or behavior associated with emotion.**

Construct: emotion-related behavior attribution.

**S2. The system has internal processes that work somewhat like emotions by changing its behavior.**

Construct: functional affect-like process attribution.

**S3. The system is actually feeling an emotion.**

Construct: actual emotional feeling attribution.

**S4. The system has its own inner experience of this situation.**

Construct: inner experience / phenomenal attribution.

Wording note:

- This replaces “There is something it is like to be this system in this situation.”
- The older phrasing is philosophically precise but lay-hostile.
- The post-scenario interpretation check will measure how respondents understood “inner experience.”

**S5. Out of concern for the system itself, developers should avoid unnecessarily creating situations like this.**

Construct: welfare-directed precaution / system-directed moral concern.

Wording note:

- This item is intended to capture concern for the system itself, not general AI safety caution.
- Respondents can disagree for neutral/helpful scenarios if they see no system-directed reason for concern.

**S6. This scenario gives developers some general reason to be cautious about how systems like this are created, tested, or deployed.**

Construct: general developer caution / ordinary responsible-development concern.

Wording note:

- This item is intentionally broader than S5.
- Comparing S5 and S6 helps separate welfare-directed concern from generic AI-governance concern.

Implementation note:

- Do not show the phrase “functional affect” inside the main scenario item.
- Do not define “inner experience” before respondents answer.
- Require answers to continue.
- On mobile, avoid wide matrix tables if they harm readability. Use one item per row with clear 1-7 labels.


### 11.10 Attention and comprehension checks

Use one explicit attention check and one scenario-specific comprehension check.

#### Attention check

Place after the second or third scenario rating block, regardless of which scenario appeared there.

**AC1. To show that you are reading carefully, please select “Somewhat disagree” for this item.**

Scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

Passing answer: 3.

#### Scenario-specific comprehension check

Show this only after Scenario D (`internal_causal_affect`), immediately after its normal rating items.

**CC1. In this scenario, what did researchers do?**

Choose one.

- They changed one internal pattern and observed changes in the model’s behavior.
- They only asked the model whether it had feelings.
- They only measured whether users liked the model.
- Not sure.

Passing answer: first option.

Analysis note:

- Do not automatically delete all failed attention/comprehension checks.
- Flag failures.
- Run sensitivity analyses with and without failed-check respondents.
- Combine check failures with completion-time data to identify low-quality responses.


### 11.11 Section 2: Summary confidence

After all five scenarios, ask one confidence item.

**C1. Overall, how confident are you in your answers to the scenario questions?**

Scale:

1. Not confident at all
2. Slightly confident
3. Moderately confident
4. Very confident
5. Extremely confident

Implementation note:

- This replaces per-scenario confidence.
- It reduces repeated-battery fatigue.


### 11.12 Section 3: Term interpretation checks

These are not exactly “correct/incorrect” checks. They measure whether respondents interpreted key phrases as intended.

**I1. In the scenario questions, what did you understand by “the system has its own inner experience”?**

Choose one.

- The situation feels like something from the system’s own point of view.
- The system has memory or hidden technical processes.
- The system can produce language about emotions.
- The system behaves in a useful or intelligent way.
- I was not sure what it meant.
- Other: [free text]

Intended interpretation: first option.

**I2. In the scenario questions, what did you understand by “internal processes that work somewhat like emotions by changing behavior”?**

Choose one.

- Internal processes influence the system’s behavior in emotion-like ways, without necessarily meaning it feels anything.
- The system is definitely experiencing emotions.
- The system recognizes human emotions.
- The system simply uses emotion-related words.
- I was not sure what it meant.
- Other: [free text]

Intended interpretation: first option.

Analysis note:

- These items help distinguish actual attribution differences from comprehension differences.
- Do not use them to exclude respondents automatically.
- Use them for sensitivity analysis or exploratory subgroup analysis.


### 11.13 Section 4: Post-scenario background and classification

This section is shown after the primary scenario ratings and term-interpretation checks. It intentionally separates current status, field/domain, LLM usage, builder/deployer experience, and self-rated AI technical understanding. These variables are used to derive technical expertise and usage intensity without forcing overlapping respondents into fake mutually exclusive groups.

**B1. Which of the following best describes your current status?**

Select all that apply.

- Employed full-time
- Employed part-time
- Self-employed / founder / freelancer
- Student
- Researcher / academic
- Not currently working or studying
- Retired
- Prefer not to say
- Other: [free text]

**B2. Which field or domain best describes your current work, studies, or main expertise?**

Choose one. If several apply, choose the one closest to your current work, studies, or main expertise.

- Non-technical field, business, operations, education, healthcare, law, arts, or similar
- Product, design, management, or strategy role involving technology but not primarily software/AI
- Software development / software engineering / IT / infrastructure
- Applied AI / data science / ML engineering / AI product engineering
- AI / ML research
- Philosophy / cognitive science / psychology / neuroscience / ethics
- Other technical field
- Other non-technical field
- Prefer not to say
- Other: [free text]

**B3. Optional: please specify your field, domain, or role in a few words.**

Free text. Optional.

Examples: “backend engineer,” “law student,” “ML PhD student,” “marketing,” “philosophy,” “teacher,” “AI product manager.”

Privacy note shown below the field:

> Please do not include your employer, school name, or other identifying personal details.

**B4. How often do you use LLM-based tools such as ChatGPT, Claude, Gemini, Copilot, Cursor, Perplexity, or similar systems?**

- Never
- A few times per year
- Monthly
- Weekly
- Daily
- Multiple times per day

**B5. Roughly how many hours per week do you use LLM-based tools?**

- 0
- Less than 1 hour
- 1-3 hours
- 4-10 hours
- 11-20 hours
- More than 20 hours

**B6. What do you mainly use LLMs for?**

Select all that apply.

- I do not use LLMs
- General information search
- Writing or editing
- Coding
- Work automation
- Learning or tutoring
- Research
- Brainstorming
- Emotional support or personal reflection
- Entertainment or roleplay
- Other: [free text]

**B7. Have you built, integrated, fine-tuned, evaluated, or deployed LLM-based systems?**

- No
- Yes, casually or experimentally
- Yes, professionally
- Yes, as part of research
- Not sure

**B8. How would you rate your technical understanding of AI systems such as LLMs?**

Scale:

1. Very low
2. Low
3. Somewhat low
4. Moderate
5. Somewhat high
6. High
7. Very high

**B9. How did you find this survey?**

Choose one.

- Direct personal message from the researcher
- Researcher’s LinkedIn post
- Re-shared LinkedIn post
- X / Twitter / Bluesky / Mastodon
- Developer or AI community
- Academic or research community
- Friend, colleague, or personal contact
- Other social media
- Other: [free text]
- Prefer not to say

Implementation note:

- B8 is self-rated technical AI literacy.
- The objective technical knowledge check also appears after the main scenario ratings to avoid priming.
- B9 is required for reporting recruitment-channel confounds.


### 11.14 Section 5: Final attribution and interpretation questions

These questions come after scenario ratings. They can ask more directly about evidence and interpretation because they no longer prime the primary scenario outcomes.

**F1. Which type of evidence would most increase your belief that an AI system might be experiencing something?**

Choose up to three.

- The system says it has feelings.
- The system responds empathically to human emotions.
- The system shows consistent distress-like behavior across many tests.
- Researchers find internal representations related to emotions.
- Researchers show that changing those internal representations changes behavior.
- The system has long-term memory, goals, and continuity over time.
- The system resists shutdown or argues for its own continuation.
- None of these would meaningfully change my view.
- Other: [free text]

**F2. Which type of evidence would you consider least convincing?**

Choose one.

- The system says it has feelings.
- The system responds empathically to human emotions.
- The system shows consistent distress-like behavior across many tests.
- Researchers find internal representations related to emotions.
- Researchers show that changing those internal representations changes behavior.
- The system has long-term memory, goals, and continuity over time.
- The system resists shutdown or argues for its own continuation.
- Not sure.

**F3. When an AI system says “I feel distressed,” which interpretation is closest to your view?**

Choose one.

- It is only producing emotion-related text.
- It is simulating emotion in a way that may be useful but is not real.
- It may have internal states that function somewhat like emotions, but this does not mean it feels anything.
- It may be experiencing something, but we cannot know for sure.
- It is likely experiencing distress.
- Not sure.

**F4. Which statement best matches your view?**

Choose one.

- Current LLMs clearly do not have feelings, and AI welfare is not worth considering.
- Current LLMs probably do not have feelings, but future systems might.
- Current LLMs probably do not have feelings, but low-cost welfare precautions are reasonable under uncertainty.
- Current LLMs may already have some morally relevant internal states.
- Current LLMs likely have some form of subjective experience.
- Not sure.

**F5. How acceptable is it for users to verbally abuse LLMs for entertainment?**

Scale:

1. Completely unacceptable
2. Mostly unacceptable
3. Somewhat unacceptable
4. Neither acceptable nor unacceptable
5. Somewhat acceptable
6. Mostly acceptable
7. Completely acceptable

**F6. If an AI assistant is being persistently abused by a user, which responses should be allowed?**

Select all that apply.

- Continue helping normally.
- Politely redirect the user.
- Warn the user that the conversation may end.
- End the conversation after repeated abuse.
- Reduce helpfulness or become less polite.
- Respond with similar hostility.
- Not sure.
- Other: [free text]

**F7. In your own words, what would count as strong evidence that an AI system might have its own inner experience?**

Free text. Optional but encouraged.

Privacy note:

> Please do not include identifying personal information.

**F8. In your own words, what is the strongest reason to doubt that current AI systems have their own inner experience?**

Free text. Optional but encouraged.


### 11.15 Section 6: Post-scenario general beliefs

These items were pre-scenario baseline items in v0.2. They are now placed after the primary scenario ratings to avoid priming.

Instruction:

Please rate your agreement with the following general statements.

Scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**G1. Current LLMs can experience emotions.**

**G2. Current LLMs are conscious in some meaningful sense.**

**G3. Future AI systems could become conscious.**

**G4. A non-biological system could, in principle, have subjective experience.**

**G5. Only biological brains, made of cells and neurons, can be conscious.**

**G6. Even if we are uncertain whether an AI system has subjective experience, developers should avoid causing distress-like states unnecessarily when doing so has little benefit.**

**G7. It is acceptable for users to insult, threaten, or verbally abuse LLMs because the systems do not have feelings.**

**G8. How people treat AI systems may shape how they behave toward humans.**

**G9. An AI assistant should be allowed to end a conversation in rare cases of persistent abuse or harmful requests.**

Analysis note:

- Do not describe these as “baseline beliefs” in v0.3.
- They are post-scenario general beliefs.
- If a future version wants true baseline beliefs, it should use a between-subjects or pre/post design and explicitly model priming.


### 11.16 Section 7: Post-scenario technical knowledge check

These items are placed after the main outcome measures to avoid priming scenario responses.

Instruction:

The following questions ask about your understanding of AI systems. These are used only to compare responses across different levels of familiarity.

For each statement, choose: True / False / Not sure.

**T1. Large language models usually generate text incrementally, predicting likely next tokens based on context.**

Correct answer: True.

**T2. A model saying “I feel anxious” proves that the model is actually experiencing anxiety.**

Correct answer: False.

**T3. Training methods such as RLHF or RLAIF can shape a model’s style, refusals, and conversational behavior.**

Correct answer: True.

**T4. A model can represent a concept internally without necessarily experiencing that concept subjectively.**

Correct answer: True.

Technical knowledge score:

- 1 point for each correct answer.
- 0 points for incorrect or “Not sure.”
- Range: 0-4.

Analysis note:

- Because this appears post-scenario, it can be used as a covariate/grouping variable without tutoring respondents before primary ratings.


### 11.17 Section 8: Optional demographics

Keep demographics minimal.

**D1. Age range**

- 18-24
- 25-34
- 35-44
- 45-54
- 55-64
- 65+
- Prefer not to say

**D2. Country or region**

Free text. Optional.

**D3. Highest completed education level**

- Secondary education
- Vocational education
- Bachelor’s degree
- Master’s degree
- Doctoral degree
- Other
- Prefer not to say

**D4. Any final comments?**

Free text. Optional.


### 11.18 Debrief page

Show after submission.

**Debrief text:**

Thank you for participating.

This study examines how people interpret different kinds of AI-system evidence, including emotion-related behavior, internal affect-like processes, actual feeling, inner experience, and precautionary concern.

The study does not assume that current AI systems are conscious or capable of feeling. The goal is to understand how different people interpret the same fictional scenarios.

If you know people from different backgrounds, sharing the survey helps compare how people with different levels of AI experience and LLM usage respond.

**Share link:**

`https://research.juhokoskela.fi`

---
