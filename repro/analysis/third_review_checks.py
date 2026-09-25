#!/usr/bin/env python3
"""Third-review diagnostics against a private audit; aggregate outputs only."""
import argparse
from collections import Counter
import hashlib
import os
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from scipy.optimize import brentq
from scipy.special import expit, roots_hermitenorm
import pandas as pd
from patsy import dmatrices

import analysis as a
from ordinal_models import InvalidFitError
from review_checks import separation_diagnostic


def welfare_complements(exp):
    out = {}
    sets = {}
    out["welfare_complements"] = {}
    for s, _ in a.SCENARIOS[1:]:
        s3 = exp[f"{s}_S3_actual_feeling"]
        s4 = exp[f"{s}_S4_inner_experience"]
        s5 = exp[f"{s}_S5_welfare_directed_precaution"]
        mask = s3.eq(1) & s4.eq(1) & s5.ge(5)
        sets[s] = set(exp.loc[mask, "session_id"])
        out["welfare_complements"][s] = {
            "welfare_agree_n": int(s5.ge(5).sum()),
            "low_s4_and_welfare_n": int((s4.le(2) & s5.ge(5)).sum()),
            "s4_agree_n": int(s4.ge(5).sum()),
            "high_s4_low_welfare_n": int((s4.ge(5) & s5.le(2)).sum()),
            "strict_stratum_n": int((s3.eq(1) & s4.eq(1)).sum()),
            "strict_endorse_n": int(mask.sum()),
        }
    out["strict_welfare_unique"] = {
        "unique_n": len(set.union(*sets.values())),
        "number_scenarios_per_unique_endorser": dict(
            Counter(
                sum(i in ids for ids in sets.values())
                for i in set.union(*sets.values())
            )
        ),
        "pairwise_overlap": {
            x + "__" + y: len(sets[x] & sets[y]) for x in sets for y in sets if x < y
        },
    }
    return out


def planned_thresholds(f, binary_fit):
    f = a.stacked_items(
        f,
        ["emotional_self_report", "internal_causal_affect"],
        [("S2_functional_affect_like_process", "S2"), ("S4_inner_experience", "S4")],
    )
    f["causal"] = f.scenario.eq("internal_causal_affect").astype(int)
    f["inner"] = f.item.eq("S4").astype(int)
    core = "causal*inner*tier"
    adj = "position + usage + C(recruitment)"
    out = {}
    for cut in range(2, 7):
        g = f.assign(above=f.rating.ge(cut).astype(int))
        formula = "above ~ " + core + " + " + adj
        y, x = dmatrices(formula, g, return_type="dataframe")
        sep = separation_diagnostic(x, y.iloc[:, 0])
        out[str(cut)] = {"separation": sep}
        if sep["separation_detected"]:
            continue
        try:
            r = binary_fit(formula, g, "H3_H5_cut" + str(cut))
        except InvalidFitError as e:
            out[str(cut)]["invalid"] = e.diagnostic
            continue
        out[str(cut)]["H3_D"] = a.linear_combination_result(
            r, {"inner:tier": 1, "causal:inner:tier": 1}
        )
        out[str(cut)]["H5_D_vs_B_S2"] = a.term_result(r, "causal:tier")
        out[str(cut)]["threeway"] = a.term_result(r, "causal:inner:tier")
        out[str(cut)]["diagnostic"] = r.audit_diagnostic
    return out


