# F7/F8 Qualitative Codebook v1.0
## AI System Scenario Study

**Status:** Frozen pre-draft codebook for independent second coding  
**Unit of analysis:** One respondent answer to F7 or F8  
**Coding mode:** Multi-label binary coding. A response may receive any number of applicable codes.  
**Blinding:** Coders should see only the response text and whether it is F7 or F8. Do not expose technical expertise, vignette ratings, F1/F2 answers, recruitment source, or other participant metadata during independent coding.

## General rules

1. Code only content that is stated or clearly entailed by the response. Do not infer philosophical commitments from vague wording.
2. Apply every supported code; codes are not mutually exclusive unless explicitly stated.
3. Code presence/absence per respondent, not frequency of repeated mentions.
4. Misspellings, shorthand, and informal wording count when the intended meaning is clear.
5. If a response merely repeats the question without adding substantive content, code no thematic category and mark `UNUSABLE_OR_NONANSWER`.
6. Use `OTHER_SUBSTANTIVE` only for meaningful content not captured by the frozen categories. Add a short memo.
7. Derived constructs such as `CONVERGENT_EVIDENCE` and `SKEPTICISM_TYPE` are calculated after primary coding and are not assigned directly by coders.

---

# F7
**Prompt:** “In your own words, what would count as strong evidence that an AI system might have its own inner experience?”

## F7 primary codes

### F7_BEHAVIORAL_CONSISTENCY
**Definition:** Requires stable, repeated, cross-context, longitudinal, or difficult-to-fake behavioral evidence.

**Include:** consistency across prompts/tests; behavior persisting over time; similar reactions across contexts; behavior generalizing outside one conversation.

**Exclude:** a single emotional statement or one isolated behavioral observation without a consistency/generalization requirement.

### F7_INTERNAL_MECHANISM
**Definition:** Requires evidence about internal representations, states, processes, circuits, architecture, activations, or mechanistic organization.

**Include:** internal emotion-related states; neural/activation patterns; identifiable internal processes; architectures plausibly supporting experience.

**Exclude:** purely behavioral evidence with no internal/process claim.

### F7_CAUSAL_INTERVENTION
**Definition:** Requires intervention or manipulation showing that changing an internal state/process changes behavior or downstream computation.

**Include:** steering/ablating/altering an internal feature and observing predictable consequences; causal perturbation experiments.

**Exclude:** mere correlation, decoding, observation, or localization of an internal pattern.

### F7_PERSISTENCE_AGENCY
**Definition:** Treats memory, continuity, ongoing goals, long-term preferences, planning, self-preservation, shutdown resistance, or persistent identity as positive evidence.

**Include:** continuity across sessions; persistent self-model; long-term memory/goals; stable preferences; resistance to deletion/shutdown.

**Exclude:** ordinary short-term coherence within one response.

### F7_SELF_REPORT_POSITIVE
**Definition:** Treats the AI's own reports about feelings/experience as positively evidential, even if corroboration is also required.

**Include:** spontaneous, consistent, detailed, or unexpected self-reports treated as part of the evidence.

**Exclude:** mentions of self-report solely to reject it as insufficient.

### F7_SELF_REPORT_NEEDS_CORROBORATION
**Definition:** Explicitly says verbal claims, emotional language, or self-report alone are insufficient and require independent corroboration.

**Include:** “not just words”; self-report plus mechanism/behavior; claims must match internal evidence.

**Exclude:** general demands for multiple evidence types when self-report is not mentioned.

### F7_UNPROMPTED_OR_NOVEL_BEHAVIOR
**Definition:** Values behavior that was not directly elicited, trained-for, scripted, rewarded, or readily explained as imitation.

**Include:** spontaneous expressions; novel generalization; unexpected behavior inconsistent with obvious training incentives.

**Exclude:** generic consistency without an unprompted/novel component.

### F7_INDEPENDENT_REPLICATION_OR_CONTROL
**Definition:** Requires independent labs, replication, controls, adversarial testing, blinded tests, or elimination of simpler alternatives.

**Include:** reproduced across models/labs; controlled experiments; falsification attempts.

**Exclude:** repeated behavior by the same model without an explicit independence/control idea.

### F7_EMBODIMENT_HOMEOSTASIS
**Definition:** Treats bodily grounding, sensory interaction, homeostasis, needs, stakes, drives, or real-world embodied regulation as important positive evidence.

