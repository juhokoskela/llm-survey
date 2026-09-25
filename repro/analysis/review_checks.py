#!/usr/bin/env python3
"""Second-review diagnostics; only aggregate results are eligible for publication."""
import argparse
from collections import Counter
import hashlib
import os
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import linprog
from scipy.stats import chi2_contingency, fisher_exact, spearmanr

import analysis as a


def interpretation_categories(values):
    return values.map(lambda value: "Other" if str(value).startswith("Other:") else value)


def country_summary(values):
    normalized = values.fillna("").str.strip().str.casefold()
    # Never publish optional location text, even when a string occurs repeatedly.
    allowed = {"finland", "united states", "germany", "united kingdom"}
    categories = normalized.map(lambda value: value if value in allowed else
                                "Missing" if value == "" else "Other provided location")
    return categories.value_counts().to_dict()


def separation_diagnostic(design, outcome):
    signed = (2 * np.asarray(outcome) - 1)[:, None] * np.asarray(design)
    # A nonzero feasible summed margin detects complete or quasi separation.
    result = linprog(-signed.sum(axis=0), A_ub=-signed, b_ub=np.zeros(len(signed)),
                     bounds=[(-1, 1)] * signed.shape[1], method="highs")
    if not result.success:
        raise RuntimeError(f"Separation diagnostic failed: {result.message}")
    return {"maximum_summed_margin": float(-result.fun),
            "separation_detected": bool(-result.fun > 1e-7), "solver": result.message}