def run(full, exp, fit, binary_fit):
    out = {"n_full": len(full), "n_exploratory": len(exp)}

    def model(label, formula, data, binary=False):
        return (binary_fit if binary else fit)(formula, data, label)

    def result(fitted, terms):
        return {
            "terms": {term: a.term_result(fitted, term) for term in terms},
            "n": fitted.audit_diagnostic["clusters"],
            "diagnostic": fitted.audit_diagnostic,
        }

    base = "rating ~ tier + C(scenario) + position + usage + C(recruitment)"
    long = a.s4_long(full)
    ids = full.set_index("session_id")
    long["age"] = long.session_id.map(ids.D1_age_range)
    long["education"] = long.session_id.map(ids.D3_education_level)
    long["education_pooled"] = long.education.replace(
        {"Other": "Other or undisclosed", "Prefer not to say": "Other or undisclosed"}
    )
    out["demographics"] = {}
    for label, extra in [
        ("age", "C(age)"),
        ("education", "C(education)"),
        ("both", "C(age)+C(education)"),
        ("both_pooled", "C(age)+C(education_pooled)"),
    ]:
        r = model("H1_" + label, base + " + " + extra, long)
        out["demographics"][label] = result(r, ["tier", "usage"])
    out["demographics"]["age_by_tier"] = pd.crosstab(
        full.technical_expertise_tier, full.D1_age_range
    ).to_dict("index")
    out["demographics"]["education_by_tier"] = pd.crosstab(
        full.technical_expertise_tier, full.D3_education_level
    ).to_dict("index")

    # H3 across all five scenarios: item-specific scenario levels, common item-by-tier slopes.
    f = a.stacked_items(
        exp,
        [s for s, _ in a.SCENARIOS],
        [("S2_functional_affect_like_process", "S2"), ("S4_inner_experience", "S4")],
    )
    f["inner"] = f.item.eq("S4").astype(int)
    r = model(
        "H3_all",
        "rating ~ inner*C(scenario) + inner*tier + position + usage + C(recruitment)",
        f,
    )
    out["H3_all"] = result(r, ["inner:tier", "tier"])
    out["H3_all"]["s4_tier"] = a.linear_combination_result(
        r, {"tier": 1, "inner:tier": 1}
    )
    f = f.loc[
        f.scenario.isin(["emotional_self_report", "internal_causal_affect"])
    ].copy()
    f["causal"] = f.scenario.eq("internal_causal_affect").astype(int)
    r = model(
        "H3_H5_B_D", "rating ~ causal*inner*tier + position + usage + C(recruitment)", f
    )
    out["H3_H5_B_D"] = result(r, ["inner:tier", "causal:tier", "causal:inner:tier"])
    out["H3_H5_B_D"]["H3_D"] = a.linear_combination_result(
        r, {"inner:tier": 1, "causal:inner:tier": 1}
    )
    for causal in [0, 1]:
        for inner in [0, 1]:
            weights = {"tier": 1}
            if causal:
                weights["causal:tier"] = 1
            if inner:
                weights["inner:tier"] = 1
            if causal and inner:
                weights["causal:inner:tier"] = 1
            out["H3_H5_B_D"][f"tier_slope_causal{causal}_inner{inner}"] = (
                a.linear_combination_result(r, weights)
            )
    f = a.stacked_items(
        exp, [s for s, _ in a.SCENARIOS], [("S2_functional_affect_like_process", "S2")]
    )
    r = model(
        "H5_S2_all",
        "rating ~ tier*C(scenario, Treatment(reference='emotional_self_report')) + position + usage + C(recruitment)",
        f,
    )
    terms = [t for t in r.params.index if t.startswith("tier:")]
    out["H5_S2_all"] = result(r, terms)
    out["H5_S2_all"]["joint"] = a.wald_test_terms(r, terms)
    out["H3_H5_local_bh"] = a.benjamini_hochberg(
        {
            "H3_all": out["H3_all"]["terms"]["inner:tier"]["p"],
            "H3_D": out["H3_H5_B_D"]["H3_D"]["p"],
            "H5_D_vs_B": out["H3_H5_B_D"]["terms"]["causal:tier"]["p"],
        }
    )
    out["S2_S4_D_by_tier"] = {
        str(t): {
            i: {
                "n": len(g),
                "agree": int(g["internal_causal_affect_" + i].ge(5).sum()),
                "mean": g["internal_causal_affect_" + i].mean(),
            }
            for i in ["S2_functional_affect_like_process", "S4_inner_experience"]
        }
        for t, g in exp.groupby("technical_expertise_tier")
    }

    # Replicate the actual mind-background construction without exporting free text.
    field = full.B2_field_domain.eq(
        "Philosophy / cognitive science / psychology / neuroscience / ethics"
    )
    text = full.B3_role_detail.fillna("").str.lower()
    written = text.str.strip().ne("")
    keywords = [
        "philosophy",
        "cognitive science",
        "cogsci",
        "psychology",
        "neuroscience",
        "ethics",
        "consciousness",
        "philosophy of mind",
        "moral philosophy",
    ]
    matches = {k: text.str.contains(k, regex=False) for k in keywords}
    textmatch = pd.DataFrame(matches).any(axis=1)
    assert (field | textmatch).equals(full.mind_theory_background)
    out["mind_construction"] = {
        "field_n": int(field.sum()),
        "substring_n": int(textmatch.sum()),
        "both_n": int((field & textmatch).sum()),
        "text_only_n": int((~field & textmatch).sum()),
        "field_only_n": int((field & ~textmatch).sum()),
        "written_B3_n": int(written.sum()),
        "not_written_B3_n": int((~written).sum()),
        "keyword_n": {k: int(v.sum()) for k, v in matches.items()},
        "tier_counts": pd.crosstab(
            full.technical_expertise_tier, full.mind_theory_background
        ).to_dict("index"),
        "field_tier_counts": full.loc[field, "technical_expertise_tier"]
        .value_counts()
        .to_dict(),
        "written_by_tier": pd.crosstab(full.technical_expertise_tier, written).to_dict(
            "index"
        ),
    }
    for name, mask in [
        (
            "exclude_tier0_mind",
            ~(full.technical_expertise_tier.eq(0) & full.mind_theory_background),
        ),
        ("exclude_all_mind", ~full.mind_theory_background),
    ]:
        r = model(name, base, a.s4_long(full.loc[mask]))
        out[name] = result(r, ["tier"])
    lf = a.s4_long(full)
    lf["mind_field"] = lf.session_id.map(
        pd.Series(field.to_numpy(), index=full.session_id)
    ).astype(int)
    r = model("mind_field_only", base + " + mind_field", lf)
    out["mind_field_only"] = result(r, ["tier", "mind_field"])

    # Observed response patterns are not estimates of a latent-class mixture.
    s4cols = [f"{s}_S4_inner_experience" for s, _ in a.SCENARIOS]
    all_low = full[s4cols].le(2).all(axis=1)
    all_one = full[s4cols].eq(1).all(axis=1)
    out["low_component"] = {
        "full_n": int(all_low.sum()),
        "exploratory_n": int(exp[s4cols].le(2).all(axis=1).sum()),
        "all_one_full_n": int(all_one.sum()),
        "by_tier": pd.crosstab(full.technical_expertise_tier, all_low).to_dict("index"),
    }
    rframe = pd.DataFrame(
        {
            "session_id": full.session_id,
            "always_low": all_low.astype(int),
            "tier": full.technical_expertise_tier,
            "usage": full.usage_intensity,
            "recruitment": full[a.RECRUITMENT],
        }
    )
    r = model(
        "always_low", "always_low ~ tier + usage + C(recruitment)", rframe, binary=True
    )
    out["low_component"]["adjusted_tier"] = a.term_result(r, "tier")
    r = model("H1_exclude_always_low", base, a.s4_long(full.loc[~all_low]))
    out["low_component"]["remaining_h1"] = result(r, ["tier"])
    means = exp[s4cols].mean(axis=1)
    counts = means.value_counts().sort_index()
    out["s4_mean_distribution"] = {str(round(k, 1)): int(v) for k, v in counts.items()}

    # Unique endorsers across the strictest scenario-specific strata; never output IDs.
    out.update(welfare_complements(exp))
    # Self-report priorities: absolute B rates and differential B vs D/E associations.
    selfopt = "The system says it has feelings."
    select = exp.F1_most_increasing_evidence.map(
        lambda v: a.has_option(v, selfopt)
    ).astype(int)
    least = exp.F2_least_convincing_evidence.eq(selfopt)
    out["self_report_priorities"] = {
        "F1_n": int(select.sum()),
        "F2_n": int(least.sum()),
        "both_n": int((select.astype(bool) & least).sum()),
        "groups": {},
    }
    for label, selection in [("F1_selected", select), ("F2_least", least.astype(int))]:
        out["self_report_priorities"]["groups"][label] = {}
        for k, g in exp.groupby(selection):
            out["self_report_priorities"]["groups"][label][str(k)] = {
                s: {
                    i: {
                        "n": len(g),
                        "agree": int(g[f"{s}_{i}"].ge(5).sum()),
                        "mean": g[f"{s}_{i}"].mean(),
                    }
                    for i in [
                        "S3_actual_feeling",
                        "S4_inner_experience",
                        "S5_welfare_directed_precaution",
                    ]
                }
                for s, _ in a.SCENARIOS[1:]
            }
    for comparator in ["internal_causal_affect", "persistent_agent"]:
        f = a.s4_long(exp)
        f = f.loc[f.scenario.isin(["emotional_self_report", comparator])].copy()
        f["self_report"] = f.scenario.eq("emotional_self_report").astype(int)
        f["selected"] = f.session_id.map(
            pd.Series(select.to_numpy(), index=exp.session_id)
        )
        r = model(
            "selfreport_F1_" + comparator,
            "rating ~ self_report*selected + tier + position + usage + C(recruitment)",
            f,
        )
        out["self_report_priorities"][comparator] = result(
            r, ["selected", "self_report:selected"]
        )
    out["comprehension_by_tier"] = pd.crosstab(
        full.technical_expertise_tier, full.comprehension_check_passed
    ).to_dict("index")
    out["failer_claim1"] = {
        "n": int((~exp.comprehension_check_passed).sum()),
        "estimate": a.claim1(exp.loc[~exp.comprehension_check_passed])["interaction"],
    }
    # The author identified the first 20, then first 50 completions as the pilot.
    sorted_full = full.sort_values("completed_at")
    out["pilot_quality"] = {
        str(n): {
            "comprehension_fail_n": int(
                (~sorted_full.iloc[:n].comprehension_check_passed).sum()
            ),
            "median_seconds": float(
                sorted_full.iloc[:n].completion_time_seconds.median()
            ),
        }
        for n in [20, 50]
    }

    out["status"] = (
        "Third-review exploratory diagnostics; specifications chosen after inspection"
    )
    out["H3_H5_thresholds"] = planned_thresholds(exp, binary_fit)
    out["chronological_h1"] = {
        str(n): {"n": len(full) - n, "estimate": a.h1_gee(sorted_full.iloc[n:].copy())}
        for n in [20, 50]
    }
    out["sample_audit"] = {
        "age_n538": full.D1_age_range.value_counts().to_dict(),
        "recruitment_n538": full[a.RECRUITMENT].value_counts().to_dict(),
        "completion_date_range": [
            str(sorted_full.completed_at.iloc[0])[:10],
            str(sorted_full.completed_at.iloc[-1])[:10],
        ],
        "I2_intended_n530": int(
            exp.I2_functional_process_interpretation.eq(
                a.INTENDED_FUNCTIONAL_PROCESS
            ).sum()
        ),
        "F7_F8_nonblank_n538": {
            column: int(full[column].fillna("").str.strip().ne("").sum())
            for column in ["F7_strong_evidence_free_text", "F8_doubt_reason_free_text"]
        },
        "qualitative_usable_status": "Earlier usable counts lack a retained eligibility matrix; not reproduced or used as denominators",
    }
    out["attenuation"] = attenuation_check()
    return out