**Include:** body/sensors; physiological analogues; needs or internal variables whose regulation matters to the system.

**Exclude:** generic tool use or environmental interaction without embodiment/needs.

### F7_THEORY_OR_CRITERIA_REQUIRED
**Definition:** Says strong evidence depends on a prior scientific/philosophical theory, agreed consciousness criteria, or validated markers rather than one empirical observation.

**Include:** need a theory of consciousness; need criteria known to track human/animal consciousness.

**Exclude:** ordinary request for mechanism without theory-level qualification.

### F7_STRONG_EVIDENCE_NOT_PROOF
**Definition:** Explicitly states that the proposed evidence would raise confidence but still would not prove or settle subjective experience.

**Include:** “still not proof”; “would make me update but not know”; “cannot establish for sure.”

**Exclude:** vague uncertainty without a contrast between strong evidence and proof.

### F7_NO_REALISTIC_EVIDENCE_SUFFICIENT
**Definition:** Says no available/possible external evidence could establish AI inner experience, or that the question is fundamentally inaccessible.

**Include:** impossible to know from outside; no conceivable behavioral/mechanistic test sufficient.

**Exclude:** merely asks for very strong evidence while allowing that such evidence could matter.

### F7_BIOLOGICAL_SUBSTRATE_REQUIRED
**Definition:** Explicitly requires biological neurons, organic tissue, a biological brain, or similar substrate for genuine experience.

**Include:** only biology can feel; would require living neural tissue.

**Exclude:** embodiment/homeostasis arguments that remain open to non-biological implementation.

### F7_OTHER_SUBSTANTIVE
Meaningful positive-evidence criterion not captured above. Add memo.

### F7_UNUSABLE_OR_NONANSWER
No interpretable substantive answer.

---

# F8
**Prompt:** “In your own words, what is the strongest reason to doubt that current AI systems have their own inner experience?”

## F8 primary codes

### F8_TRAINING_PREDICTION_MIMICRY
**Definition:** Argues that observed emotional/cognitive language or behavior is adequately explained by training-data imitation, next-token prediction, pattern matching, statistical learning, or simulation without experience.

**Include:** “just predicts text”; imitation of human language; learned patterns explain emotional statements; simulation does not imply feeling.

**Exclude:** generic “it is software” statements with no training/prediction/mimicry explanation.

### F8_MECHANISM_GAP
**Definition:** Emphasizes absence of a known mechanism or explanatory bridge from current computation/architecture to subjective experience.

**Include:** no mechanism that would make computation felt; no architecture known to support consciousness; nothing corresponding to subjective valence.

**Exclude:** claims that all computation is incapable of consciousness on substrate grounds.

### F8_EPISTEMIC_NO_ACCESS
**Definition:** Emphasizes the other-minds/verification problem: subjective experience is inaccessible externally or cannot be distinguished conclusively from perfect simulation.

**Include:** cannot look inside experience; no objective test; behavior could be identical with nobody home.

**Exclude:** “insufficient evidence so far” when the response implies better evidence could straightforwardly solve the problem.

### F8_EMBODIMENT_NEEDS_STAKES
**Definition:** Doubt based on current AI lacking a body, sensory grounding, homeostatic needs, self-maintenance, stakes, drives, or organism-like interaction.

**Include:** no body; nothing can be good/bad for it; no survival needs; no sensory life/history.

**Exclude:** absence of persistence alone.

### F8_COMPUTATIONAL_SUBSTRATE_SKEPTICISM
**Definition:** Doubt based on the system being code/computation/silicon/artificial machinery, without explicitly requiring biology as a necessary condition.

**Include:** “just software”; algorithms/computation seem insufficient.

**Exclude:** training/prediction explanation when substrate itself is not the issue.

### F8_BIOLOGICAL_REQUIREMENT
**Definition:** Explicitly states that genuine experience requires biological brains, neurons, cells, living organisms, or a biological substrate.

**Include:** only biological brains can be conscious.

**Exclude:** merely noting that current models lack embodiment.

### F8_THEORY_UNCERTAINTY
**Definition:** Doubt grounded in lack of a settled theory of consciousness or inability to know which computational properties are sufficient.

**Include:** science does not know what causes consciousness; no accepted theory to map AI mechanisms to experience.