def run(full, exp, navigation, fit, binary_fit, evidence_frame):
    def distribution(frame, column):
        return frame[column].fillna("Missing").value_counts().sort_index().to_dict()

    def model(formula, data, terms, label):
        result = fit(formula, data, label)
        return {"n": int(data.session_id.nunique()),
                "terms": {term: a.term_result(result, term) for term in terms},
                "diagnostic": result.audit_diagnostic}

    out = {"status": "Second-review post-hoc diagnostics", "full_n": len(full),
           "exploratory_n": len(exp)}
    s2 = "internal_causal_affect_S2_functional_affect_like_process"
    out["comprehension_s2"] = {}
    out["interpretation_by_tier"] = {}
    for population, frame in [("full", full), ("exploratory", exp)]:
        table = pd.crosstab(frame.comprehension_check_passed, frame[s2].ge(5))
        out["comprehension_s2"][population] = {
            "groups": {str(k): {"n": len(g), "agree": int(g[s2].ge(5).sum()),
                                  "ratings": distribution(g, s2)}
                       for k, g in frame.groupby("comprehension_check_passed")},
            "fisher_p": fisher_exact(table).pvalue,
            "answers": {k: {"n": len(g), "agree": int(g[s2].ge(5).sum())}
                        for k, g in frame.groupby("CC1_internal_causal_comprehension")}}
        category = interpretation_categories(frame.I1_inner_experience_interpretation)
        table = pd.crosstab(frame.technical_expertise_tier, category)
        test = chi2_contingency(table)
        row = frame.technical_expertise_tier.to_numpy()
        col = pd.Categorical(category).codes
        rng = np.random.default_rng(20260920)
        more = 0
        for _ in range(20000):
            shuffled = np.bincount(row * len(table.columns) + rng.permutation(col),
                                   minlength=table.size).reshape(table.shape)
            statistic = np.sum((shuffled - test.expected_freq) ** 2 / test.expected_freq)
            more += statistic >= test.statistic - 1e-12
        out["interpretation_by_tier"][population] = {
            "table": table.to_dict("index"), "chi2": test.statistic, "df": test.dof,
            "minimum_expected": test.expected_freq.min(),
            "permutation_p": (more + 1) / 20001, "permutations": 20000, "seed": 20260920}

    long = a.s4_long(full)
    by_id = full.set_index("session_id")
    long["interpretation"] = interpretation_categories(
        long.session_id.map(by_id.I1_inner_experience_interpretation))
    base = "rating ~ tier + C(scenario) + position + usage + C(recruitment)"
    out["h1"] = {
        "usage": model(base, long, ["tier", "usage"], "review_h1_usage"),
        "interpretation_adjusted": model(base + " + C(interpretation)", long,
                                          ["tier", "usage"], "review_h1_i1"),
        "without_neutral_empathy": model(base, long.loc[~long.scenario.isin(
            ["neutral_helpful", "empathic_response"])], ["tier", "usage"], "review_h1_floors")}
    tech = full.B2_field_domain.eq(
        "Product, design, management, or strategy role involving technology but not primarily software/AI")
    field_only = tech & ~full.B7_builder_experience.eq("Yes, casually or experimentally")
    out["tech_adjacent"] = {"n": int(tech.sum()),
        "tiers": full.loc[tech, "technical_expertise_tier"].value_counts().to_dict(),
        "builders": full.loc[tech, "B7_builder_experience"].value_counts().to_dict()}
    for name, excluded in [("all_tech_adjacent", tech), ("field_only", field_only)]:
        frame = a.s4_long(full.loc[~excluded])
        out["tech_adjacent"][name] = {"excluded_n": int(excluded.sum()),
            "slope": model(base, frame, ["tier"], "review_tier_" + name),
            "categorical": model(base.replace("tier +", "C(tier) +"), frame,
                [f"C(tier)[T.{t}.0]" for t in [1, 2, 3]], "review_categorical_" + name)}

    out["usage_mind"] = {}
    for item, _ in a.ITEMS:
        frame = a.stacked_items(full, [s for s, _ in a.SCENARIOS], [(item, item)])
        frame["mind"] = frame.session_id.map(by_id.mind_theory_background).astype(int)
        out["usage_mind"][item] = model(base + " + mind", frame,
            ["usage", "mind", "tier"], "review_usage_mind_" + item)
    out["mind_n"] = int(full.mind_theory_background.sum())
    out["usage_mind_bh12"] = a.benjamini_hochberg({
        item + "_" + term: value["terms"][term]["p"]
        for item, value in out["usage_mind"].items() for term in ["usage", "mind"]})

    columns = [c for c in exp if c.startswith(("F2_", "F3_", "F5_", "G", "B8_", "B10_"))]
    out["closed_descriptives_n530"] = {c: distribution(exp, c) for c in columns}
    out["full_descriptives_n538"] = {c: distribution(full, c) for c in
        ["D3_education_level", "D5_english_comfort", "B5_llm_hours", "usage_intensity"]}
    out["country_n538"] = country_summary(full.D2_country_region)
    for column in ["F1_most_increasing_evidence", "F6_allowed_responses_to_abuse"]:
        out[column] = dict(Counter(value if not value.startswith("Other:") else "Other"
            for response in exp[column].fillna("") for value in response.split("|") if value))
    out["convergence"] = {}
    s4 = exp[[f"{s}_S4_inner_experience" for s, _ in a.SCENARIOS]]
    for item in ["G1_current_llms_experience_emotions", "G2_current_llms_conscious"]:
        out["convergence"][item] = {
            "respondent_mean": dict(zip(["rho", "p"], spearmanr(s4.mean(axis=1), exp[item]))),
            "scenarios": {s: dict(zip(["rho", "p"], spearmanr(
                exp[f"{s}_S4_inner_experience"], exp[item]))) for s, _ in a.SCENARIOS}}

    out["s4_categories"] = {}
    out["welfare"] = {}
    out["shutdown_s4"] = {}
    selected = exp.F1_most_increasing_evidence.map(lambda v: a.has_option(v, a.F1_SHUTDOWN))
    for scenario, _ in a.SCENARIOS:
        s3 = exp[f"{scenario}_S3_actual_feeling"]
        s4 = exp[f"{scenario}_S4_inner_experience"]
        welfare = exp[f"{scenario}_S5_welfare_directed_precaution"].ge(5)
        out["s4_categories"][scenario] = {"1-2": int(s4.le(2).sum()), "3": int(s4.eq(3).sum()),
            "4": int(s4.eq(4).sum()), "5-7": int(s4.ge(5).sum()), "1": int(s4.eq(1).sum())}
        masks = {"s4_le2": s4.le(2), "both_le2": s4.le(2) & s3.le(2),
                 "both_1": s4.eq(1) & s3.eq(1), "low_s4_high_s3": s4.le(2) & s3.ge(3)}
        out["welfare"][scenario] = {name: {"n": int(mask.sum()),
            "agree": int((mask & welfare).sum()),
            "wilson": a.wilson(int((mask & welfare).sum()), int(mask.sum())) if mask.any() else None}
            for name, mask in masks.items()}
        out["shutdown_s4"][scenario] = {str(k): {"n": len(g),
            "agree": int(g[f"{scenario}_S4_inner_experience"].ge(5).sum()),
            "mean": g[f"{scenario}_S4_inner_experience"].mean()} for k, g in exp.groupby(selected)}
    late = full.session_id.map(navigation.set_index("session_id").scenario_saved_after_term)
    if late.isna().any():
        raise ValueError("Navigation membership missing for completed respondents")
    out["navigation_overlap"] = {"late": int(late.sum()),
        "low_english": int(full.low_english_comfort_flag.sum()),
        "overlap": int((late & full.low_english_comfort_flag).sum()),
        "retained": int((~late & ~full.low_english_comfort_flag).sum())}
    blocks = pd.DataFrame({s: full[[f"{s}_{i}" for i, _ in a.ITEMS]].nunique(axis=1).eq(1)
                           for s, _ in a.SCENARIOS})
    out["within_block_uniform"] = {"scenarios": blocks.sum().to_dict(),
        "any": int(blocks.any(axis=1).sum()), "all_five": int(blocks.all(axis=1).sum()),
        "values": {s: full.loc[blocks[s], f"{s}_S1_emotion_related_behavior"].value_counts().to_dict()
                   for s, _ in a.SCENARIOS}}

    frame = evidence_frame("S5_welfare_directed_precaution")
    frame["above"] = frame.rating.ge(6).astype(int)
    core = "persistent * (sel_causal + sel_continuity + sel_shutdown)"
    adjust = "position + tier + usage + knowledge + familiarity + mind + C(recruitment)"
    stacked = pd.concat([frame.assign(cut=str(c), above=frame.rating.ge(c).astype(int))
                         for c in [3, 4, 5, 6]], ignore_index=True)
    stacked["cut"] = pd.Categorical(stacked.cut, categories=["3", "4", "5", "6"])
    result = binary_fit("above ~ C(cut) * (" + core + ") + " + adjust, stacked,
                        "review_welfare_stacked_separation")
    out["welfare_separation"] = {
        "stacked": separation_diagnostic(result.model.exog, stacked.above),
        "diagnostic": result.audit_diagnostic,
        "continuity_cut6": a.linear_combination_result(result,
            {"persistent:sel_continuity": 1, "C(cut)[T.6]:persistent:sel_continuity": 1}),
        "cells": frame.groupby(["sel_continuity", "persistent"]).above.agg(["sum", "count"])
            .reset_index().to_dict("records")}
    for name, formula in [("cut6_adjusted", "above ~ " + core + " + " + adjust),
                           ("cut6_unadjusted", "above ~ persistent * sel_continuity")]:
        result = binary_fit(formula, frame, "review_welfare_" + name)
        out["welfare_separation"][name] = a.term_result(result, "persistent:sel_continuity")
    cells = frame.groupby(["sel_continuity", "persistent"]).above.agg(["sum", "count"])
    odds = {k: (v["sum"] + .5) / (v["count"] - v["sum"] + .5) for k, v in cells.iterrows()}
    out["welfare_separation"]["half_cell_corrected_descriptive_ratio"] = (
        odds[(1, 1)] / odds[(1, 0)]) / (odds[(0, 1)] / odds[(0, 0)])
    return out


