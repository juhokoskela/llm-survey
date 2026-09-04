import type { ReactNode } from "react";

import {
  QUESTION_METADATA,
  answerInstanceId,
  type QuestionId,
  type QuestionMetadata,
  type ScenarioId,
} from "@/lib/stable-ids";
import {
  OTHER_CHOICE_PREFIX,
  QUESTION_CONTENT,
  likertLabels,
  otherChoiceText,
} from "@/lib/survey-content";

export type AnswerValue = number | string | string[];

const TFNS = ["True", "False", "Not sure"];
const MULTILINE_FREE_TEXT = new Set<QuestionId>([
  "F7_strong_evidence_free_text",
  "F8_doubt_reason_free_text",
  "D4_final_comments",
]);

function RatingScale({
  name,
  points,
  labels,
  value,
  onChange,
}: {
  name: string;
  points: number;
  labels: readonly string[];
  value: number | undefined;
  onChange: (n: number) => void;
}) {
  return (
    <div className="q-control">
      <div className="scale" style={{ gridTemplateColumns: `repeat(${points}, 1fr)` }}>
        {Array.from({ length: points }, (_, i) => {
          const v = i + 1;
          return (
            <label className="pt" key={v}>
              <input
                className="sr"
                type="radio"
                name={name}
                value={v}
                aria-label={`${v} – ${labels[i]}`}
                checked={value === v}
                onChange={() => onChange(v)}
              />
              <span className="dot">{v}</span>
            </label>
          );
        })}
      </div>
      <div className="scale-ends">
        <span className="end">{labels[0]}</span>
        <span className={`readout${value ? " is-set" : ""}`}>
          {value ? labels[value - 1] : "—"}
        </span>
        <span className="end">{labels[points - 1]}</span>
      </div>
    </div>
  );
}