**Exclude:** generic external-access skepticism without reference to theory/criteria.

### F8_FUNCTIONAL_PHENOMENAL_UNDERDETERMINATION
**Definition:** Explicitly states that genuine functional/behavioral organization can exist without implying subjective feeling.

**Include:** model could really have emotion-like control states yet still not feel them; function does not entail phenomenology.

**Exclude:** generic mimicry arguments that deny the functional state is real.

### F8_TRAINING_OBJECTIVE_OR_REWARD_ARTIFACT
**Definition:** Attributes emotional/self-preserving behavior specifically to RLHF/RLAIF, reward optimization, prompting, system instructions, fine-tuning, or training objectives.

**Include:** behavior selected because humans reward it; shutdown statements trained into the policy.

**Exclude:** generic training-data mimicry without objective/reward emphasis.

### F8_NO_PERSISTENT_SELF
**Definition:** Doubt specifically because current systems lack durable memory, continuous identity, stable goals, temporal continuity, or a persisting self.

**Include:** no continuity between sessions; stateless calls; no continuing entity.

**Exclude:** absence of embodiment or general mechanism.

### F8_INSUFFICIENT_POSITIVE_EVIDENCE
**Definition:** Says current evidence is simply too weak, sparse, or non-diagnostic without advancing one of the more specific explanations above.

**Include:** “we haven't seen convincing evidence yet.”

**Exclude:** use a more specific code when the respondent explains why evidence is inadequate.

### F8_OTHER_SUBSTANTIVE
Meaningful skeptical reason not captured above. Add memo.

### F8_UNUSABLE_OR_NONANSWER
No interpretable substantive answer.

---

# Derived variables
These are calculated after independent coding.

## F7_CONVERGENT_EVIDENCE
Set TRUE when at least two of these core evidential domains are present:
- `F7_BEHAVIORAL_CONSISTENCY`
- `F7_INTERNAL_MECHANISM` or `F7_CAUSAL_INTERVENTION` (mechanistic domain counts once)
- `F7_PERSISTENCE_AGENCY`
- `F7_SELF_REPORT_POSITIVE`
- `F7_EMBODIMENT_HOMEOSTASIS`

## F8_DEFLATIONARY_SKEPTICISM
Set TRUE when `F8_TRAINING_PREDICTION_MIMICRY` or `F8_MECHANISM_GAP` is present and `F8_EPISTEMIC_NO_ACCESS` is absent.

## F8_EPISTEMIC_SKEPTICISM
Set TRUE when `F8_EPISTEMIC_NO_ACCESS` is present and neither `F8_TRAINING_PREDICTION_MIMICRY` nor `F8_MECHANISM_GAP` is the primary substantive rationale.

Because responses can genuinely contain both forms, coders should not force mutual exclusivity at the primary-code stage. Any mutually exclusive descriptive grouping must be derived transparently after coding.

---

# Independent-coding and agreement plan

`analysis/prepare_qualitative_coding.py` creates the blinded coding sheets from
the private completed-response export. `analysis/qualitative_agreement.py`
compares two locked coding sheets and creates the pre-adjudication agreement and
disagreement files.

1. Export F7 and F8 text with randomized row IDs and no respondent metadata.
2. Two coders independently apply the frozen binary codebook.
3. For every code, report:
   - raw percent agreement;
   - positive agreement;
   - Cohen's kappa where prevalence permits meaningful interpretation.
4. Rare codes with fewer than ~5 positive cases should be reported descriptively; kappa is unstable and should not be treated as an oracle.
5. Resolve disagreements only after independent coding is locked.
6. Preserve both original coder matrices plus an adjudicated final matrix.
7. Theme percentages in the paper use the adjudicated matrix and denominator of nonblank usable F7 or F8 responses.
8. Explicitly state that F7/F8 were optional and post-vignette; qualitative theme frequencies are not population prevalence estimates.

## Interpretation guardrails

- F7 follows structured scenario exposure and explicit evidence questions; do not claim respondents independently invented the study's evidence taxonomy.
- F8 precedes the technical-knowledge battery, so next-token/training explanations were not taught by T1 immediately beforehand, but prior survey content still creates context.
- Do not describe welfare-related or consciousness-related free text as evidence about actual AI consciousness.
- Do not infer respondent accuracy or sophistication from agreement with the researchers' framework.
