#!/usr/bin/env Rscript
# Pre-specified primary cumulative-link mixed model for the AI System Scenario Study.
#
# Requires:
#   install.packages("ordinal")
#
# Run:
#   Rscript analysis/clmm_primary.R /path/to/prod-export-2026-08-21.csv
#
# The participant-level CSV is intentionally not distributed publicly.

suppressPackageStartupMessages(library(ordinal))

scenarios <- c(
  "neutral_helpful",
  "emotional_self_report",
  "empathic_response",
  "internal_causal_affect",
  "persistent_agent"
)

make_long <- function(dat, collapse_top_category = FALSE) {
  pieces <- lapply(scenarios, function(s) {
    data.frame(
      session_id = dat$session_id,
      S4 = as.integer(dat[[paste0(s, "_S4_inner_experience")]]),
      scenario_type = s,
      scenario_position = as.numeric(dat[[paste0(s, "_position")]]),
      technical_expertise_tier = as.numeric(dat$technical_expertise_tier),
      usage_intensity = as.numeric(dat$usage_intensity),
      recruitment_source = dat$B9_recruitment_source,
      stringsAsFactors = FALSE
    )
  })

  out <- do.call(rbind, pieces)
  if (collapse_top_category) {
    out$S4[out$S4 == 7] <- 6
    out$S4 <- ordered(out$S4, levels = 1:6)
  } else {
    out$S4 <- ordered(out$S4, levels = 1:7)
  }
  out$scenario_type <- relevel(factor(out$scenario_type), ref = "neutral_helpful")
  out$recruitment_source <- droplevels(factor(out$recruitment_source))
  if ("Researcher’s LinkedIn post" %in% levels(out$recruitment_source)) {
    out$recruitment_source <- relevel(
      out$recruitment_source,
      ref = "Researcher’s LinkedIn post"
    )
  }
  out$session_id <- factor(out$session_id)

  # Centering improves numerical conditioning and does not change slopes.
  out$technical_expertise_tier_c <-
    out$technical_expertise_tier - mean(out$technical_expertise_tier)
  out$technical_expertise_tier_factor <-
    relevel(factor(out$technical_expertise_tier), ref = "0")
  out$scenario_position_c <-
    out$scenario_position - mean(out$scenario_position)
  out$usage_intensity_c <-
    out$usage_intensity - mean(out$usage_intensity)
  out
}

mixed_fit_status <- function(fit, outer_tolerance = 1e-5) {
  covariance <- tryCatch(vcov(fit), error = function(e) NULL)
  eigenvalues <- eigen(fit$Hessian, symmetric = TRUE, only.values = TRUE)$values
  if (any(!is.finite(fit$optRes$par)) || is.null(covariance) || any(!is.finite(covariance)) ||
      any(diag(covariance) <= 0) || min(eigenvalues) <= 0) {
    return("INVALID_HESSIAN_OR_SE")
  }
  outer <- unname(fit$optRes$info["maxgradient"])
  if (length(outer) == 1 && is.finite(outer) && outer <= outer_tolerance &&
      grepl("small gradient", fit$optRes$message)) return("ACCEPTED")
  "NEAR_OR_UNCONVERGED"
}

fit_full <- function(dat, label, collapse_top_category = FALSE) {
  long <- make_long(dat, collapse_top_category)
  warnings_seen <- character()

  ctrl <- clmm2.control(
    method = "ucminf",
    grtol = 1e-5,
    maxIter = 200,
    gradTol = 1e-6,
    maxLineIter = 100,
    innerCtrl = "warnOnly"
  )

  cat("\n============================================================\n")
  cat(label, "\n")
  cat("Respondents:", length(unique(long$session_id)),
      "Observations:", nrow(long), "\n")
  cat("============================================================\n")

  fit <- withCallingHandlers(
    clmm2(
      location = S4 ~ technical_expertise_tier_c + scenario_type +
        scenario_position_c + usage_intensity_c + recruitment_source,
      random = session_id,
      data = long,
      link = "logistic",
      threshold = "flexible",
      Hess = TRUE,
      nAGQ = 7,
      control = ctrl
    ),
    warning = function(w) {
      warnings_seen <<- c(warnings_seen, conditionMessage(w))
      invokeRestart("muffleWarning")
    }
  )

  s <- summary(fit)
  print(s)

  ev <- eigen(fit$Hessian, symmetric = TRUE, only.values = TRUE)$values
  max_grad <- max(abs(fit$gradient))
  cm <- s$coefficients
  row <- cm["technical_expertise_tier_c", ]
  est <- unname(row["Estimate"])
  se <- unname(row["Std. Error"])
  z <- unname(row["z value"])
  p <- unname(row["Pr(>|z|)"])
  ci <- est + c(-1, 1) * qnorm(.975) * se

  cat("\nEXPERTISE ESTIMATE\n")
  cat(sprintf("beta = %.6f\n", est))
  cat(sprintf("SE   = %.6f\n", se))
  cat(sprintf("z    = %.6f\n", z))
  cat(sprintf("p    = %.10g\n", p))
  cat(sprintf("OR   = %.6f\n", exp(est)))
  cat(sprintf("95%% nominal Wald CI OR = [%.6f, %.6f]\n", exp(ci[1]), exp(ci[2])))
  cat(sprintf("Random-intercept SD = %.6f\n", fit$stDev))
  cat(sprintf("inner random-effect max |gradient| = %.10g\n", max_grad))
  cat(sprintf("outer optimizer max |gradient| = %.10g\n", fit$optRes$info["maxgradient"]))
  cat("diagnostic status:", mixed_fit_status(fit), "\n")
  cat(sprintf("minimum Hessian eigenvalue = %.10g\n", min(ev)))
  cat(sprintf("Hessian condition number = %.10g\n", max(ev) / min(ev)))
  cat("optimizer message:", fit$optRes$message, "\n")
  cat("clmm2 convergence flag:\n")
  print(fit$convergence)

  cat("\nWARNING AUDIT\n")
  cat("Warnings captured:", length(warnings_seen), "\n")
  if (length(warnings_seen)) print(sort(table(warnings_seen), decreasing = TRUE))

  invisible(fit)
}