function TrueFalseField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | undefined;
  onChange: (s: string) => void;
}) {
  return (
    <div className="q-control">
      <div className="seg">
        {TFNS.map((t) => (
          <label className="tf" key={t}>
            <input
              className="sr"
              type="radio"
              name={name}
              value={t}
              aria-label={t}
              checked={value === t}
              onChange={() => onChange(t)}
            />
            <span className="tf-face">{t}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SingleChoiceField({
  name,
  options,
  other,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  other?: boolean;
  value: string | undefined;
  onChange: (s: string) => void;
}) {
  const otherActive = value !== undefined && !options.includes(value);
  const otherText =
    otherActive && value
      ? (otherChoiceText(value) ?? value)
      : otherActive
        ? ""
        : "";
  return (
    <div className="q-control">
      <div className="choices">
        {options.map((opt) => (
          <label className="choice" key={opt}>
            <input
              className="sr"
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="mark" />
            <span className="ctext">{opt}</span>
          </label>
        ))}
        {other ? (
          <>
            <label className="choice">
              <input
                className="sr"
                type="radio"
                name={name}
                checked={otherActive}
                onChange={() => onChange(OTHER_CHOICE_PREFIX)}
              />
              <span className="mark" />
              <span className="ctext">Other</span>
            </label>
            {otherActive ? (
              <div className="other-field">
                <input
                  className="text-input"
                  type="text"
                  placeholder="Please specify…"
                  aria-label="Other, please specify"
                  value={otherText}
                  onChange={(e) => onChange(`${OTHER_CHOICE_PREFIX}${e.target.value}`)}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function MultiChoiceField({
  options,
  other,
  exclusive = [],
  max = 0,
  value,
  onChange,
}: {
  options: string[];
  other?: boolean;
  exclusive?: string[];
  max?: number;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const selected = value ?? [];
  const otherValue = selected.find((v) => !options.includes(v));
  const otherActive = otherValue !== undefined;
  const otherText = otherValue ? (otherChoiceText(otherValue) ?? otherValue) : "";
  const meaningful = (list: string[]) => list.filter(isMeaningfulChoice).length;

  function toggleKnown(opt: string) {
    let next = selected.slice();
    if (next.includes(opt)) {
      next = next.filter((v) => v !== opt);
    } else if (exclusive.includes(opt)) {
      next = [opt];
    } else {
      next = next.filter((v) => !exclusive.includes(v));
      if (max && meaningful(next) >= max) return;
      next.push(opt);
      if (max && meaningful(next) >= max) {
        next = next.filter((v) => v.trim() !== "");
      }
    }
    onChange(next);
  }

  function toggleOther() {
    let next = selected.filter((v) => options.includes(v));
    if (!otherActive) {
      next = next.filter((v) => !exclusive.includes(v));
      if (max && meaningful(next) >= max) return;
      next = next.concat([OTHER_CHOICE_PREFIX]);
    }
    onChange(next);
  }

  function setOtherText(text: string) {
    const known = selected.filter((v) => options.includes(v));
    if (max && text.trim() && known.length >= max) return;
    onChange(known.concat([`${OTHER_CHOICE_PREFIX}${text}`]));
  }

  return (
    <div className="q-control">
      <div className="choices">
        {options.map((opt) => (
          <label className="choice multi" key={opt}>
            <input
              className="sr"
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggleKnown(opt)}
            />
            <span className="mark" />
            <span className="ctext">{opt}</span>
          </label>
        ))}
        {other ? (
          <>
            <label className="choice multi">
              <input className="sr" type="checkbox" checked={otherActive} onChange={toggleOther} />
              <span className="mark" />
              <span className="ctext">Other</span>
            </label>
            {otherActive ? (
              <div className="other-field">
                <input
                  className="text-input"
                  type="text"
                  placeholder="Please specify…"
                  aria-label="Other, please specify"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function isMeaningfulChoice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const customText = otherChoiceText(value);
  if (customText !== null) {
    return customText.trim().length > 0;
  }

  return true;
}

function TextField({
  multiline,
  placeholder,
  value,
  onChange,
}: {
  multiline?: boolean;
  placeholder?: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="q-control">
      {multiline ? (
        <textarea
          className="textarea"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="text-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function QuestionBlock({
  questionId,
  scenarioId,
  idTag,
  value,
  onChange,
  flagged,
  answered,
}: {
  questionId: QuestionId;
  scenarioId?: ScenarioId;
  idTag?: boolean;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  flagged?: boolean;
  answered?: boolean;
}) {
  const meta: QuestionMetadata = QUESTION_METADATA[questionId];
  const content = QUESTION_CONTENT[questionId];
  const name = answerInstanceId(questionId, meta.scenarioScoped ? (scenarioId ?? null) : null);
  const shortId = questionId.split("_")[0];
  const isCheck = meta.sectionId === "checks";

  let control: ReactNode = null;
  if (meta.valueKind === "likert_7" || meta.valueKind === "likert_5") {
    const points = meta.valueKind === "likert_5" ? 5 : 7;
    control = (
      <RatingScale
        name={name}
        points={points}
        labels={likertLabels(meta.valueKind, content.labels)}
        value={typeof value === "number" ? value : undefined}
        onChange={(n) => onChange(n)}
      />
    );
  } else if (meta.valueKind === "single_choice") {
    control = (
      <SingleChoiceField
        name={name}
        options={content.options ?? []}
        other={content.other}
        value={typeof value === "string" ? value : undefined}
        onChange={(s) => onChange(s)}
      />
    );
  } else if (meta.valueKind === "technical_choice") {
    control = (
      <TrueFalseField
        name={name}
        value={typeof value === "string" ? value : undefined}
        onChange={(s) => onChange(s)}
      />
    );
  } else if (meta.valueKind === "multi_choice") {
    control = (
      <MultiChoiceField
        options={content.options ?? []}
        other={content.other}
        exclusive={content.exclusive}
        max={content.max}
        value={Array.isArray(value) ? value : []}
        onChange={(v) => onChange(v)}
      />
    );
  } else {
    control = (
      <TextField
        multiline={MULTILINE_FREE_TEXT.has(questionId)}
        placeholder={content.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(s) => onChange(s)}
      />
    );
  }

  const stateClass = flagged ? " is-missing" : answered ? " is-answered" : "";

  return (
    <fieldset
      className={`q${isCheck ? " check" : ""}${stateClass}`}
      id={name}
      aria-invalid={flagged || undefined}
    >
      <legend className="q-label">
        {idTag ? <span className="q-id">{shortId}</span> : null}
        {content.label}
        {content.sub ? <span className="q-sub">{content.sub}</span> : null}
      </legend>
      {control}
      {content.privacy ? <p className="privacy-note">{content.privacy}</p> : null}
    </fieldset>
  );
}