def attenuation_check():
    # Reuse the published accepted conditional fit, not a new mixed-model estimate.
    path = Path(__file__).resolve().parents[1] / "results/clmm-diagnostics.csv"
    row = pd.read_csv(path).set_index("name").loc["full_aghq7"]
    if row["status"] != "ACCEPTED":
        raise ValueError("Attenuation requires an accepted frozen conditional fit")
    beta, sigma = float(row["beta"]), float(row["random_intercept_sd"])
    c = 16 * np.sqrt(3) / (15 * np.pi)
    out = {
        "source": "results/clmm-diagnostics.csv:full_aghq7",
        "source_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "beta": beta,
        "random_intercept_sd": sigma,
        "approx_OR": np.exp(beta / np.sqrt(1 + c * c * sigma * sigma)),
        "integrated": {},
    }
    x, w = roots_hermitenorm(200)

    def marginal(eta):
        return np.sum(w * expit(eta + sigma * x)) / np.sqrt(2 * np.pi)

    for probability in [0.1, 0.5, 0.9]:
        eta = brentq(lambda value: marginal(value) - probability, -30, 30)
        shifted = marginal(eta + beta)
        out["integrated"][str(probability)] = {
            "p_tier_plus1": shifted,
            "or": (shifted / (1 - shifted)) / (probability / (1 - probability)),
        }
    return out