fit_categorical <- function(dat, label) {
  long <- make_long(dat)
  warnings_seen <- character()

  ctrl <- clmm2.control(
    method = "ucminf",
    grtol = 1e-5,
    maxIter = 200,
    gradTol = 1e-6,
    maxLineIter = 100,
    innerCtrl = "warnOnly"
  )

  cat("\n============================================================\n")
  cat(label, "\n")
  cat("Respondents:", length(unique(long$session_id)),
      "Observations:", nrow(long), "\n")
  cat("============================================================\n")

  fit <- withCallingHandlers(
    clmm2(
      location = S4 ~ technical_expertise_tier_factor + scenario_type +
        scenario_position_c + usage_intensity_c + recruitment_source,
      random = session_id,
      data = long,
      link = "logistic",
      threshold = "flexible",
      Hess = TRUE,
      nAGQ = 7,
      control = ctrl
    ),
    warning = function(w) {
      warnings_seen <<- c(warnings_seen, conditionMessage(w))
      invokeRestart("muffleWarning")
    }
  )

  s <- summary(fit)
  print(s)

  cm <- s$coefficients
  rows <- grep("^technical_expertise_tier_factor", rownames(cm))
  cat("\nCATEGORICAL EXPERTISE EFFECTS, REFERENCE TIER 0\n")
  for (row_index in rows) {
    tier <- sub("technical_expertise_tier_factor", "", rownames(cm)[row_index])
    est <- unname(cm[row_index, "Estimate"])
    se <- unname(cm[row_index, "Std. Error"])
    p <- unname(cm[row_index, "Pr(>|z|)"])
    ci <- est + c(-1, 1) * qnorm(.975) * se
    cat(sprintf(
      "tier %s: beta = %.6f, SE = %.6f, OR = %.6f, 95%% nominal Wald CI OR = [%.6f, %.6f], p = %.10g\n",
      tier, est, se, exp(est), exp(ci[1]), exp(ci[2]), p
    ))
  }

  ev <- eigen(fit$Hessian, symmetric = TRUE, only.values = TRUE)$values
  cat(sprintf("Random-intercept SD = %.6f\n", fit$stDev))
  cat(sprintf("inner random-effect max |gradient| = %.10g\n", max(abs(fit$gradient))))
  cat(sprintf("outer optimizer max |gradient| = %.10g\n", fit$optRes$info["maxgradient"]))
  cat("diagnostic status:", mixed_fit_status(fit), "\n")
  cat(sprintf("minimum Hessian eigenvalue = %.10g\n", min(ev)))
  cat(sprintf("Hessian condition number = %.10g\n", max(ev) / min(ev)))
  cat("optimizer message:", fit$optRes$message, "\n")
  cat("clmm2 convergence flag:\n")
  print(fit$convergence)

  cat("\nWARNING AUDIT\n")
  cat("Warnings captured:", length(warnings_seen), "\n")
  if (length(warnings_seen)) print(sort(table(warnings_seen), decreasing = TRUE))

  invisible(fit)
}

if (sys.nframe() == 0L) {
  args <- commandArgs(trailingOnly = TRUE)
  if (length(args) < 1) stop("Usage: Rscript clmm_primary.R /path/to/completed-response.csv")
  csv_path <- args[[1]]

  d <- read.csv(csv_path, check.names = FALSE, stringsAsFactors = FALSE)
  if (!"completed_at" %in% names(d)) {
    stop("CSV is missing required column: completed_at")
  }
  d <- d[order(d$completed_at), , drop = FALSE]

  # Pre-specified primary population: all completed responses.
  fit_primary <- fit_full(d, "PRIMARY: all completed responses")

  # Only one of the 2,690 S4 observations used the top response category. This
  # checks that the sparse final threshold is not driving the expertise result.
  fit_collapsed_top <- fit_full(
    d,
    "POST-FREEZE SENSITIVITY: S4 ratings 6 and 7 combined",
    collapse_top_category = TRUE
  )

  # Post-freeze diagnostics for the ordinal treatment of expertise and for the
  # two points at which the survey implementation was reviewed during collection.
  fit_categorical_tier <- fit_categorical(
    d,
    "POST-FREEZE DIAGNOSTIC: expertise tier as a categorical predictor"
  )
  fit_after_20 <- fit_full(
    d[-seq_len(20), , drop = FALSE],
    "POST-FREEZE SENSITIVITY: first 20 completions excluded"
  )
  fit_after_50 <- fit_full(
    d[-seq_len(50), , drop = FALSE],
    "POST-FREEZE SENSITIVITY: first 50 completions excluded"
  )

  # English-comfort sensitivity. This fit was near-converged in the frozen run;
  # the fully converged ordinal-GEE sensitivity is produced by analysis.py.
  low_eng <- tolower(trimws(as.character(d$low_english_comfort_flag))) == "true"
  fit_english <- fit_full(d[!low_eng, , drop = FALSE], "SENSITIVITY: low-English flag excluded")
}
