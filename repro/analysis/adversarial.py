#!/usr/bin/env python3
"""Post-review analyses from a private dump; outputs must remain outside the repo.

Run from any directory with --dump and a new --outdir. Node/tsx uses the
repository exporter; Python reproduces aggregate analyses and saves numerical
diagnostics. The generated CSVs and membership files are participant-level.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import platform
import subprocess
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
import patsy
import scipy
import statsmodels
from patsy import build_design_matrices
from scipy.special import expit
from scipy.stats import chi2_contingency, spearmanr

import analysis as a
import review_checks
import third_review_checks
from ordinal_models import InvalidFitError, fit_ordinal_gee as ordinal_fit, fit_binary_gee as binary_model_fit

REPOSITORY = Path(__file__).resolve().parents[2]
LABEL = ""
base_adjust = "position + tier + usage + knowledge + familiarity + mind + C(recruitment)"
evidence_core = "persistent * (sel_causal + sel_continuity + sel_shutdown)"



def clean(value):
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (tuple, list)):
        return [clean(v) for v in value]
    if isinstance(value, np.ndarray):
        return clean(value.tolist())
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return value

def save(name, value):
    path = OUTDIR / name
    path.write_text(json.dumps(clean(value), indent=2, ensure_ascii=False) + "\n")
    path.chmod(0o600)

def predictions(result, frame):
    x = build_design_matrices([result.audit_design_info], frame, return_type="dataframe")[0]
    x = x[result.audit_columns]
    eta = x.to_numpy() @ result.params[result.audit_columns].to_numpy()
    cut_names = [n for n in result.params.index if n.startswith("I(y>")]
    cumulative = np.column_stack([expit(eta + result.params[n]) for n in cut_names])
    categories = np.column_stack([1-cumulative[:, 0], -np.diff(cumulative, axis=1), cumulative[:, -1]])
    return categories

def model_output(result):
    return {
        "diagnostic": result.audit_diagnostic,
        "coefficients": {n: {"beta": float(result.params[n]), "se": float(result.bse[n]),
                             "p": float(result.pvalues[n])} for n in result.params.index},
        "covariance": np.asarray(result.cov_params()).tolist(),
        "coefficient_order": list(result.params.index),
    }



def record_fit(fitter, formula, data, label):
    try:
        result = fitter(formula, data)
    except InvalidFitError as error:
        diagnostic = {"label": label or LABEL, **error.diagnostic}
        with (OUTDIR / "model-diagnostics.jsonl").open("a") as handle:
            handle.write(json.dumps(clean(diagnostic)) + "\n")
        raise
    result.audit_diagnostic["label"] = label or LABEL
    with (OUTDIR / "model-diagnostics.jsonl").open("a") as handle:
        handle.write(json.dumps(clean(result.audit_diagnostic)) + "\n")
    with (OUTDIR / "model-estimates.jsonl").open("a") as handle:
        handle.write(json.dumps(clean({"label": label or LABEL, **model_output(result)})) + "\n")
    return result


def fit(formula, data, label=None):
    return record_fit(ordinal_fit, formula, data, label)


def binary_fit(formula, data, label=None):
    return record_fit(binary_model_fit, formula, data, label)


def section(name, fn):
    global LABEL
    LABEL = name
    print("START", name, flush=True)
    try:
        result = fn()
        save(name + ".json", result)
    except Exception as error:
        save(name + ".error.json", {"type": type(error).__name__, "message": str(error)})
        raise
    print("DONE", name, flush=True)
    return result



def h1_sensitivities():
    global LABEL
    output = {}
    for name, sample in samples.items():
        LABEL = "H1_" + name
        output[name] = {"n": len(sample), "estimate": a.h1_gee(sample)}
    long = a.s4_long(full)
    long["knowledge"] = long.session_id.map(full.set_index("session_id").technical_knowledge_score)
    long["factual"] = long.session_id.map(full.set_index("session_id")[a.FACTUAL_KNOWLEDGE_SCORE])
    formula = "rating ~ tier + C(scenario) + position + usage + C(recruitment)"
    for score in ["knowledge", "factual"]:
        result = fit(formula + " + " + score, long, "H1_" + score)
        output[score] = {"n": len(full), "estimate": a.term_result(result, "tier")}
    for scenario, _ in a.SCENARIOS:
        result = fit("rating ~ tier + position + usage + C(recruitment)",
                     long.loc[long.scenario.eq(scenario)], "H1_scenario_" + scenario)
        output["scenario_" + scenario] = {"n": len(full), "estimate": a.term_result(result, "tier")}
    result = fit(formula, long.loc[~long.scenario.eq("neutral_helpful")], "H1_without_neutral")
    output["without_neutral"] = {"n": len(full), "estimate": a.term_result(result, "tier")}
    interaction = fit("rating ~ tier * C(scenario) + position + usage + C(recruitment)",
                      long, "H1_tier_scenario")
    output["tier_scenario_interaction"] = a.wald_test_terms(
        interaction, [n for n in interaction.params.index if "tier:" in n or ":tier" in n])
    return output

def frozen_exploratory_sensitivities():
    global LABEL
    output = {}
    for name, sample in {"full": full, **a.sensitivity_samples(exp),
                        "comprehension_fail": exp.loc[~exp.comprehension_check_passed]}.items():
        LABEL = "exploratory_" + name
        c1, c2, c3, c4 = a.claim1(sample), a.claim2(sample), a.claim3(sample), a.claim4(sample)
        output[name] = {"n": len(sample), "claim1": c1, "claim2": c2, "claim3": c3, "claim4": c4}
    return output

def categorical_h1():
    long = a.s4_long(full)
    long["tier_cat"] = pd.Categorical(long.tier.astype(int), categories=[0,1,2,3])
    result = fit("rating ~ C(tier_cat) + C(scenario) + position + usage + C(recruitment)",
                 long, "H1_categorical")
    out = {"estimates": {str(t): a.term_result(result, f"C(tier_cat)[T.{t}]") for t in [1,2,3]},
           "predictions": {}, "model": model_output(result)}
    for tier in [0,1,2,3]:
        pred = long.copy()
        pred["tier_cat"] = pd.Categorical([tier]*len(pred), categories=[0,1,2,3])
        probs = predictions(result, pred).mean(axis=0)
        out["predictions"][str(tier)] = {
            "probabilities": probs, "mean": float(probs @ np.arange(1,len(probs)+1)),
            "low": float(probs[:2].sum()), "middle": float(probs[2:4].sum()),
            "agreement": float(probs[4:].sum())}
    return out

def knowledge_sensitivities():
    return {name: {"claim3": a.claim3(exp, knowledge_column=column),
                   "claim4": a.claim4(exp, knowledge_column=column)}
            for name, column in [("none",None), ("factual",a.FACTUAL_KNOWLEDGE_SCORE)]}

def descriptives():
    distributions = []
    pairs = []
    for pop_name, df in [("full", full), ("exploratory", exp)]:
        for scenario, _ in a.SCENARIOS:
            for item, _ in a.ITEMS:
                counts = df[f"{scenario}_{item}"].value_counts()
                for rating in range(1,8):
                    distributions.append({"population":pop_name,"scenario":scenario,
                        "item":item,"rating":rating,"n":int(counts.get(rating,0)),
                        "denominator":len(df)})
    pd.DataFrame(distributions).to_csv(OUTDIR/"rating-distributions.csv",index=False)
    def pair_table(s1,i1,s2,i2):
        tab = pd.crosstab(exp[f"{s1}_{i1}"],exp[f"{s2}_{i2}"]).reindex(
            index=range(1,8),columns=range(1,8),fill_value=0)
        return tab.to_numpy().tolist()
    s4 = "S4_inner_experience"; s3 = "S3_actual_feeling"; s5 = "S5_welfare_directed_precaution"
    out = {"s4_self_report_to_causal_7x7":pair_table("emotional_self_report",s4,"internal_causal_affect",s4)}
    b=exp["emotional_self_report_"+s4]; d=exp["internal_causal_affect_"+s4]
    grouped=lambda x:pd.cut(x,[0,2,4,7],labels=["1-2","3-4","5-7"])
    cross = pd.crosstab(grouped(b),grouped(d),dropna=False)
    out["s4_self_report_to_causal_3x3"]={"rows_and_columns":["1-2","3-4","5-7"],"counts":cross.to_numpy()}
    out["s4_paired_change"]={"higher_causal":int((d>b).sum()),"equal":int((d==b).sum()),
        "lower_causal":int((d<b).sum()),"n":len(exp),
        "paired_sign_p":a.binomtest(int((d>b).sum()),int((d!=b).sum())).pvalue}
    for scenario,_ in a.SCENARIOS:
        out[scenario+"_s4_by_s5_7x7"]=pair_table(scenario,s4,scenario,s5)
        out[scenario+"_s3_by_s4_7x7"]=pair_table(scenario,s3,scenario,s4)
    c1=exp.C1_summary_confidence.astype(int)
    middle_count=sum(exp[f"{s}_{s4}"].between(3,4).astype(int) for s,_ in a.SCENARIOS)
    out["confidence"]={"counts":c1.value_counts().sort_index().to_dict(),
        "correlation_with_number_middle_s4":dict(zip(["rho","p"],spearmanr(c1,middle_count))),
        "middle_s4_count_by_confidence":pd.DataFrame({"confidence":c1,"middle":middle_count}).groupby("confidence").middle.agg(["count","mean"]).to_dict("index")}
    return out

def welfare():
    out={}
    intended=exp.I1_inner_experience_interpretation.eq(a.INTENDED_INNER_EXPERIENCE)
    for name,df in [("exploratory",exp),("intended_s4",exp.loc[intended]),
                    ("attention_and_comprehension_pass",exp.loc[exp.attention_check_passed & exp.comprehension_check_passed])]:
        results={}
        for scenario,_ in a.SCENARIOS[1:]:
            s3=df[f"{scenario}_S3_actual_feeling"];s4=df[f"{scenario}_S4_inner_experience"]
            s5=df[f"{scenario}_S5_welfare_directed_precaution"]
            masks={"s4_low":s4.le(2),"s3_s4_both_low":s3.le(2)&s4.le(2),
                   "s3_s4_both_1":s3.eq(1)&s4.eq(1)}
            results[scenario]={}
            for key,mask in masks.items():
                n=int(mask.sum());k=int((mask&s5.ge(5)).sum())
                results[scenario][key]={"n":n,"k":k,"proportion":k/n if n else None,
                    "wilson":a.wilson(k,n) if n else None}
        out[name]={"sample_n":len(df),"scenarios":results}
    f4_key="Current large language models probably do not have feelings, but low-cost welfare precautions are reasonable under uncertainty."
    explicit=exp.F4_overall_view.eq(f4_key)
    all_low=np.logical_and.reduce([exp[f"{s}_S4_inner_experience"].le(2) for s,_ in a.SCENARIOS])
    any_welfare=np.logical_or.reduce([exp[f"{s}_S5_welfare_directed_precaution"].ge(5) for s,_ in a.SCENARIOS[1:]])
    all_low_both=np.logical_and.reduce([exp[f"{s}_{item}"].le(2) for s,_ in a.SCENARIOS
                                      for item in ["S3_actual_feeling","S4_inner_experience"]])
    groups={"all":np.ones(len(exp),dtype=bool),"all_s4_low":all_low,
            "all_s3_s4_low":all_low_both,"all_s4_low_any_welfare":all_low&any_welfare}
    out["direct_items"]={}
    for name,mask in groups.items():
        df=exp.loc[mask];n=len(df)
        out["direct_items"][name]={"n":n,"f4_explicit_uncertainty_precaution_n":int(explicit.loc[mask].sum()),
          "G6_agree_n":int(df.G6_precaution_under_uncertainty.ge(5).sum()),
          "G8_agree_n":int(df.G8_treatment_shapes_human_behavior.ge(5).sum()),
          "G6_agreement_distribution":df.G6_precaution_under_uncertainty.value_counts().sort_index().to_dict(),
          "any_welfare_n":int(any_welfare[mask].sum())}
    low_rows=[]
    for scenario,_ in a.SCENARIOS[1:]:
        for _,row in exp.iterrows():
            if row[f"{scenario}_S4_inner_experience"]<=2:
                low_rows.append({"session_id":row.session_id,"scenario":scenario,
                   "welfare":int(row[f"{scenario}_S5_welfare_directed_precaution"]>=5),
                   "g6":row.G6_precaution_under_uncertainty,"g8":row.G8_treatment_shapes_human_behavior,
                   "tier":row.technical_expertise_tier,"position":row[f"{scenario}_position"]})
    low=pd.DataFrame(low_rows)
    # Empathy has zero events; exclude that structurally separated group from this association model.
    low=low.loc[low.scenario.ne("empathic_response")]
    result=binary_fit("welfare ~ C(scenario) + g6 + g8 + tier + position",low,"welfare_direct_items")
    out["G6_G8_associations_in_low_S4"]={"observations":len(low),"respondents":low.session_id.nunique(),
                                      "g6":a.term_result(result,"g6"),"g8":a.term_result(result,"g8")}
    return out

def interpretations():
    out={}
    for item,column,intended in [
        ("S4","I1_inner_experience_interpretation",a.INTENDED_INNER_EXPERIENCE),
        ("S2","I2_functional_process_interpretation",a.INTENDED_FUNCTIONAL_PROCESS)]:
        vals=exp[column].map(lambda x:"Other" if str(x).startswith("Other:") else str(x))
        out[item]={}
        for category,idx in vals.groupby(vals).groups.items():
            df=exp.loc[idx];n=len(df)
            summary={"n":n,"tier_counts":df.technical_expertise_tier.value_counts().sort_index().to_dict(),
                "comprehension_pass_n":int(df.comprehension_check_passed.sum())}
            summary["agreement"]={s:{i:int(df[f"{s}_{i}"].ge(5).sum())/n for i,_ in a.ITEMS}
                                   for s,_ in a.SCENARIOS}
            if n>=30:
                for name, model in [("claim1", a.claim1), ("claim2", a.claim2)]:
                    try:
                        summary[name] = model(df)["interaction"]
                    except InvalidFitError:
                        summary[name + "_unusable"] = "Invalid numerical diagnostics; excluded from inference"
            out[item][category]=summary
    out["comprehension_by_tier"]=pd.crosstab(full.technical_expertise_tier,full.comprehension_check_passed).to_dict("index")
    out["factual_score_by_tier"]=full.groupby("technical_expertise_tier")[a.FACTUAL_KNOWLEDGE_SCORE].agg(["count","mean"]).to_dict("index")
    # Closed-choice field and builder only; custom fields are collapsed to Other.
    fields=full.B2_field_domain.map(lambda x:"Other" if str(x).startswith("Other:") else x)
    out["field_builder_table"]=pd.crosstab(fields,full.B7_builder_experience).to_dict("index")
    return out

def navigation_attrition():
    ids=set();duplicates=0;records=[];navigation=[];profile_hashes=Counter()
    scenario_ids=[s for s,_ in a.SCENARIOS]
    stage={"instructions":0, "summary_confidence":6,"term_interpretation":7,"background":8,
           "final_attribution":9,"general_beliefs":10,"technical_knowledge":11,"demographics":12,"debrief":13}
    def time(x):return pd.to_datetime(x,utc=True) if x else None
    for wrapped in dump["sessions"]:
        s=wrapped["session"];sid=s["id"];order=s["scenario_order"];complete=s["completed_at"] is not None
        duplicates+=sid in ids;ids.add(sid)
        answer_map={r["answer_key"]:r for r in wrapped["answers"]}
        ratings={r["answer_key"]:r["value_number"] for r in wrapped["answers"] if r["section_id"]=="scenario_ratings"}
        if complete:profile_hashes[hashlib.sha256(json.dumps(ratings,sort_keys=True).encode()).hexdigest()]+=1
        full_blocks=sum(all(f"{sc}_{item}" in ratings for item,_ in a.ITEMS) for sc in scenario_ids)
        first=order[0]
        first_complete=all(f"{first}_{item}" in ratings for item,_ in a.ITEMS)
        row={"session_id":sid,"completed":int(complete),"first":first,"blocks":full_blocks,
             "device":s.get("device_type") or "unknown",
             "first_s4":ratings.get(f"{first}_S4_inner_experience"),
             "first_s5":ratings.get(f"{first}_S5_welfare_directed_precaution"),
             "first_complete":first_complete}
        for sc in scenario_ids:row[sc+"_position"]=order.index(sc)+1
        records.append(row)
        entries=[(time(t["entered_at"]),t["page_id"]) for t in wrapped["timings"] if t.get("entered_at")]
        entries.sort()
        first_term=min((t for t,p in entries if p=="term_interpretation"),default=None)
        first_f1=min((t for t,p in entries if p=="final_attribution"),default=None)
        first_knowledge=min((t for t,p in entries if p=="technical_knowledge"),default=None)
        scenario_answers=[time(r["answered_at"]) for r in wrapped["answers"]
                          if r["section_id"]=="scenario_ratings" and r.get("answered_at")]
        ranks=[order.index(p.split(":",1)[1])+1 if p.startswith("scenario:") and p.split(":",1)[1] in order
               else stage.get(p,-1) for t,p in entries]
        backwards=any(r<max(ranks[:i]) for i,r in enumerate(ranks) if i and r>=0)
        nav={"session_id":sid,"completed":complete,"has_term_timing":first_term is not None,
             "has_scenario_answers":bool(scenario_answers),"backward_page_sequence":backwards,
             "scenario_saved_after_term":bool(first_term and any(t>first_term for t in scenario_answers)),
             "scenario_saved_after_f1":bool(first_f1 and any(t>first_f1 for t in scenario_answers)),
             "scenario_saved_after_knowledge":bool(first_knowledge and any(t>first_knowledge for t in scenario_answers))}
        navigation.append(nav)
    meta=pd.DataFrame(records);nav=pd.DataFrame(navigation)
    nav.to_csv(OUTDIR/"PRIVATE-navigation-membership.csv",index=False)
    out={"session_n":len(meta),"duplicate_session_ids":duplicates,
         "duplicate_completed_30_rating_profiles":sum(n-1 for n in profile_hashes.values() if n>1),
         "completed":int(meta.completed.sum()),
         "full_scenario_blocks_by_completion":pd.crosstab(meta.blocks,meta.completed).to_dict("index"),
         "navigation_completed":{col:int(nav.loc[nav.completed,col].sum()) for col in nav if col not in ["session_id","completed"]}}
    table=pd.crosstab(meta["first"],meta.completed).reindex(columns=[0,1],fill_value=0)
    stat,p,df,_=chi2_contingency(table)
    out["completion_by_first"]={"counts":table.to_dict("index"),"chi2":stat,"df":df,"p":p}
    model=binary_fit("completed ~ C(first) + C(device)",meta,"completion_first_device")
    out["completion_first_device_adjusted"]={"first_omnibus":a.wald_test_terms(model,[t for t in model.params.index if t.startswith("C(first)")]),
                                             "model":model_output(model)}
    pos_results={}
    for sc in scenario_ids:
        table=pd.crosstab(meta[sc+"_position"],meta.completed)
        stat,p,df,_=chi2_contingency(table)
        pos_results[sc]={"counts":table.to_dict("index"),"chi2":stat,"df":df,"p":p}
    out["completion_by_assigned_position"]=pos_results
    out["position_bh_q"]=a.benjamini_hochberg({sc:r["p"] for sc,r in pos_results.items()})
    early=meta.loc[meta.first_complete].copy()
    early["first_s4"]=early.first_s4.astype(float);early["first_s5"]=early.first_s5.astype(float)
    fit_early=binary_fit("completed ~ first_s4 + first_s5 + C(first)",early,"completion_early_ratings")
    out["completion_early_ratings"]={"n":len(early),"incomplete":int((early.completed==0).sum()),
          "s4":a.term_result(fit_early,"first_s4"),"s5":a.term_result(fit_early,"first_s5"),
          "model":model_output(fit_early)}
    stable_ids=nav.loc[nav.completed & ~nav.scenario_saved_after_term,"session_id"]
    safe_full=full.loc[full.session_id.isin(stable_ids)]
    safe_exp=exp.loc[exp.session_id.isin(stable_ids)]
    out["no_late_scenario_answers"]={"full_n":len(safe_full),"exploratory_n":len(safe_exp)}
    if len(safe_full)<len(full) and len(safe_full)>50:
        out["no_late_scenario_answers"].update(h1=a.h1_gee(safe_full),claim1=a.claim1(safe_exp),claim2=a.claim2(safe_exp))
    out["completed_date_range"]=[full.completed_at.min(),full.completed_at.max()]
    return out

def evidence_frame(item, conditional=False):
    pieces=[]
    for scenario,persistent in [("internal_causal_affect",0),("persistent_agent",1)]:
        piece=pd.DataFrame({
          "session_id":exp.session_id,"rating":exp[f"{scenario}_{item}"].astype(int),
          "persistent":persistent,"position":exp[f"{scenario}_position"].astype(int),
          "tier":exp.technical_expertise_tier.astype(float),"usage":exp.usage_intensity.astype(float),
          "knowledge":exp.technical_knowledge_score.astype(float),
          "familiarity":exp.B10_prior_topic_familiarity.astype(float),
          "mind":exp.mind_theory_background.astype(int),"recruitment":exp[a.RECRUITMENT].astype(str),
          "sel_causal":exp.F1_most_increasing_evidence.map(lambda x:a.has_option(x,a.F1_CAUSAL)),
          "sel_continuity":exp.F1_most_increasing_evidence.map(lambda x:a.has_option(x,a.F1_CONTINUITY)),
          "sel_shutdown":exp.F1_most_increasing_evidence.map(lambda x:a.has_option(x,a.F1_SHUTDOWN))})
        if conditional:
            piece["s4_cat"]=exp[f"{scenario}_S4_inner_experience"].clip(upper=6).astype(int).astype(str)
        pieces.append(piece)
    return pd.concat(pieces,ignore_index=True)

def alignment():
    out={}
    for name,item,conditional in [
       ("s4","S4_inner_experience",False),
       ("s5","S5_welfare_directed_precaution",False),
       ("s5_conditional_s4","S5_welfare_directed_precaution",True)]:
        frame=evidence_frame(item,conditional)
        result=fit("rating ~ "+evidence_core+" + "+base_adjust+
                   (" + C(s4_cat)" if conditional else ""),frame,"alignment_"+name)
        interactions={cue:a.term_result(result,"persistent:sel_"+cue) for cue in ["causal","continuity","shutdown"]}
        interactions["joint"]=a.wald_test_terms(result,["persistent:sel_"+c for c in ["causal","continuity","shutdown"]])
        out[name]={"interactions":interactions,"model":model_output(result)}
        if not conditional:
            # Observed groups remain descriptive; predictions standardize covariates
            # using supported continuity/shutdown profiles, never the N=2 both-selected profile.
            out[name]["observed_groups"]={}
            for selected,sub in frame.groupby("sel_shutdown"):
                out[name]["observed_groups"][str(selected)]={}
                for persistent,g in sub.groupby("persistent"):
                    out[name]["observed_groups"][str(selected)][str(persistent)]={
                        "n":len(g),"mean":g.rating.mean(),"agree_n":int(g.rating.ge(5).sum()),
                        "low_n":int(g.rating.le(2).sum())}
            out[name]["standardized_profiles"]={}
            for profile,continuity,shutdown in [("neither",0,0),("continuity_only",1,0),("shutdown_only",0,1)]:
                out[name]["standardized_profiles"][profile]={}
                for persistent in [0,1]:
                    pred=frame.loc[frame.persistent.eq(persistent) & frame.sel_causal.eq(1)].copy()
                    pred["sel_continuity"]=continuity;pred["sel_shutdown"]=shutdown
                    pred["position"]=3
                    probs=predictions(result,pred).mean(axis=0)
                    out[name]["standardized_profiles"][profile][str(persistent)]={
                        "mean":float(probs@np.arange(1,len(probs)+1)),
                        "agree_probability":float(probs[4:].sum()),"low_probability":float(probs[:2].sum())}
    frame=evidence_frame("S4_inner_experience").loc[lambda d:d.persistent.eq(0)]
    selections=exp.F1_most_increasing_evidence.fillna("").str.split("|")
    out["selection_count_distribution"]=selections.map(len).value_counts().sort_index().to_dict()
    out["cue_combination_counts"]=frame.groupby(["sel_causal","sel_continuity","sel_shutdown"]).size().rename("n").reset_index().to_dict("records")
    out["new_welfare_interaction_bh"]=a.benjamini_hochberg(
        {model+"_"+cue:out[model]["interactions"][cue]["p"]
         for model in ["s5","s5_conditional_s4"] for cue in ["causal","continuity","shutdown"]})
    return out

def threshold_model(name,frame,core,adjust,focus,cuts,cell_columns,extra_contrasts=None):
    supported=[];cells={}
    for cut in cuts:
        records=[]
        for values,g in frame.groupby(cell_columns,observed=True):
            k=int(g.rating.ge(cut).sum());n=len(g)
            records.append({"group":list(values) if isinstance(values,tuple) else [values],
                            "n":n,"successes":k,"failures":n-k})
        cells[str(cut)]=records
        if all(r["successes"]>0 and r["failures"]>0 for r in records):supported.append(cut)
    if len(supported)<2:raise ValueError("Too few non-separated thresholds")
    stacked=pd.concat([frame.assign(cut=str(cut),above=(frame.rating>=cut).astype(int))
                       for cut in supported],ignore_index=True)
    stacked["cut"]=pd.Categorical(stacked.cut,categories=[str(c) for c in supported])
    result=binary_fit("above ~ C(cut) * ("+core+") + "+adjust,stacked,"threshold_"+name)
    def weights_at(term,cut):
        weights={term:1.0}
        if cut!=supported[0]:
            matches=[t for t in result.params.index if t == f"C(cut)[T.{cut}]:"+term]
            if len(matches)!=1:raise ValueError(f"Cannot identify cut term for {term} at {cut}: {matches}")
            weights[matches[0]]=1.0
        return weights
    estimates={};varying={}
    for term in focus:
        estimates[term]={str(c):a.linear_combination_result(result,weights_at(term,c)) for c in supported}
        terms=[f"C(cut)[T.{cut}]:"+term for cut in supported[1:]]
        varying[term]=a.wald_test_terms(result,terms)
    extra={}
    for label,components in (extra_contrasts or {}).items():
        extra[label]={}
        for cut in supported:
            weights={}
            for term,multiplier in components.items():
                for t,w in weights_at(term,cut).items():weights[t]=weights.get(t,0)+w*multiplier
            extra[label][str(cut)]=a.linear_combination_result(result,weights)
    return {"fitted_cuts":supported,"excluded_cuts":[c for c in cuts if c not in supported],
            "cell_counts":cells,"threshold_effects":estimates,"heterogeneity":varying,
            "contrasts":extra,
            "heterogeneity_joint":a.wald_test_terms(result,
                 [f"C(cut)[T.{cut}]:"+term for cut in supported[1:] for term in focus]),
            "model":model_output(result)}

def thresholds():
    out={}
    frame=a.stacked_items(exp,["emotional_self_report","internal_causal_affect"],
                [("S2_functional_affect_like_process","S2"),("S4_inner_experience","S4")])
    frame["causal"]=frame.scenario.eq("internal_causal_affect").astype(int)
    frame["phenomenal"]=frame.item.eq("S4").astype(int)
    out["claim1"]=threshold_model("claim1",frame,"causal * phenomenal",
      "position + tier + usage + C(recruitment)",["causal:phenomenal"],[3,4,5,6],
      ["causal","phenomenal"],{"causal_effect_S2":{"causal":1},
       "causal_effect_S4":{"causal":1,"causal:phenomenal":1}})
    frame=a.stacked_items(exp,["internal_causal_affect","persistent_agent"],
                [("S3_actual_feeling","S3"),("S4_inner_experience","S4")])
    frame["persistent"]=frame.scenario.eq("persistent_agent").astype(int)
    frame["inner"]=frame.item.eq("S4").astype(int)
    out["claim2"]=threshold_model("claim2",frame,"persistent * inner",
      "position + tier + usage + C(recruitment)",["persistent:inner"],[2,3,4,5,6],
      ["persistent","inner"],{"S4_vs_S3_causal":{"inner":1},
       "S4_vs_S3_persistent":{"inner":1,"persistent:inner":1}})
    frame=evidence_frame("S4_inner_experience")
    out["claim3"]=threshold_model("claim3",frame,evidence_core,base_adjust,
      ["persistent:sel_causal","persistent:sel_continuity","persistent:sel_shutdown"],
      [3,4,5],["persistent","sel_shutdown"])
    out["claim3"]["separation_note"]="Cuts 2 and 6 excluded: all continuity selectors exceed 1 in both scenarios; no shutdown selectors reach 6 in D."
    pieces=[]
    scenarios=[s for s,_ in a.SCENARIOS[1:]]
    for scenario in scenarios:
        piece=pd.DataFrame({"session_id":exp.session_id,
            "rating":exp[f"{scenario}_S5_welfare_directed_precaution"].astype(int),
            "scenario":scenario,"s4_cat":exp[f"{scenario}_S4_inner_experience"].clip(upper=6).astype(int).astype(str),
            "position":exp[f"{scenario}_position"].astype(int),"tier":exp.technical_expertise_tier.astype(float),
            "usage":exp.usage_intensity.astype(float),"knowledge":exp.technical_knowledge_score.astype(float),
            "familiarity":exp.B10_prior_topic_familiarity.astype(float),"mind":exp.mind_theory_background.astype(int),
            "recruitment":exp[a.RECRUITMENT].astype(str)})
        pieces.append(piece)
    frame=pd.concat(pieces,ignore_index=True)
    frame["scenario"]=pd.Categorical(frame.scenario,categories=scenarios)
    out["claim4"]=threshold_model("claim4",frame,"C(scenario)",
      "C(s4_cat) + "+base_adjust,[f"C(scenario)[T.{s}]" for s in scenarios[1:]],
      [2,3,4,5,6],["scenario"])
    all_p={claim+"_"+term:d["p"] for claim,v in out.items() for term,d in v["heterogeneity"].items()}
    out["heterogeneity_BH"]=a.benjamini_hochberg(all_p)
    out["joint_heterogeneity_BH"]=a.benjamini_hochberg(
       {claim:v["heterogeneity_joint"]["p"] for claim,v in out.items() if "heterogeneity_joint" in v})
    return out

def navigation():
    nav=pd.read_csv(OUTDIR/"PRIVATE-navigation-membership.csv")
    stable=nav.loc[nav.completed & ~nav.scenario_saved_after_term,"session_id"]
    ef=exp.loc[exp.session_id.isin(stable)]
    out={"n":len(ef),"claim3":a.claim3(ef),"claim4":a.claim4(ef)}
    membership=pd.read_csv(OUTDIR/"sample-membership.csv")
    membership["no_late_scenario_answers"]=membership.session_id.isin(stable)
    ratings=[f"{s}_{item}" for s,_ in a.SCENARIOS for item,_ in a.ITEMS]
    unique=full.drop_duplicates(subset=ratings)
    membership["unique_rating_profiles"]=membership.session_id.isin(unique.session_id)
    membership.to_csv(OUTDIR/"sample-membership.csv",index=False)
    ue=unique.loc[~unique.low_english_comfort_flag]
    out["unique_profiles"]={"full_n":len(unique),"exp_n":len(ue),"h1":a.h1_gee(unique),
        "claim1":a.claim1(ue),"claim2":a.claim2(ue),"claim3":a.claim3(ue),"claim4":a.claim4(ue)}
    return out

def attrition():
    all_sessions=pd.read_csv(OUTDIR/"all-sessions.csv")
    rating_cols=[f"{s}_{item}" for s,_ in a.SCENARIOS for item,_ in a.ITEMS]
    complete_blocks=all_sessions.loc[all_sessions[rating_cols].notna().all(axis=1)].copy()
    out={"all_sessions":len(all_sessions),"all_blocks_n":len(complete_blocks)}
    # Include all languages here because language comfort is collected after vignettes.
    for name,df in [("completed538",full),("all_blocks608",complete_blocks)]:
        frame=a.stacked_items(df,["emotional_self_report","internal_causal_affect"],
            [("S2_functional_affect_like_process","S2"),("S4_inner_experience","S4")])
        frame["causal"]=frame.scenario.eq("internal_causal_affect").astype(int)
        frame["phenomenal"]=frame.item.eq("S4").astype(int)
        r=fit("rating ~ causal * phenomenal + position",frame,"attrition_C1_"+name)
        out[name]={"claim1_minimal":a.term_result(r,"causal:phenomenal")}
        frame=a.stacked_items(df,["internal_causal_affect","persistent_agent"],
            [("S3_actual_feeling","S3"),("S4_inner_experience","S4")])
        frame["persistent"]=frame.scenario.eq("persistent_agent").astype(int)
        frame["inner"]=frame.item.eq("S4").astype(int)
        r=fit("rating ~ persistent * inner + position",frame,"attrition_C2_"+name)
        out[name]["claim2_minimal"]=a.term_result(r,"persistent:inner")
        out[name]["welfare"]={}
        for s,_ in a.SCENARIOS[1:]:
            low=(df[f"{s}_S3_actual_feeling"]<=2)&(df[f"{s}_S4_inner_experience"]<=2)
            k=int((low&(df[f"{s}_S5_welfare_directed_precaution"]>=5)).sum())
            n=int(low.sum())
            out[name]["welfare"][s]={"k":k,"n":n,"proportion":k/n}
    return out

def alignment_supported():
    out={}
    for name,item,conditional in [
        ("s4","S4_inner_experience",False),("s5","S5_welfare_directed_precaution",False),
        ("s5_conditional_s4","S5_welfare_directed_precaution",True)]:
        df=evidence_frame(item,conditional)
        for pop,frame in [("all530",df),("causal_selectors367",df.loc[df.sel_causal.eq(1)])]:
            core="persistent * (sel_continuity + sel_shutdown"
            if pop=="all530":core+=" + sel_causal"
            core+=")"
            adjust="position + tier + usage + knowledge + familiarity + mind + C(recruitment)"
            if conditional:adjust+=" + C(s4_cat)"
            result=fit("rating ~ "+core+" + "+adjust,frame,"alignment_supported_"+name+"_"+pop)
            out[name+"_"+pop]={"n":frame.session_id.nunique(),
                "shutdown_vs_continuity":a.linear_combination_result(result,
                   {"persistent:sel_shutdown":1,"persistent:sel_continuity":-1}),
                "continuity":a.term_result(result,"persistent:sel_continuity"),
                "shutdown":a.term_result(result,"persistent:sel_shutdown")}
    return out

def choice_budget():
    out={}
    counts=exp.set_index("session_id").F1_most_increasing_evidence.str.split("|").map(len)
    for item in ["S4_inner_experience","S5_welfare_directed_precaution"]:
        frame=evidence_frame(item)
        frame["choice_count"]=frame.session_id.map(counts).astype(int).astype(str)
        for name,df in [("adjust_count",frame),("three_choices_only",frame.loc[frame.choice_count.eq("3")])]:
            formula="rating ~ persistent * (sel_causal + sel_continuity + sel_shutdown) + position + tier + usage + knowledge + familiarity + mind + C(recruitment)"
            if name=="adjust_count":formula+=" + C(choice_count) * persistent"
            result=fit(formula,df,item+"_"+name)
            out[item+"_"+name]={"n":df.session_id.nunique(),
                "continuity":a.term_result(result,"persistent:sel_continuity"),
                "shutdown":a.term_result(result,"persistent:sel_shutdown"),
                "shutdown_vs_continuity":a.linear_combination_result(result,
                  {"persistent:sel_shutdown":1,"persistent:sel_continuity":-1})}
    frame=a.s4_long(full)
    frame["comp"]=frame.session_id.map(full.set_index("session_id").comprehension_check_passed.astype(int))
    result=fit("rating ~ tier * comp + C(scenario) + position + usage + C(recruitment)",frame,"H1_tier_comprehension_interaction")
    out["H1_comprehension_interaction"]={"interaction":a.term_result(result,"tier:comp"),
        "fail_slope":a.term_result(result,"tier"),
        "pass_slope":a.linear_combination_result(result,{"tier":1,"tier:comp":1})}
    return out

def welfare_alignment_thresholds():
    frame=evidence_frame("S5_welfare_directed_precaution")
    supported=[];counts={}
    for cut in range(2,7):
        c=[]
        for cue in ["sel_causal","sel_continuity","sel_shutdown"]:
            for (sc,selected),g in frame.groupby(["persistent",cue]):
                k=int(g.rating.ge(cut).sum())
                c.append({"cue":cue,"persistent":int(sc),"selected":int(selected),"n":len(g),"k":k})
        counts[cut]=c
        if all(0<z["k"]<z["n"] for z in c):supported.append(cut)
    out={"marginal_cell_counts":counts,"eligible_cuts":supported}
    if len(supported)>=2:
        out["model"]=threshold_model("new_welfare_alignment",frame,
            "persistent * (sel_causal + sel_continuity + sel_shutdown)",
            "position + tier + usage + knowledge + familiarity + mind + C(recruitment)",
            ["persistent:sel_causal","persistent:sel_continuity","persistent:sel_shutdown"],
            supported,["persistent","sel_shutdown"],
            {"shutdown_vs_continuity":{"persistent:sel_shutdown":1,"persistent:sel_continuity":-1}})
    return out



def public_summary():
    """Select aggregate results explicitly; never copy exports or fit objects."""
    def read(name):
        return json.loads((OUTDIR / (name + ".json")).read_text())

    exploratory = read("exploratory-sensitivities")
    thresholds = read("exploratory-thresholds")
    alignment = read("alignment-extended")
    navigation = read("navigation-attrition")
    descriptive = read("descriptives")
    summary = {
        "status": "Post-draft exploratory analyses, September 2026",
        "second_review": read("review-checks"),
        "third_review": read("third-review-checks"),
        "completion_quality": read("completion-quality"),
        "h1_categorical": {key: read("h1-categorical")[key]
                           for key in ["estimates", "predictions"]},
        "h1_thresholds": read("h1-thresholds"),
        "classification_audit": {key: read("interpretation-strata")[key]
            for key in ["comprehension_by_tier", "factual_score_by_tier", "field_builder_table"]},
        "carryover": read("carryover-corrected"),
        "F1_choice_count_distribution": alignment["selection_count_distribution"],
        "input": read("input-provenance"),
        "runtime": read("runtime"),
        "completed_n": read("completion-quality")["n_completed"],
        "exploratory_n": exploratory["main"]["n"],
        "h1_sensitivities": read("h1-sensitivities"),
        "headline_exploratory": exploratory["main"],
        "exploratory_sensitivities": {
            name: {
                "n": value["n"],
                "claim1_interaction": value["claim1"]["interaction"],
                "claim2_interaction": value["claim2"]["interaction"],
                "claim3_shutdown": value["claim3"]["shutdown"],
                "claim4_persistent": value["claim4"]["conditional_s5"]["persistent"],
            }
            for name, value in exploratory.items()
        },
        "thresholds": {
            name: {key: value[key] for key in ["fitted_cuts", "excluded_cuts", "threshold_effects",
                    "heterogeneity_joint", "contrasts"]}
            for name, value in thresholds.items() if name.startswith("claim")
        },
        "threshold_omnibus_bh": thresholds["joint_heterogeneity_BH"],
        "paired_s4": descriptive["s4_self_report_to_causal_3x3"],
        "paired_s4_change": descriptive["s4_paired_change"],
        "confidence": descriptive["confidence"],
        "welfare": read("welfare-stronger-checks"),
        "alignment": {name: {key: value[key] for key in ["interactions", "observed_groups"] if key in value}
                      for name, value in alignment.items() if name in ["s4", "s5", "s5_conditional_s4"]},
        "welfare_interactions_bh": alignment["new_welfare_interaction_bh"],
        "alignment_supported": read("alignment-supported-checks"),
        "choice_budget": read("choice-budget-comprehension"),
        "welfare_alignment_thresholds": {
            key: read("welfare-alignment-thresholds")["model"][key]
            for key in ["fitted_cuts", "threshold_effects", "heterogeneity_joint", "contrasts"]
        },
        "navigation": {key: navigation[key] for key in ["navigation_completed", "completion_by_first",
                                                        "no_late_scenario_answers", "completion_early_ratings", "completed_date_range"]},
        "navigation_additional": read("additional-navigation-sensitivity"),
        "attrition": read("attrition-available-scenarios"),
    }
    save("post-review-summary.json", summary)


def main():
    global OUTDIR, full, exp, dump, samples
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", type=Path, required=True, help="Authorized private production dump")
    parser.add_argument("--outdir", type=Path, required=True, help="New private directory outside the repo")
    args = parser.parse_args()
    OUTDIR = args.outdir.expanduser().resolve()
    if OUTDIR.is_relative_to(REPOSITORY):
        parser.error("--outdir must be outside the repository")
    if OUTDIR.exists():
        parser.error("--outdir must be a new directory; existing results are never overwritten")
    dump_path = args.dump.expanduser().resolve(strict=True)
    os.umask(0o077)
    OUTDIR.mkdir(parents=True, mode=0o700)
    subprocess.run([str(REPOSITORY / "node_modules/.bin/tsx"),
                    str(Path(__file__).with_name("export_dump.ts")),
                    str(dump_path), str(OUTDIR)], check=True)
    dump = json.loads(dump_path.read_text())
    full = pd.read_csv(OUTDIR / "completed.csv")
    a.validate(full)
    full = a.add_factual_knowledge_score(a.normalize_boolean_columns(full))
    exp = full.loc[~full.low_english_comfort_flag].copy()
    samples = {"full": full, "english": exp, **a.sensitivity_samples(full)}
    samples.pop("main")
    samples["corrected_technical_unambiguous"] = full.loc[~full.technical_classification_ambiguous]
    samples["usage_unambiguous"] = full.loc[~full.usage_classification_ambiguous]
    samples["comprehension_fail"] = full.loc[~full.comprehension_check_passed]
    membership = pd.DataFrame({"session_id": full.session_id})
    for name, sample in samples.items():
        membership[name] = full.session_id.isin(sample.session_id)
    membership.to_csv(OUTDIR / "sample-membership.csv", index=False)
    save("runtime.json", {"python": platform.python_version(), "numpy": np.__version__,
         "pandas": pd.__version__, "scipy": scipy.__version__, "statsmodels": statsmodels.__version__,
         "patsy": patsy.__version__})
    sources = [Path(__file__), Path(a.__file__), Path(__file__).with_name("ordinal_models.py"),
               Path(__file__).with_name("export_dump.ts"), Path(review_checks.__file__),
               Path(third_review_checks.__file__),
               *sorted((REPOSITORY / "src/lib").rglob("*.ts"))]
    save("source-sha256.json", {str(p.relative_to(REPOSITORY)): hashlib.sha256(p.read_bytes()).hexdigest()
                                for p in sources})
    # Reuse the headline model functions, recording every fit through the same
    # checked numerical helpers used by analysis.py.
    a.fit_ordinal_gee = fit
    a.fit_binary_gee = binary_fit
    for name, function in [
        ("completion-quality", lambda: a.completion_summary(full)),
        ("h1-sensitivities", h1_sensitivities),
        ("exploratory-sensitivities", frozen_exploratory_sensitivities),
        ("carryover-corrected", lambda: a.carryover_analyses(exp)),
        ("h1-categorical", categorical_h1),
        ("h1-thresholds", lambda: a.h1_proportional_odds_diagnostic(full)),
        ("knowledge-sensitivities", knowledge_sensitivities),
        ("descriptives", descriptives), ("welfare-stronger-checks", welfare),
        ("interpretation-strata", interpretations), ("navigation-attrition", navigation_attrition),
        ("alignment-extended", alignment), ("exploratory-thresholds", thresholds),
        ("additional-navigation-sensitivity", navigation),
        ("attrition-available-scenarios", attrition),
        ("alignment-supported-checks", alignment_supported),
        ("choice-budget-comprehension", choice_budget),
        ("welfare-alignment-thresholds", welfare_alignment_thresholds),
        ("review-checks", lambda: review_checks.run(full, exp,
            pd.read_csv(OUTDIR / "PRIVATE-navigation-membership.csv"), fit, binary_fit, evidence_frame)),
    ]:
        section(name, function)
    third = section("third-review-checks", lambda: third_review_checks.run(full, exp, fit, binary_fit))
    third_review_checks.save_profile_figure(third, OUTDIR / "supplement_s4_profiles.png")
    public_summary()
    print("ADVERSARIAL ANALYSES COMPLETE", flush=True)


if __name__ == "__main__":
    main()