def save_profile_figure(results, path):
    counts = results["s4_mean_distribution"]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.bar([float(value) for value in counts], list(counts.values()), width=0.16)
    ax.set_xlabel("Respondent mean S4 across five scenarios (descriptive score)")
    ax.set_ylabel("Respondents")
    ax.set_title(f"Observed S4 profiles, N={results['n_exploratory']}")
    ax.set_xlim(0.8, 6.2)
    fig.tight_layout()
    fig.savefig(path, dpi=180)
    plt.close(fig)


def main():
    import adversarial as audit

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-dir", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    args = parser.parse_args()
    source = args.audit_dir.expanduser().resolve(strict=True)
    target = args.outdir.expanduser().resolve()
    if source.is_relative_to(audit.REPOSITORY) or target.is_relative_to(
        audit.REPOSITORY
    ):
        parser.error("Input and output directories must be outside the repository")
    if target.exists():
        parser.error("Output directory must be new")
    os.umask(0o077)
    target.mkdir(parents=True, mode=0o700)
    audit.OUTDIR = target
    full = a.add_factual_knowledge_score(
        a.normalize_boolean_columns(pd.read_csv(source / "completed.csv"))
    )
    a.validate(full)
    exp = full.loc[~full.low_english_comfort_flag].copy()
    a.fit_ordinal_gee = audit.fit
    a.fit_binary_gee = audit.binary_fit
    results = run(full, exp, audit.fit, audit.binary_fit)
    audit.save("third-review-checks.json", results)
    save_profile_figure(results, target / "supplement_s4_profiles.png")
    paths = [
        source / "completed.csv",
        Path(__file__),
        Path(a.__file__),
        Path(audit.__file__),
        Path(__file__).with_name("ordinal_models.py"),
        Path(__file__).with_name("review_checks.py"),
    ]
    audit.save(
        "source-sha256.json",
        {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},
    )
    print("THIRD-REVIEW CHECKS COMPLETE")


if __name__ == "__main__":
    main()
