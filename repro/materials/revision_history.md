# Revision history

The paper identifies each analysis by status: pre-specified in the June 1, 2026 plan, frozen in the quantitative drafting freeze, or post-hoc. This note records the chronology behind those labels: what each post-draft audit and review found, and what it added or corrected. None of the events below changed the pre-specified H1 test or the frozen headline estimates.

## Post-draft implementation audit

The audit found that the export's original classification-ambiguity flag treated any difference between field and builder-experience signals as a conflict. Those questions were designed as independent routes to a tier, with the highest clearly supported tier retained, so combinations such as a software background with no LLM-building experience were not ambiguous. The error affected only the sensitivity flag, not tier assignment or the primary model. The flag was replaced with separate technical and usage ambiguity flags after the headline analyses were frozen. The correction changed no respondent's expertise tier, the pre-specified H1 test, or any headline exploratory model.

## Post-draft timing audit

The audit tested sensitivity to scenario answers saved after the respondent first entered the interpretation page.

## Adversarial review

The first adversarial review of the draft and data added the previously unreported H1 quality exclusions, knowledge adjustment, higher quadrature and alternative starts, paired response tables, stricter welfare definitions, welfare evidence-alignment models, and navigation and attrition checks.

It also identified a redundant ordinary intercept in the ordinal GEE implementation. Removing the intercept while retaining treatment coding reproduced the headline estimates to numerical precision. The analysis scripts were revised to require full-rank GEE designs, finite standard errors, and valid covariance matrices, and to withhold inferential intervals from mixed-model fits with an indefinite Hessian or inadequate outer convergence.

## Second review

The second review added comprehension-stratified S2 agreement, I1-by-expertise distributions and adjustment, technology-adjacent tier sensitivities, usage and mind-background effects for all six items, closed-choice descriptives, convergent associations, within-block response checks, and a separation diagnostic for welfare alignment. These analyses were requested after the draft was inspected.

## Third review

The third review added age and education adjustment, observed S4 response profiles, mind-background construction and exclusions, H3/H5 expertise interactions, unique-respondent welfare counts, and self-report evidence alignment. It also caught that H3 and H5, exploratory questions named in the master plan, had been omitted from the earlier reporting map. Their GEE specifications and threshold diagnostics were chosen during revision rather than recovered as pre-specified mixed-model tests.

## V3 sensitivity-table completion

On September 24, 2026, the Python adversarial workflow was rerun from the private dump, and `analysis.py` regenerated the figures from its exported CSV. The rerun filled the previously blank cells in Table 11, including the comprehension-failer estimates, and added the complete sensitivity estimates and nominal confidence intervals to the public aggregate summary. Previously reported estimates and Table 11 ranges were unchanged. Figure 4's footnote now says that S5 may be less applicable to empathy, treating applicability as an interpretation rather than an established difference. Its plotted values are unchanged.