def main():
    import adversarial as audit
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-dir", type=Path, required=True,
                        help="Existing private adversarial.py output directory")
    parser.add_argument("--outdir", type=Path, required=True, help="New private output directory")
    args = parser.parse_args()
    source = args.audit_dir.expanduser().resolve(strict=True)
    target = args.outdir.expanduser().resolve()
    if source.is_relative_to(audit.REPOSITORY) or target.is_relative_to(audit.REPOSITORY):
        parser.error("Input and output directories must be outside the repository")
    if target.exists():
        parser.error("Output directory must be new")
    os.umask(0o077)
    target.mkdir(parents=True, mode=0o700)
    audit.OUTDIR = target
    audit.full = a.add_factual_knowledge_score(a.normalize_boolean_columns(
        pd.read_csv(source / "completed.csv")))
    a.validate(audit.full)
    audit.exp = audit.full.loc[~audit.full.low_english_comfort_flag].copy()
    navigation = pd.read_csv(source / "PRIVATE-navigation-membership.csv")
    audit.save("review-checks.json", run(audit.full, audit.exp, navigation,
        audit.fit, audit.binary_fit, audit.evidence_frame))
    paths = [source / "completed.csv", source / "PRIVATE-navigation-membership.csv",
             Path(__file__), Path(a.__file__), Path(audit.__file__),
             Path(__file__).with_name("ordinal_models.py")]
    audit.save("source-sha256.json", {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})
    print("SECOND-REVIEW CHECKS COMPLETE")


if __name__ == "__main__":
    main()
