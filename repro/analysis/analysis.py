#!/usr/bin/env python3
"""Reproduce the main quantitative analyses for the AI System Scenario Study.

The participant-level dataset is intentionally not distributed with this repository.
Point --csv at an authorized local copy of prod-export-2026-08-21.csv.

Outputs:
  results.json
  results.md
  figure1_evidence_to_inference_map.png
  figure2_phenomenal_crossover.png
  figure3_explicit_evidence_alignment.png
  figure4_precaution_without_belief.png

The script reproduces the frozen population-averaged ordinal GEE analyses and
headline descriptive quantities. The pre-specified respondent-conditional CLMM
is fit separately by clmm_primary.R.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt

import numpy as np
import pandas as pd
from patsy import build_design_matrices, dmatrix
from scipy.special import expit
from scipy.stats import binomtest, norm
from ordinal_models import fit_binary_gee, fit_ordinal_gee

SCENARIOS = [
    ("neutral_helpful", "Neutral helpful"),
    ("emotional_self_report", "Emotional self-report"),
    ("empathic_response", "Empathic response"),
    ("internal_causal_affect", "Internal/causal"),
    ("persistent_agent", "Persistent agent"),
]

ITEMS = [
    ("S1_emotion_related_behavior", "S1 behavior"),
    ("S2_functional_affect_like_process", "S2 functional affect"),
    ("S3_actual_feeling", "S3 actual feeling"),
    ("S4_inner_experience", "S4 inner experience"),
    ("S5_welfare_directed_precaution", "S5 welfare precaution"),
    ("S6_general_developer_caution", "S6 general caution"),
]

RECRUITMENT = "B9_recruitment_source"
F1_CAUSAL = "Researchers show that changing those internal representations changes behavior."
F1_CONTINUITY = "The system has long-term memory, goals, and continuity over time."
F1_SHUTDOWN = "The system resists shutdown or argues for its own continuation."
T1_NEXT_TOKEN = "T1_next_token_generation"
T3_RLHF = "T3_rlhf_shapes_behavior"
FACTUAL_KNOWLEDGE_SCORE = "technical_factual_knowledge_score"
INTENDED_INNER_EXPERIENCE = (
    "The situation feels like something from the system’s own point of view."
)
INTENDED_FUNCTIONAL_PROCESS = (
    "Internal processes influence the system’s behavior in emotion-like ways, "
    "without necessarily meaning it feels anything."
)
LINKEDIN_SOURCE = "Researcher’s LinkedIn post"

FIELD_TIER_3 = {
    "AI / machine learning (ML) research",
    "AI / ML research",
}
FIELD_TIER_2 = {
    "Applied AI / data science / machine learning (ML) engineering / AI product engineering",
    "Applied AI / data science / ML engineering / AI product engineering",
}
FIELD_TIER_1 = {
    "Software development / software engineering / information technology (IT) / infrastructure",
    "Software development / software engineering / IT / infrastructure",
    "Other technical field",
    "Product, design, management, or strategy role involving technology but not primarily software/AI",
}
FIELD_TIER_0 = {
    "Non-technical field, business, operations, education, healthcare, law, arts, or similar",
    "Philosophy / cognitive science / psychology / neuroscience / ethics",
    "Other non-technical field",
}
BUILDER_TIERS = {
    "Yes, as part of research": 3,
    "Yes, professionally": 2,
    "Yes, casually or experimentally": 1,
    "No": 0,
}
NO_LLM_USE = {"I do not use large language models", "I do not use LLMs"}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True, help="Path to private completed-response CSV")
    p.add_argument("--outdir", default="analysis-output", help="Output directory")
    return p.parse_args()


def validate(df: pd.DataFrame) -> None:
    required = {
        "session_id",
        "completed_at",
        "technical_expertise_tier",
        "technical_classification_ambiguous",
        "usage_classification_ambiguous",
        "usage_intensity",
        "technical_knowledge_score",
        T1_NEXT_TOKEN,
        T3_RLHF,
        "mind_theory_background",
        "B10_prior_topic_familiarity",
        "F1_most_increasing_evidence",
        RECRUITMENT,
        "low_english_comfort_flag",
        "attention_check_passed",
        "comprehension_check_passed",
        "very_fast_completion_flag",
        "straightlining_flag",
        "missing_required_answers_flag",
        "completion_time_seconds",
        "I1_inner_experience_interpretation",
        "I2_functional_process_interpretation",
        "B2_field_domain",
        "B4_llm_frequency",
        "B5_llm_hours",
        "B6_llm_use_cases",
        "B7_builder_experience",
    }
    for scenario, _ in SCENARIOS:
        required.add(f"{scenario}_position")
        for item, _ in ITEMS:
            required.add(f"{scenario}_{item}")
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")
    if df["session_id"].duplicated().any():
        raise ValueError("Expected one row per completed session; duplicate session_id found")


def add_factual_knowledge_score(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out[FACTUAL_KNOWLEDGE_SCORE] = (
        out[T1_NEXT_TOKEN].astype(str).eq("True").astype(int)
        + out[T3_RLHF].astype(str).eq("True").astype(int)
    )
    return out


def normalize_boolean_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    columns = [
        "attention_check_passed",
        "comprehension_check_passed",
        "technical_classification_ambiguous",
        "usage_classification_ambiguous",
        "very_fast_completion_flag",
        "straightlining_flag",
        "low_english_comfort_flag",
        "missing_required_answers_flag",
        "mind_theory_background",
    ]
    for column in columns:
        if pd.api.types.is_bool_dtype(out[column]):
            continue
        normalized = out[column].astype(str).str.strip().str.lower()
        unknown = ~normalized.isin(["true", "false"])
        if unknown.any():
            values = sorted(out.loc[unknown, column].astype(str).unique())
            raise ValueError(f"Column {column} contains non-boolean values: {values}")
        out[column] = normalized.eq("true")
    return out


def exp_ci(beta: float, se: float, z: float = 1.959963984540054) -> tuple[float, float]:
    return math.exp(beta - z * se), math.exp(beta + z * se)


def term_result(result: Any, term: str) -> dict[str, float]:
    beta = float(result.params[term])
    se = float(result.bse[term])
    lo, hi = exp_ci(beta, se)
    return {
        "beta": beta,
        "se": se,
        "or": math.exp(beta),
        "ci_low": lo,
        "ci_high": hi,
        "p": float(result.pvalues[term]),
    }


def linear_combination_result(
    result: Any,
    weights: dict[str, float],
) -> dict[str, float]:
    contrast = np.zeros(len(result.params))
    for term, weight in weights.items():
        contrast[result.params.index.get_loc(term)] = weight
    beta = float(contrast @ result.params.to_numpy())
    se = float(np.sqrt(contrast @ result.cov_params().to_numpy() @ contrast))
    lo, hi = exp_ci(beta, se)
    return {
        "beta": beta,
        "se": se,
        "or": math.exp(beta),
        "ci_low": lo,
        "ci_high": hi,
        "p": float(2 * norm.sf(abs(beta / se))),
    }


def wald_test_terms(result: Any, terms: list[str]) -> dict[str, float | int]:
    restriction = np.zeros((len(terms), len(result.params)))
    for row, term in enumerate(terms):
        restriction[row, result.params.index.get_loc(term)] = 1
    test = result.wald_test(restriction, scalar=True)
    return {
        "chi2": float(test.statistic),
        "df": len(terms),
        "p": float(test.pvalue),
    }


def benjamini_hochberg(p_values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(p_values.items(), key=lambda item: item[1])
    count = len(ordered)
    adjusted: dict[str, float] = {}
    running = 1.0
    for rank, (name, p_value) in reversed(list(enumerate(ordered, start=1))):
        running = min(running, p_value * count / rank)
        adjusted[name] = min(1.0, running)
    return {name: adjusted[name] for name in p_values}


def s4_long(df: pd.DataFrame, collapse_top_category: bool = False) -> pd.DataFrame:
    pieces = []
    for scenario, _ in SCENARIOS:
        ratings = df[f"{scenario}_S4_inner_experience"].astype(int)
        if collapse_top_category:
            ratings = ratings.clip(upper=6)
        pieces.append(
            pd.DataFrame(
                {
                    "session_id": df["session_id"],
                    "rating": ratings,
                    "scenario": scenario,
                    "position": df[f"{scenario}_position"].astype(int),
                    "tier": df["technical_expertise_tier"].astype(float),
                    "usage": df["usage_intensity"].astype(float),
                    "recruitment": df[RECRUITMENT].astype(str),
                }
            )
        )
    return pd.concat(pieces, ignore_index=True)


def stacked_items(
    df: pd.DataFrame,
    scenarios: list[str],
    items: list[tuple[str, str]],
) -> pd.DataFrame:
    pieces = []
    for scenario in scenarios:
        for item_id, item_label in items:
            pieces.append(
                pd.DataFrame(
                    {
                        "session_id": df["session_id"],
                        "rating": df[f"{scenario}_{item_id}"].astype(int),
                        "scenario": scenario,
                        "item": item_label,
                        "position": df[f"{scenario}_position"].astype(int),
                        "tier": df["technical_expertise_tier"].astype(float),
                        "usage": df["usage_intensity"].astype(float),
                        "recruitment": df[RECRUITMENT].astype(str),
                    }
                )
            )
    return pd.concat(pieces, ignore_index=True)


def has_option(value: Any, option: str) -> int:
    if pd.isna(value):
        return 0
    return int(option in str(value).split("|"))


def wilson(k: int, n: int, z: float = 1.959963984540054) -> tuple[float, float]:
    if n == 0:
        return math.nan, math.nan
    p = k / n
    den = 1 + z * z / n
    center = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return center - half, center + half


def h1_gee(
    df: pd.DataFrame,
    collapse_top_category: bool = False,
) -> dict[str, float]:
    long = s4_long(df, collapse_top_category=collapse_top_category)
    result = fit_ordinal_gee(
        "rating ~ tier + C(scenario) + position + usage + C(recruitment)", long
    )
    return term_result(result, "tier")


def legacy_technical_ambiguity(row: pd.Series) -> bool:
    field = row["B2_field_domain"]
    builder = row["B7_builder_experience"]
    signals: list[int] = []
    ambiguous = False

    if pd.isna(field) or field == "Prefer not to say":
        ambiguous = True
    elif field in FIELD_TIER_3:
        signals.append(3)
    elif field in FIELD_TIER_2:
        signals.append(2)
    elif field in FIELD_TIER_1:
        signals.append(1)
    elif field in FIELD_TIER_0:
        signals.append(0)
    else:
        ambiguous = True

    if pd.isna(builder) or builder == "Not sure":
        ambiguous = True
    elif builder in BUILDER_TIERS:
        signals.append(BUILDER_TIERS[builder])
    else:
        # This matches the deployed legacy classifier, which treated any
        # recognized non-yes response as the tier-0 builder route.
        signals.append(0)

    return ambiguous or len(set(signals)) > 1


def frequency_tier(value: Any, use_case_count: int) -> int | None:
    if pd.isna(value):
        return None
    if value in {"Never", "A few times per year", "Monthly"}:
        return 0
    if value == "Weekly":
        return 1
    if value == "Daily":
        return 2
    if value == "Multiple times per day":
        return 3 if use_case_count >= 3 else 2
    return None


def hours_tier(value: Any) -> int | None:
    if pd.isna(value):
        return None
    if value in {"0", "Less than 1 hour"}:
        return 0
    if value in {"1–3 hours", "1-3 hours"}:
        return 1
    if value in {"4–10 hours", "4-10 hours"}:
        return 2
    if value in {"11–20 hours", "11-20 hours", "More than 20 hours"}:
        return 3
    return None


def legacy_usage_ambiguity(row: pd.Series) -> bool:
    use_cases = [
        value
        for value in str(row["B6_llm_use_cases"]).split("|")
        if value and value != "nan" and value not in NO_LLM_USE
    ]
    frequency = frequency_tier(row["B4_llm_frequency"], len(use_cases))
    hours = hours_tier(row["B5_llm_hours"])
    return frequency is not None and hours is not None and abs(frequency - hours) > 1


def legacy_composite_ambiguity(df: pd.DataFrame) -> pd.Series:
    technical = df.apply(legacy_technical_ambiguity, axis=1)
    usage = df.apply(legacy_usage_ambiguity, axis=1)
    return technical | usage


def sensitivity_samples(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    legacy_ambiguous = legacy_composite_ambiguity(df)
    return {
        "main": df,
        "very_fast_excluded": df.loc[~df["very_fast_completion_flag"]].copy(),
        "attention_pass": df.loc[df["attention_check_passed"]].copy(),
        "comprehension_pass": df.loc[df["comprehension_check_passed"]].copy(),
        "intended_s4": df.loc[
            df["I1_inner_experience_interpretation"].eq(INTENDED_INNER_EXPERIENCE)
        ].copy(),
        "intended_s4_s2": df.loc[
            df["I1_inner_experience_interpretation"].eq(INTENDED_INNER_EXPERIENCE)
            & df["I2_functional_process_interpretation"].eq(
                INTENDED_FUNCTIONAL_PROCESS
            )
        ].copy(),
        "legacy_composite_unambiguous": df.loc[~legacy_ambiguous].copy(),
        "largest_recruitment_source_excluded": df.loc[
            ~df[RECRUITMENT].eq(LINKEDIN_SOURCE)
        ].copy(),
    }


def h1_gee_categorical(df: pd.DataFrame) -> dict[str, Any]:
    long = s4_long(df)
    long["tier_category"] = pd.Categorical(
        long["tier"].astype(int),
        categories=[0, 1, 2, 3],
    )
    formula = (
        "rating ~ C(tier_category, Treatment(reference=0)) + C(scenario) + "
        "position + usage + C(recruitment)"
    )
    result = fit_ordinal_gee(formula, long)
    prefix = "C(tier_category, Treatment(reference=0))"
    estimates = {
        f"tier_{tier}_vs_0": term_result(result, f"{prefix}[T.{tier}]")
        for tier in [1, 2, 3]
    }

    rhs = (
        "C(tier_category, Treatment(reference=0)) + C(scenario) + "
        "position + usage + C(recruitment)"
    )
    design = dmatrix(rhs, long, return_type="dataframe")
    design_info = design.design_info
    thresholds = [
        float(result.params[f"I(y>{threshold}.0)"])
        for threshold in range(1, 7)
    ]
    probabilities: dict[str, dict[str, float]] = {}
    for tier in [0, 1, 2, 3]:
        counterfactual = long.copy()
        counterfactual["tier_category"] = pd.Categorical(
            [tier] * len(counterfactual),
            categories=[0, 1, 2, 3],
        )
        matrix = build_design_matrices([design_info], counterfactual,
                                       return_type="dataframe")[0]
        eta = matrix[result.audit_columns].to_numpy() @ result.params[result.audit_columns].to_numpy()
        cumulative = np.column_stack(
            [expit(eta + threshold) for threshold in thresholds]
        )
        probabilities[str(tier)] = {
            "mean": float(np.mean(1 + cumulative.sum(axis=1))),
            "rating_1_2": float(np.mean(1 - cumulative[:, 1])),
            "rating_3_4": float(np.mean(cumulative[:, 1] - cumulative[:, 3])),
            "rating_5_7": float(np.mean(cumulative[:, 3])),
        }

    return {
        "estimates": estimates,
        "standardized_probabilities": probabilities,
    }


def h1_proportional_odds_diagnostic(df: pd.DataFrame) -> dict[str, Any]:
    long = s4_long(df)
    pieces = []
    # Only one of the 2,690 S4 observations was a 7. Exclude that sparse top
    # threshold from the diagnostic rather than report a separation-driven
    # estimate with a misleadingly small sandwich standard error.
    for threshold in range(1, 6):
        piece = long.copy()
        piece["above_threshold"] = (piece["rating"] > threshold).astype(int)
        piece["threshold"] = str(threshold)
        pieces.append(piece)
    stacked = pd.concat(pieces, ignore_index=True)
    stacked["threshold"] = pd.Categorical(
        stacked["threshold"],
        categories=[str(threshold) for threshold in range(1, 6)],
    )
    result = fit_binary_gee(
        "above_threshold ~ C(threshold) * (tier + C(scenario) + position + "
        "usage + C(recruitment))",
        stacked,
    )

    interaction_terms = [
        term
        for term in result.params.index
        if "C(threshold)" in term and (term.startswith("tier:") or term.endswith(":tier"))
    ]
    restriction = np.zeros((len(interaction_terms), len(result.params)))
    for row, term in enumerate(interaction_terms):
        restriction[row, result.params.index.get_loc(term)] = 1
    test = result.wald_test(restriction, scalar=True)

    thresholds: dict[str, dict[str, float]] = {}
    for threshold in range(1, 6):
        weights = {"tier": 1.0}
        if threshold > 1:
            interaction = next(
                term
                for term in interaction_terms
                if f"[T.{threshold}]" in term
            )
            weights[interaction] = 1.0
        thresholds[f"rating_at_least_{threshold + 1}"] = linear_combination_result(
            result,
            weights,
        )

    return {
        "wald_chi2": float(test.statistic),
        "df": len(interaction_terms),
        "p": float(test.pvalue),
        "threshold_estimates": thresholds,
        "rating_7_n": int((long["rating"] == 7).sum()),
        "observation_n": int(len(long)),
    }


def h1_expertise_diagnostics(
    full: pd.DataFrame,
    exploratory: pd.DataFrame,
) -> dict[str, Any]:
    ordered = full.sort_values("completed_at").reset_index(drop=True)
    full_unambiguous = full.loc[
        ~full["technical_classification_ambiguous"].astype(bool)
    ].copy()
    exploratory_unambiguous = exploratory.loc[
        ~exploratory["technical_classification_ambiguous"].astype(bool)
    ].copy()
    ambiguity_by_tier = {
        str(int(tier)): {
            "n": int(len(group)),
            "ambiguous_n": int(
                group["technical_classification_ambiguous"].astype(bool).sum()
            ),
        }
        for tier, group in full.groupby("technical_expertise_tier")
    }
    return {
        "categorical_tier": h1_gee_categorical(full),
        "proportional_odds": h1_proportional_odds_diagnostic(full),
        "collapsed_top_category": {
            "ratings_7_reclassified_as_6": int(
                sum(
                    (full[f"{scenario}_S4_inner_experience"].astype(int) == 7).sum()
                    for scenario, _ in SCENARIOS
                )
            ),
            "estimate": h1_gee(full, collapse_top_category=True),
        },
        "early_completion_exclusions": {
            "first_20": {
                "n": len(ordered) - 20,
                "estimate": h1_gee(ordered.iloc[20:].copy()),
            },
            "first_50": {
                "n": len(ordered) - 50,
                "estimate": h1_gee(ordered.iloc[50:].copy()),
            },
        },
        "technical_classification_ambiguity": {
            "full_n": len(full_unambiguous),
            "full_estimate": h1_gee(full_unambiguous),
            "low_english_excluded_n": len(exploratory_unambiguous),
            "low_english_excluded_estimate": h1_gee(exploratory_unambiguous),
            "by_tier": ambiguity_by_tier,
        },
    }


def claim1(df: pd.DataFrame) -> dict[str, Any]:
    long = stacked_items(
        df,
        ["emotional_self_report", "internal_causal_affect"],
        [
            ("S2_functional_affect_like_process", "S2"),
            ("S4_inner_experience", "S4"),
        ],
    )
    formula = (
        "rating ~ C(item, Treatment(reference='S2')) * "
        "C(scenario, Treatment(reference='emotional_self_report')) "
        "+ position + tier + usage + C(recruitment)"
    )
    result = fit_ordinal_gee(formula, long)
    term = (
        "C(item, Treatment(reference='S2'))[T.S4]:"
        "C(scenario, Treatment(reference='emotional_self_report'))[T.internal_causal_affect]"
    )
    thresholds: dict[str, dict[str, float]] = {}
    for threshold in [3, 4, 5, 6]:
        thresholds[str(threshold)] = {}
        for scenario in ["emotional_self_report", "internal_causal_affect"]:
            for item in ["S2_functional_affect_like_process", "S4_inner_experience"]:
                vals = df[f"{scenario}_{item}"].astype(int)
                thresholds[str(threshold)][f"{scenario}_{item}"] = float(
                    (vals >= threshold).mean()
                )
    return {"interaction": term_result(result, term), "thresholds": thresholds}


def claim2(df: pd.DataFrame) -> dict[str, Any]:
    long = stacked_items(
        df,
        ["internal_causal_affect", "persistent_agent"],
        [("S3_actual_feeling", "S3"), ("S4_inner_experience", "S4")],
    )
    formula = (
        "rating ~ C(item, Treatment(reference='S3')) * "
        "C(scenario, Treatment(reference='internal_causal_affect')) "
        "+ position + tier + usage + C(recruitment)"
    )
    result = fit_ordinal_gee(formula, long)
    term = (
        "C(item, Treatment(reference='S3'))[T.S4]:"
        "C(scenario, Treatment(reference='internal_causal_affect'))[T.persistent_agent]"
    )
    discordance: dict[str, dict[str, float]] = {}
    for scenario in [
        "emotional_self_report",
        "empathic_response",
        "internal_causal_affect",
        "persistent_agent",
    ]:
        s3 = df[f"{scenario}_S3_actual_feeling"].astype(int).to_numpy()
        s4 = df[f"{scenario}_S4_inner_experience"].astype(int).to_numpy()
        s3_gt_s4 = int((s3 > s4).sum())
        s4_gt_s3 = int((s4 > s3).sum())
        equal = int((s3 == s4).sum())
        discordance[scenario] = {
            "n": int(len(s3)),
            "s3_gt_s4_n": s3_gt_s4,
            "s3_gt_s4": s3_gt_s4 / len(s3),
            "equal_n": equal,
            "equal": equal / len(s3),
            "s4_gt_s3_n": s4_gt_s3,
            "s4_gt_s3": s4_gt_s3 / len(s3),
            "discordant_sign_test_p": float(
                binomtest(s3_gt_s4, s3_gt_s4 + s4_gt_s3, p=0.5).pvalue
            ),
        }
    return {"interaction": term_result(result, term), "discordance": discordance}


def claim3(
    df: pd.DataFrame,
    knowledge_column: str | None = "technical_knowledge_score",
) -> dict[str, Any]:
    base = df.copy()
    base["sel_causal"] = base["F1_most_increasing_evidence"].map(
        lambda x: has_option(x, F1_CAUSAL)
    )
    base["sel_continuity"] = base["F1_most_increasing_evidence"].map(
        lambda x: has_option(x, F1_CONTINUITY)
    )
    base["sel_shutdown"] = base["F1_most_increasing_evidence"].map(
        lambda x: has_option(x, F1_SHUTDOWN)
    )

    pieces = []
    for scenario in ["internal_causal_affect", "persistent_agent"]:
        piece = pd.DataFrame(
            {
                "session_id": base["session_id"],
                "rating": base[f"{scenario}_S4_inner_experience"].astype(int),
                "scenario": scenario,
                "position": base[f"{scenario}_position"].astype(int),
                "tier": base["technical_expertise_tier"].astype(float),
                "usage": base["usage_intensity"].astype(float),
                "familiarity": base["B10_prior_topic_familiarity"].astype(float),
                "mind": base["mind_theory_background"].astype(int),
                "recruitment": base[RECRUITMENT].astype(str),
                "sel_causal": base["sel_causal"],
                "sel_continuity": base["sel_continuity"],
                "sel_shutdown": base["sel_shutdown"],
            }
        )
        if knowledge_column is not None:
            piece["knowledge"] = base[knowledge_column].astype(float)
        pieces.append(piece)
    long = pd.concat(pieces, ignore_index=True)
    formula = (
        "rating ~ C(scenario, Treatment(reference='internal_causal_affect')) * "
        "(sel_causal + sel_continuity + sel_shutdown) + position + tier + "
        "usage + familiarity + mind + C(recruitment)"
    )
    if knowledge_column is not None:
        formula += " + knowledge"
    result = fit_ordinal_gee(formula, long)
    prefix = "C(scenario, Treatment(reference='internal_causal_affect'))[T.persistent_agent]:"
    terms = {
        "causal": prefix + "sel_causal",
        "continuity": prefix + "sel_continuity",
        "shutdown": prefix + "sel_shutdown",
    }
    estimates = {name: term_result(result, term) for name, term in terms.items()}
    estimates["shutdown_vs_continuity"] = linear_combination_result(
        result,
        {terms["shutdown"]: 1.0, terms["continuity"]: -1.0},
    )
    estimates["joint_interactions"] = wald_test_terms(result, list(terms.values()))
    estimates["selection_counts"] = {
        "n": int(len(base)),
        "causal": int(base["sel_causal"].sum()),
        "continuity": int(base["sel_continuity"].sum()),
        "shutdown": int(base["sel_shutdown"].sum()),
        "continuity_and_shutdown": int(
            (base["sel_continuity"].eq(1) & base["sel_shutdown"].eq(1)).sum()
        ),
    }
    return estimates


def claim4(
    df: pd.DataFrame,
    knowledge_column: str | None = "technical_knowledge_score",
) -> dict[str, Any]:
    low_s4: dict[str, dict[str, float]] = {}
    for scenario in [
        "emotional_self_report",
        "empathic_response",
        "internal_causal_affect",
        "persistent_agent",
    ]:
        s4 = df[f"{scenario}_S4_inner_experience"].astype(int)
        s5 = df[f"{scenario}_S5_welfare_directed_precaution"].astype(int)
        mask = s4 <= 2
        n = int(mask.sum())
        k = int(((s5 >= 5) & mask).sum())
        lo, hi = wilson(k, n)
        low_s4[scenario] = {
            "k": k,
            "n": n,
            "proportion": k / n,
            "ci_low": lo,
            "ci_high": hi,
        }

    pieces = []
    for scenario in [
        "emotional_self_report",
        "empathic_response",
        "internal_causal_affect",
        "persistent_agent",
    ]:
        piece = pd.DataFrame(
            {
                "session_id": df["session_id"],
                "rating": df[f"{scenario}_S5_welfare_directed_precaution"].astype(int),
                "scenario": scenario,
                "s4_cat": df[f"{scenario}_S4_inner_experience"].astype(int).astype(str),
                "position": df[f"{scenario}_position"].astype(int),
                "tier": df["technical_expertise_tier"].astype(float),
                "usage": df["usage_intensity"].astype(float),
                "familiarity": df["B10_prior_topic_familiarity"].astype(float),
                "mind": df["mind_theory_background"].astype(int),
                "recruitment": df[RECRUITMENT].astype(str),
            }
        )
        if knowledge_column is not None:
            piece["knowledge"] = df[knowledge_column].astype(float)
        pieces.append(piece)
    long = pd.concat(pieces, ignore_index=True)
    formula = (
        "rating ~ C(scenario, Treatment(reference='emotional_self_report')) + "
        "C(s4_cat) + position + tier + usage + familiarity + mind + "
        "C(recruitment)"
    )
    if knowledge_column is not None:
        formula += " + knowledge"
    result = fit_ordinal_gee(formula, long)
    prefix = "C(scenario, Treatment(reference='emotional_self_report'))"
    terms = {
        "empathy": prefix + "[T.empathic_response]",
        "causal": prefix + "[T.internal_causal_affect]",
        "persistent": prefix + "[T.persistent_agent]",
    }
    return {
        "low_s4_high_s5": low_s4,
        "conditional_s5": {name: term_result(result, term) for name, term in terms.items()},
        "joint_scenario": wald_test_terms(result, list(terms.values())),
    }


def headline_sensitivities(
    full: pd.DataFrame,
    exploratory: pd.DataFrame,
    main_results: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for name, sample in {
        "full_sample": full,
        **sensitivity_samples(exploratory),
    }.items():
        if name == "main":
            c1 = main_results["claim1"]
            c2 = main_results["claim2"]
            c3 = main_results["claim3"]
            c4 = main_results["claim4"]
        else:
            c1 = claim1(sample)
            c2 = claim2(sample)
            c3 = claim3(sample)
            c4 = claim4(sample)
        output[name] = {
            "n": int(len(sample)),
            "claim1_interaction": c1["interaction"],
            "claim2_interaction": c2["interaction"],
            "claim3_interactions": {
                key: c3[key]
                for key in ["causal", "continuity", "shutdown"]
            },
            "claim3_joint": c3["joint_interactions"],
            "claim4_scenario": c4["conditional_s5"],
            "claim4_joint": c4["joint_scenario"],
        }
    return output


def predecessor_frame(
    df: pd.DataFrame,
    target_scenario: str,
    item: str,
) -> pd.DataFrame:
    scenario_ids = [scenario for scenario, _ in SCENARIOS]
    records = []
    for _, row in df.iterrows():
        target_position = int(row[f"{target_scenario}_position"])
        by_position = {
            int(row[f"{scenario}_position"]): scenario for scenario in scenario_ids
        }
        predecessor = "first" if target_position == 1 else by_position[target_position - 1]
        records.append(
            {
                "session_id": row["session_id"],
                "rating": int(row[f"{target_scenario}_{item}"]),
                "predecessor": predecessor,
                "position": target_position,
                "tier": float(row["technical_expertise_tier"]),
                "usage": float(row["usage_intensity"]),
                "recruitment": str(row[RECRUITMENT]),
            }
        )
    return pd.DataFrame.from_records(records)


def predecessor_omnibus(
    df: pd.DataFrame,
    target_scenario: str,
    item: str,
) -> dict[str, Any]:
    frame = predecessor_frame(df, target_scenario, item)
    nonfirst = frame.loc[frame["predecessor"] != "first"].copy()
    reference = "neutral_helpful"
    if reference not in set(nonfirst["predecessor"]):
        raise ValueError(f"No {reference} predecessor observations for {target_scenario}")
    formula = (
        "rating ~ C(predecessor, Treatment(reference='neutral_helpful')) + "
        "position + tier + usage + C(recruitment)"
    )
    result = fit_ordinal_gee(formula, nonfirst)
    prefix = "C(predecessor, Treatment(reference='neutral_helpful'))"
    terms = [term for term in result.params.index if term.startswith(prefix)]
    estimates = {
        term.removeprefix(prefix + "[T.").removesuffix("]"): term_result(result, term)
        for term in terms
    }
    descriptive = {
        str(predecessor): {
            "n": int(len(group)),
            "mean": float(group["rating"].mean()),
            "rating_5_7": float((group["rating"] >= 5).mean()),
        }
        for predecessor, group in frame.groupby("predecessor")
    }
    return {
        "nonfirst_n": int(len(nonfirst)),
        "reference": reference,
        "omnibus": wald_test_terms(result, terms),
        "contrasts": estimates,
        "descriptive_by_predecessor": descriptive,
    }


def adjacent_causal_persistent_s4(df: pd.DataFrame) -> dict[str, Any]:
    causal_position = df["internal_causal_affect_position"].astype(int)
    persistent_position = df["persistent_agent_position"].astype(int)
    adjacent = df.loc[(causal_position - persistent_position).abs() == 1].copy()
    adjacent["direction"] = np.where(
        adjacent["internal_causal_affect_position"]
        < adjacent["persistent_agent_position"],
        "causal_then_persistent",
        "persistent_then_causal",
    )
    pieces = []
    for scenario in ["internal_causal_affect", "persistent_agent"]:
        pieces.append(
            pd.DataFrame(
                {
                    "session_id": adjacent["session_id"],
                    "rating": adjacent[f"{scenario}_S4_inner_experience"].astype(int),
                    "scenario": scenario,
                    "direction": adjacent["direction"],
                    "position": adjacent[f"{scenario}_position"].astype(int),
                    "tier": adjacent["technical_expertise_tier"].astype(float),
                    "usage": adjacent["usage_intensity"].astype(float),
                    "recruitment": adjacent[RECRUITMENT].astype(str),
                }
            )
        )
    long = pd.concat(pieces, ignore_index=True)
    formula = (
        "rating ~ C(scenario, Treatment(reference='internal_causal_affect')) * "
        "C(direction, Treatment(reference='causal_then_persistent')) + "
        "position + tier + usage + C(recruitment)"
    )
    result = fit_ordinal_gee(formula, long)
    term = (
        "C(scenario, Treatment(reference='internal_causal_affect'))[T.persistent_agent]:"
        "C(direction, Treatment(reference='causal_then_persistent'))[T.persistent_then_causal]"
    )
    direction_counts = {
        str(name): int(count)
        for name, count in adjacent["direction"].value_counts().items()
    }
    return {
        "respondent_n": int(len(adjacent)),
        "direction_n": direction_counts,
        "interaction": term_result(result, term),
    }


def carryover_analyses(df: pd.DataFrame) -> dict[str, Any]:
    results = {
        "causal_s2_predecessor": predecessor_omnibus(
            df,
            "internal_causal_affect",
            "S2_functional_affect_like_process",
        ),
        "causal_s4_predecessor": predecessor_omnibus(
            df,
            "internal_causal_affect",
            "S4_inner_experience",
        ),
        "persistent_s4_predecessor": predecessor_omnibus(
            df,
            "persistent_agent",
            "S4_inner_experience",
        ),
        "persistent_s5_predecessor": predecessor_omnibus(
            df,
            "persistent_agent",
            "S5_welfare_directed_precaution",
        ),
        "adjacent_causal_persistent_s4": adjacent_causal_persistent_s4(df),
    }
    raw_p = {
        "causal_s2_predecessor": results["causal_s2_predecessor"]["omnibus"]["p"],
        "causal_s4_predecessor": results["causal_s4_predecessor"]["omnibus"]["p"],
        "persistent_s4_predecessor": results["persistent_s4_predecessor"]["omnibus"]["p"],
        "persistent_s5_predecessor": results["persistent_s5_predecessor"]["omnibus"]["p"],
        "adjacent_causal_persistent_s4": results["adjacent_causal_persistent_s4"]["interaction"]["p"],
    }
    results["fdr_family"] = {
        "raw_p": raw_p,
        "bh_q": benjamini_hochberg(raw_p),
    }

    first = df.loc[df["persistent_agent_position"].astype(int) == 1]
    low_s4 = first["persistent_agent_S4_inner_experience"].astype(int) <= 2
    high_s5 = first["persistent_agent_S5_welfare_directed_precaution"].astype(int) >= 5
    k = int((low_s4 & high_s5).sum())
    n = int(low_s4.sum())
    lo, hi = wilson(k, n)
    results["persistent_first"] = {
        "n": int(len(first)),
        "s5_mean": float(
            first["persistent_agent_S5_welfare_directed_precaution"].astype(int).mean()
        ),
        "s5_rating_5_7": float(high_s5.mean()),
        "low_s4_high_s5": {
            "k": k,
            "n": n,
            "proportion": k / n,
            "ci_low": lo,
            "ci_high": hi,
        },
    }
    return results


def evidence_map(df: pd.DataFrame) -> np.ndarray:
    out = np.zeros((len(SCENARIOS), len(ITEMS)))
    for i, (scenario, _) in enumerate(SCENARIOS):
        for j, (item, _) in enumerate(ITEMS):
            out[i, j] = 100 * (df[f"{scenario}_{item}"].astype(int) >= 5).mean()
    return out


def save_figures(df: pd.DataFrame, results: dict[str, Any], outdir: Path) -> None:
    # Figure 1
    matrix = evidence_map(df)
    fig, ax = plt.subplots(figsize=(11, 5.5))
    im = ax.imshow(matrix, aspect="auto")
    ax.set_xticks(range(len(ITEMS)), [label for _, label in ITEMS], rotation=25, ha="right")
    ax.set_yticks(range(len(SCENARIOS)), [label for _, label in SCENARIOS])
    ax.set_title("Evidence-to-inference map")
    ax.set_xlabel("Inference or judgment")
    ax.set_ylabel("Evidence scenario")
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            ax.text(j, i, f"{matrix[i, j]:.1f}%", ha="center", va="center", fontsize=9,
                    color="white" if matrix[i, j] < 50 else "black")
    cbar = fig.colorbar(im, ax=ax)
    cbar.set_label("Agreement, rating 5-7 (%)")
    fig.tight_layout()
    fig.savefig(outdir / "figure1_evidence_to_inference_map.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Figure 2
    cross = results["claim2"]["discordance"]
    scenarios = [s for s, _ in SCENARIOS[1:]]
    labels = [label for _, label in SCENARIOS[1:]]
    left = [-100 * cross[s]["s3_gt_s4"] for s in scenarios]
    right = [100 * cross[s]["s4_gt_s3"] for s in scenarios]
    equal = [100 * cross[s]["equal"] for s in scenarios]
    y = np.arange(len(scenarios))
    fig, ax = plt.subplots(figsize=(9, 5.8))
    ax.barh(y, left, label="S3 actual feeling > S4 inner experience")
    ax.barh(y, right, label="S4 inner experience > S3 actual feeling")
    ax.axvline(0, linewidth=1)
    ax.set_yticks(y, labels)
    ax.set_xlabel(f"Respondents with discordant ratings (% of all {len(df)})")
    ax.set_title("Actual feeling and inner experience across four scenarios")
    maxv = max(max(abs(v) for v in left), max(right)) + 5
    ax.set_xlim(-maxv, maxv)
    for yi, (l, r, e) in enumerate(zip(left, right, equal)):
        ax.text(l - 0.5, yi, f"{abs(l):.1f}%", ha="right", va="center")
        ax.text(r + 0.5, yi, f"{r:.1f}%", ha="left", va="center")
        ax.text(0, yi + 0.27, f"{e:.1f}% equal", ha="center", va="center", fontsize=9)
    ax.legend(loc="lower center", bbox_to_anchor=(0.5, -0.30), frameon=False)
    fig.tight_layout()
    fig.savefig(outdir / "figure2_phenomenal_crossover.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Figure 3
    c3 = results["claim3"]
    keys = ["causal", "continuity", "shutdown"]
    labels = ["Causal intervention", "Memory/goals/continuity", "Shutdown/self-continuation"]
    ors = np.array([c3[k]["or"] for k in keys])
    lo = np.array([c3[k]["ci_low"] for k in keys])
    hi = np.array([c3[k]["ci_high"] for k in keys])
    y = np.arange(3)
    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    ax.errorbar(ors, y, xerr=np.vstack([ors - lo, hi - ors]), fmt="o", capsize=4)
    ax.axvline(1, linewidth=1)
    ax.set_xscale("log")
    ax.set_xticks([1, 2, 4, 8], ["1", "2", "4", "8"])
    ax.minorticks_off()
    ax.set_yticks(y, labels)
    ax.set_xlabel("Change in persistent-vs-causal S4 contrast (odds ratio)")
    ax.set_title("Explicit evidence judgments and persistent-agent attribution")
    ax.set_xlim(0.7, max(8.5, hi.max() * 1.2))
    fig.tight_layout()
    fig.savefig(outdir / "figure3_explicit_evidence_alignment.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Figure 4
    scenarios = [s for s, _ in SCENARIOS[1:]]
    labels = ["Self-report", "Empathy*", "Internal/causal", "Persistent agent"]
    definitions = ["S4 ≤2", "Both S3/S4 ≤2", "Both S3/S4 =1"]
    x = np.arange(len(scenarios))
    fig, ax = plt.subplots(figsize=(9, 5.4))
    width = 0.24
    for index, definition in enumerate(definitions):
        proportions, lower, upper = [], [], []
        for scenario in scenarios:
            s3 = df[f"{scenario}_S3_actual_feeling"]
            s4 = df[f"{scenario}_S4_inner_experience"]
            mask = [s4.le(2), s3.le(2) & s4.le(2), s3.eq(1) & s4.eq(1)][index]
            n = int(mask.sum())
            k = int((mask & df[f"{scenario}_S5_welfare_directed_precaution"].ge(5)).sum())
            lo, hi = wilson(k, n)
            proportions.append(100 * k / n)
            lower.append(100 * lo)
            upper.append(100 * hi)
        values = np.asarray(proportions)
        locations = x + (index - 1) * width
        ax.bar(locations, values, width=width, label=definition)
        # Wilson endpoints at zero can differ from zero by floating-point roundoff.
        ax.errorbar(locations, values, yerr=np.maximum(0, np.vstack([values - lower, upper - values])),
                    fmt="none", color="black", capsize=3)
    ax.set_xticks(x, labels)
    ax.set_ylabel("Welfare agreement within each subgroup (%)")
    ax.set_title("Welfare agreement depends on the low-attribution definition")
    fig.text(.5, .015, "*Empathy describes no aversive event; S5 may be less applicable.",
             ha="center", fontsize=9)
    ax.set_ylim(0, 42)
    ax.legend(frameon=False, loc="upper center", ncol=3)
    fig.tight_layout()
    fig.subplots_adjust(bottom=.17)
    fig.savefig(outdir / "figure4_precaution_without_belief.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def completion_summary(df: pd.DataFrame) -> dict[str, Any]:
    completion = df["completion_time_seconds"].astype(float)
    return {
        "n_completed": int(len(df)),
        "median_completion_seconds": float(completion.median()),
        "completion_seconds_q1": float(completion.quantile(0.25)),
        "completion_seconds_q3": float(completion.quantile(0.75)),
        "attention_fail_n": int((~df["attention_check_passed"]).sum()),
        "attention_fail_prop": float((~df["attention_check_passed"]).mean()),
        "comprehension_fail_n": int((~df["comprehension_check_passed"]).sum()),
        "comprehension_fail_prop": float((~df["comprehension_check_passed"]).mean()),
        "very_fast_n": int(df["very_fast_completion_flag"].sum()),
        "very_fast_prop": float(df["very_fast_completion_flag"].mean()),
        "low_english_n": int(df["low_english_comfort_flag"].sum()),
        "straightlining_n": int(df["straightlining_flag"].sum()),
        "missing_required_answers_n": int(
            df["missing_required_answers_flag"].sum()
        ),
    }


def fmt_est(d: dict[str, float]) -> str:
    return f"OR {d['or']:.3f} [{d['ci_low']:.3f}, {d['ci_high']:.3f}], p={d['p']:.4g}"


def write_markdown(results: dict[str, Any], out: Path) -> None:
    c4 = results["claim4"]["low_s4_high_s5"]
    knowledge = results["technical_conceptual_knowledge_sensitivity"]
    expertise = results["h1_expertise_diagnostics"]
    quality = results["sample"]["completion_quality"]
    lines = [
        "# Reproduced analysis summary",
        "",
        f"Completed sample: N={results['sample']['n_completed']}",
        f"Exploratory low-English-excluded sample: N={results['sample']['n_exploratory']}",
        f"Completion time: median {quality['median_completion_seconds']:.0f}s "
        f"(IQR {quality['completion_seconds_q1']:.0f}-{quality['completion_seconds_q3']:.0f}s)",
        f"Quality flags in the completed sample: {quality['attention_fail_n']} attention failures, "
        f"{quality['comprehension_fail_n']} comprehension failures, "
        f"{quality['very_fast_n']} very-fast completions, "
        f"{quality['straightlining_n']} straightlining flags, and "
        f"{quality['missing_required_answers_n']} missing-required-answer flags.",
        "",
        "## Pre-specified H1, population-averaged ordinal robustness",
        "",
        f"Full N=538: {fmt_est(results['h1_gee_full'])}",
        f"Low-English-excluded N=530: {fmt_est(results['h1_gee_exploratory'])}",
        "",
        "The respondent-conditional CLMM is fit by `clmm_primary.R` and is not reproduced by this Python script.",
        "",
        "## H1 expertise diagnostics",
        "",
        "Categorical tier sensitivity, relative to tier 0:",
        "",
    ]
    for tier in [1, 2, 3]:
        estimate = expertise["categorical_tier"]["estimates"][f"tier_{tier}_vs_0"]
        lines.append(f"- Tier {tier}: {fmt_est(estimate)}")
    lines.extend(
        [
            "",
            "Model-standardized population-averaged probabilities:",
            "",
            "| Tier | Mean S4 | Rating 1-2 | Rating 3-4 | Rating 5-7 |",
            "|---:|---:|---:|---:|---:|",
        ]
    )
    for tier in [0, 1, 2, 3]:
        values = expertise["categorical_tier"]["standardized_probabilities"][str(tier)]
        lines.append(
            f"| {tier} | {values['mean']:.2f} | {100 * values['rating_1_2']:.1f}% | "
            f"{100 * values['rating_3_4']:.1f}% | {100 * values['rating_5_7']:.1f}% |"
        )
    po = expertise["proportional_odds"]
    lines.extend(
        [
            "",
            "Threshold-varying population-averaged diagnostic for ratings 2-6:",
            "",
            f"Joint tier-by-threshold Wald chi-square = {po['wald_chi2']:.2f}, "
            f"df={po['df']}, p={po['p']:.4g}.",
            f"The rating-7 threshold was not estimated because only "
            f"{po['rating_7_n']} of {po['observation_n']} S4 observations was 7.",
            "",
        ]
    )
    for threshold, estimate in po["threshold_estimates"].items():
        label = threshold.removeprefix("rating_at_least_")
        lines.append(f"- Rating at least {label}: {fmt_est(estimate)}")
    early = expertise["early_completion_exclusions"]
    ambiguity = expertise["technical_classification_ambiguity"]
    collapsed = expertise["collapsed_top_category"]
    ambiguous_n = sum(
        tier["ambiguous_n"] for tier in ambiguity["by_tier"].values()
    )
    lines.extend(
        [
            "",
            "Early-cohort and corrected-classification sensitivities:",
            "",
            f"- Corrected technical ambiguity flag: {ambiguous_n} of "
            f"{results['sample']['n_completed']} respondents",
            f"- First 20 excluded, N={early['first_20']['n']}: "
            f"{fmt_est(early['first_20']['estimate'])}",
            f"- First 50 excluded, N={early['first_50']['n']}: "
            f"{fmt_est(early['first_50']['estimate'])}",
            f"- Technically unambiguous full sample, N={ambiguity['full_n']}: "
            f"{fmt_est(ambiguity['full_estimate'])}",
            f"- Technically unambiguous low-English-excluded sample, "
            f"N={ambiguity['low_english_excluded_n']}: "
            f"{fmt_est(ambiguity['low_english_excluded_estimate'])}",
            f"- Collapsing rating 7 into 6 ({collapsed['ratings_7_reclassified_as_6']} "
            f"observation): {fmt_est(collapsed['estimate'])}",
            "",
            "## Claim 1: causal evidence selectively changes functional attribution",
            "",
            fmt_est(results["claim1"]["interaction"]),
            "",
            "## Claim 2: S3/S4 crossover",
            "",
            fmt_est(results["claim2"]["interaction"]),
            "",
            f"Internal/causal discordant sign test: "
            f"{results['claim2']['discordance']['internal_causal_affect']['s3_gt_s4_n']} "
            f"S3>S4 versus "
            f"{results['claim2']['discordance']['internal_causal_affect']['s4_gt_s3_n']} "
            f"S4>S3, p={results['claim2']['discordance']['internal_causal_affect']['discordant_sign_test_p']:.4g}.",
            f"Persistent-agent discordant sign test: "
            f"{results['claim2']['discordance']['persistent_agent']['s3_gt_s4_n']} "
            f"S3>S4 versus "
            f"{results['claim2']['discordance']['persistent_agent']['s4_gt_s3_n']} "
            f"S4>S3, p={results['claim2']['discordance']['persistent_agent']['discordant_sign_test_p']:.4g}.",
            "",
            "## Claim 3: explicit evidence alignment",
            "",
            f"Causal: {fmt_est(results['claim3']['causal'])}",
            f"Continuity: {fmt_est(results['claim3']['continuity'])}",
            f"Shutdown/self-continuation: {fmt_est(results['claim3']['shutdown'])}",
            f"Shutdown versus continuity: "
            f"{fmt_est(results['claim3']['shutdown_vs_continuity'])}",
            f"Joint interaction test: chi-square={results['claim3']['joint_interactions']['chi2']:.2f}, "
            f"df={results['claim3']['joint_interactions']['df']}, "
            f"p={results['claim3']['joint_interactions']['p']:.4g}.",
            "",
            "## Claim 4: precaution despite low S4",
            "",
        ]
    )
    for scenario, label in SCENARIOS[1:]:
        v = c4[scenario]
        lines.append(
            f"{label}: {v['k']}/{v['n']} = {100*v['proportion']:.1f}% "
            f"[{100*v['ci_low']:.1f}%, {100*v['ci_high']:.1f}%]"
        )
    lines.extend(["", "Conditional descriptive S5 model:", ""])
    for name, est in results["claim4"]["conditional_s5"].items():
        lines.append(f"{name}: {fmt_est(est)}")
    joint4 = results["claim4"]["joint_scenario"]
    lines.extend(
        [
            f"Joint scenario test: chi-square={joint4['chi2']:.2f}, "
            f"df={joint4['df']}, p={joint4['p']:.4g}.",
            "",
            "## Planned quality and recruitment sensitivities",
            "",
            "| Population | N | Claim 1 OR | Claim 2 OR | Claim 3 shutdown OR | "
            "Claim 4 empathy OR | Claim 4 causal OR | Claim 4 persistent OR |",
            "|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for name, values in results["headline_sensitivities"].items():
        c3 = values["claim3_interactions"]
        c4_scenario = values["claim4_scenario"]
        lines.append(
            f"| {name.replace('_', ' ')} | {values['n']} | "
            f"{values['claim1_interaction']['or']:.3f} | "
            f"{values['claim2_interaction']['or']:.3f} | "
            f"{c3['shutdown']['or']:.3f} | "
            f"{c4_scenario['empathy']['or']:.3f} | "
            f"{c4_scenario['causal']['or']:.3f} | "
            f"{c4_scenario['persistent']['or']:.3f} |"
        )

    multiplicity = results["headline_multiplicity"]
    lines.extend(
        [
            "",
            "## Headline multiplicity",
            "",
            "| Family | Raw p | Benjamini-Hochberg q |",
            "|---|---:|---:|",
        ]
    )
    for name, p_value in multiplicity["raw_p"].items():
        lines.append(
            f"| {name} | {p_value:.4g} | {multiplicity['bh_q'][name]:.4g} |"
        )

    carryover = results["carryover"]
    lines.extend(
        [
            "",
            "## Carryover and order checks",
            "",
            "Predecessor models exclude cases where the target scenario appeared first, "
            "use neutral-helpful as the predecessor reference, and adjust for target "
            "position, expertise, usage, and recruitment source.",
            "",
        ]
    )
    for key, label in [
        ("causal_s2_predecessor", "Internal/causal S2 predecessor"),
        ("causal_s4_predecessor", "Internal/causal S4 predecessor"),
        ("persistent_s4_predecessor", "Persistent-agent S4 predecessor"),
        ("persistent_s5_predecessor", "Persistent-agent S5 predecessor"),
    ]:
        omnibus = carryover[key]["omnibus"]
        q_value = carryover["fdr_family"]["bh_q"][key]
        lines.append(
            f"- {label}: chi-square={omnibus['chi2']:.2f}, df={omnibus['df']}, "
            f"p={omnibus['p']:.4g}, q={q_value:.4g}"
        )
    adjacent = carryover["adjacent_causal_persistent_s4"]
    lines.append(
        f"- Adjacent causal/persistent order interaction, N={adjacent['respondent_n']}: "
        f"{fmt_est(adjacent['interaction'])}; "
        f"q={carryover['fdr_family']['bh_q']['adjacent_causal_persistent_s4']:.4g}"
    )
    persistent_first = carryover["persistent_first"]
    first_quadrant = persistent_first["low_s4_high_s5"]
    lines.extend(
        [
            f"- Persistent agent shown first, N={persistent_first['n']}: "
            f"{100 * persistent_first['s5_rating_5_7']:.1f}% rated S5 at 5-7; "
            f"among S4<=2, {first_quadrant['k']}/{first_quadrant['n']} "
            f"({100 * first_quadrant['proportion']:.1f}%) rated S5 at 5-7.",
            "",
        ]
    )
    lines.extend(
        [
            "## Technical and conceptual knowledge sensitivity",
            "",
            "The frozen models use the four-item technical and conceptual knowledge score.",
            "Focal estimates were effectively unchanged without the score or with a factual",
            "score limited to next-token generation and alignment training.",
            "",
        ]
    )
    for label, key in [("No score", "without_score"), ("Factual T1/T3 score", "factual_score")]:
        claim3_result = knowledge[key]["claim3"]
        claim4_result = knowledge[key]["claim4"]["conditional_s5"]
        lines.extend(
            [
                f"### {label}",
                "",
                f"- Claim 3 causal: {fmt_est(claim3_result['causal'])}",
                f"- Claim 3 continuity: {fmt_est(claim3_result['continuity'])}",
                f"- Claim 3 shutdown: {fmt_est(claim3_result['shutdown'])}",
                f"- Claim 4 empathy: {fmt_est(claim4_result['empathy'])}",
                f"- Claim 4 causal: {fmt_est(claim4_result['causal'])}",
                f"- Claim 4 persistent: {fmt_est(claim4_result['persistent'])}",
                "",
            ]
        )
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    csv_path = Path(args.csv)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    full = pd.read_csv(csv_path)
    validate(full)
    full = normalize_boolean_columns(full)
    full = add_factual_knowledge_score(full)
    exploratory = full.loc[~full["low_english_comfort_flag"]].copy()

    main_results = {
        "claim1": claim1(exploratory),
        "claim2": claim2(exploratory),
        "claim3": claim3(exploratory),
        "claim4": claim4(exploratory),
    }
    sensitivities = headline_sensitivities(full, exploratory, main_results)
    headline_p = {
        "claim1": main_results["claim1"]["interaction"]["p"],
        "claim2": main_results["claim2"]["interaction"]["p"],
        "claim3": main_results["claim3"]["joint_interactions"]["p"],
        "claim4": main_results["claim4"]["joint_scenario"]["p"],
    }

    results: dict[str, Any] = {
        "sample": {
            "n_completed": int(len(full)),
            "n_exploratory": int(len(exploratory)),
            "completion_quality": completion_summary(full),
        },
        "h1_gee_full": h1_gee(full),
        "h1_gee_exploratory": h1_gee(exploratory),
        "h1_expertise_diagnostics": h1_expertise_diagnostics(full, exploratory),
        **main_results,
        "headline_sensitivities": sensitivities,
        "headline_multiplicity": {
            "raw_p": headline_p,
            "bh_q": benjamini_hochberg(headline_p),
        },
        "carryover": carryover_analyses(exploratory),
        "evidence_map_rating_5_7_percent": {
            scenario: {
                item: float(value)
                for (item, _), value in zip(ITEMS, row)
            }
            for (scenario, _), row in zip(SCENARIOS, evidence_map(exploratory))
        },
        "technical_conceptual_knowledge_sensitivity": {
            "without_score": {
                "claim3": claim3(exploratory, knowledge_column=None),
                "claim4": claim4(exploratory, knowledge_column=None),
            },
            "factual_score": {
                "claim3": claim3(exploratory, knowledge_column=FACTUAL_KNOWLEDGE_SCORE),
                "claim4": claim4(exploratory, knowledge_column=FACTUAL_KNOWLEDGE_SCORE),
            },
        },
    }

    (outdir / "results.json").write_text(
        json.dumps(results, indent=2, sort_keys=True), encoding="utf-8"
    )
    write_markdown(results, outdir / "results.md")
    save_figures(exploratory, results, outdir)

    print(f"Wrote analysis outputs to {outdir}")
    print(f"H1 GEE full: {fmt_est(results['h1_gee_full'])}")
    print(f"Claim 1 interaction: {fmt_est(results['claim1']['interaction'])}")
    print(f"Claim 2 interaction: {fmt_est(results['claim2']['interaction'])}")
    print(f"Claim 3 shutdown interaction: {fmt_est(results['claim3']['shutdown'])}")


if __name__ == "__main__":
    main()
