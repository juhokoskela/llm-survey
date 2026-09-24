"""Ordinal and binary GEE fits with explicit numerical acceptance checks."""

import warnings

import numpy as np
import statsmodels.api as sm
from patsy import dmatrices
from statsmodels.genmod.cov_struct import Independence, OrdinalIndependence
from statsmodels.genmod.generalized_estimating_equations import GEE, OrdinalGEE


class InvalidFitError(RuntimeError):
    def __init__(self, diagnostic):
        super().__init__("Unusable GEE fit; inspect diagnostic attributes")
        self.diagnostic = diagnostic


def fit_diagnostic(result, formula, caught):
    x = result.model.exog
    covariance = np.asarray(result.cov_params())
    finite_covariance = np.isfinite(covariance).all()
    eigenvalues = (np.linalg.eigvalsh((covariance + covariance.T) / 2)
                   if finite_covariance else np.array([np.nan]))
    return {
        "formula": formula, "converged": bool(result.converged),
        "expanded_rows": x.shape[0], "parameters": x.shape[1],
        "rank": int(np.linalg.matrix_rank(x)),
        "clusters": int(len(np.unique(result.model.groups))),
        "condition_number": float(np.linalg.cond(x)),
        "finite_parameters": bool(np.isfinite(result.params).all()),
        "finite_standard_errors": bool(np.isfinite(result.bse).all()),
        "finite_covariance": bool(finite_covariance),
        "min_cov_eigenvalue": float(eigenvalues.min()),
        "max_cov_eigenvalue": float(eigenvalues.max()),
        "score_norm": float(getattr(result, "score_norm", np.nan)),
        "warnings": list(dict.fromkeys(str(w.message) for w in caught)),
    }


def checked_fit(model, formula):
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        result = model.fit(maxiter=300, ctol=1e-7)
        diagnostic = fit_diagnostic(result, formula, caught)
    result.audit_diagnostic = diagnostic
    if (not diagnostic["converged"] or not diagnostic["finite_parameters"] or
        not diagnostic["finite_standard_errors"] or not diagnostic["finite_covariance"] or
        diagnostic["rank"] != diagnostic["parameters"] or
        diagnostic["min_cov_eigenvalue"] < -1e-8 * max(1, diagnostic["max_cov_eigenvalue"])):
        raise InvalidFitError(diagnostic)
    return result


def fit_ordinal_gee(formula, data):
    y, x = dmatrices(formula, data, return_type="dataframe", NA_action="raise")
    design_info = x.design_info
    # Keep treatment coding, then remove the ordinary intercept. OrdinalGEE
    # supplies threshold intercepts; formula-level `0 +` would change coding.
    x = x.drop(columns="Intercept", errors="ignore")
    model = OrdinalGEE(y.iloc[:, 0], x, groups=data.loc[x.index, "session_id"],
                       cov_struct=OrdinalIndependence())
    result = checked_fit(model, formula)
    result.audit_design_info = design_info
    result.audit_columns = list(x.columns)
    return result


def fit_binary_gee(formula, data):
    model = GEE.from_formula(formula, groups="session_id", data=data,
                            cov_struct=Independence(), family=sm.families.Binomial(),
                            missing="raise")
    return checked_fit(model, formula)
