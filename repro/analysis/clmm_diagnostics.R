#!/usr/bin/env Rscript
# Run after adversarial.py. Participant-level inputs and outputs remain private.
suppressPackageStartupMessages(library(ordinal))
args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1) stop("Usage: Rscript clmm_diagnostics.R /private/audit-directory")
script <- normalizePath(sub("^--file=", "", grep("^--file=", commandArgs(), value=TRUE)[1]))
repository <- normalizePath(file.path(dirname(script), "../.."))
base <- normalizePath(args[[1]], mustWork=TRUE)
if (base == repository || startsWith(base, paste0(repository, .Platform$file.sep))) {
  stop("The audit directory must be outside the repository")
}
outdir <- file.path(base, "mixed-models")
if (dir.exists(outdir)) stop("mixed-models already exists; use a new audit directory")
dir.create(outdir, mode="0700")
Sys.umask("0077")
source(file.path(dirname(script), "clmm_primary.R"))
d <- read.csv(file.path(base,"completed.csv"),check.names=FALSE,stringsAsFactors=FALSE)
d <- d[order(d$completed_at),,drop=FALSE]
membership <- read.csv(file.path(base,"sample-membership.csv"),check.names=FALSE)
writeLines(c(R.version.string,paste("ordinal",packageVersion("ordinal"))),
           file.path(outdir,"runtime.txt"))

run_fit <- function(name, dat=d, nagq=7, starting=NULL, extra=NULL) {
  cat("START",name,"N",nrow(dat),"AGHQ",nagq,"\n"); flush.console()
  long <- make_long(dat)
  formula <- S4 ~ technical_expertise_tier_c + scenario_type + scenario_position_c +
    usage_intensity_c + recruitment_source
  if (!is.null(extra)) {
    score <- if (extra=="knowledge") dat$technical_knowledge_score else
      as.integer(tolower(as.character(dat$T1_next_token_generation))=="true") +
      as.integer(tolower(as.character(dat$T3_rlhf_shapes_behavior))=="true")
    long$score <- score[match(as.character(long$session_id),dat$session_id)]
    formula <- update(formula,.~.+score)
  }
  captured <- character()
  fit_args <- list(location=formula,random=quote(session_id),data=long,
    link="logistic",threshold="flexible",Hess=TRUE,nAGQ=nagq,
    control=clmm2.control(method="ucminf",grtol=1e-5,maxIter=200,gradTol=1e-6,
                         maxLineIter=100,innerCtrl="warnOnly"))
  if (!is.null(starting)) fit_args$start <- starting
  result <- tryCatch(withCallingHandlers({
    fit <- do.call(clmm2,fit_args)
    coefficients <- summary(fit)$coefficients
    status <- mixed_fit_status(fit)
    ev <- eigen(fit$Hessian,symmetric=TRUE,only.values=TRUE)$values
    beta <- coefficients["technical_expertise_tier_c",1]
    se <- coefficients["technical_expertise_tier_c",2]
    write.csv(coefficients,file.path(outdir,paste0(name,"-coefficients-nominal.csv")))
    summary <- data.frame(name=name,n=nrow(dat),nagq=nagq,status=status,
      beta=beta,se=se,OR=exp(beta),
      CI_low=if(status=="ACCEPTED")exp(beta-qnorm(.975)*se) else NA_real_,
      CI_high=if(status=="ACCEPTED")exp(beta+qnorm(.975)*se) else NA_real_,
      p=if(status=="ACCEPTED")2*pnorm(-abs(beta/se)) else NA_real_,
      inner_gradient=max(abs(fit$gradient)),
      outer_gradient=as.numeric(fit$optRes$info["maxgradient"]),outer_tolerance=1e-5,
      min_hessian_eigenvalue=min(ev),hessian_condition=max(ev)/min(ev),
      logLik=as.numeric(logLik(fit)),random_intercept_sd=as.numeric(fit$stDev),
      optimizer_message=fit$optRes$message)
    write.csv(summary,file.path(outdir,paste0(name,"-summary.csv")),row.names=FALSE)
    cat("DONE",name,status,"OR",exp(beta),"\n"); flush.console()
    fit
  },warning=function(w){captured<<-c(captured,conditionMessage(w));invokeRestart("muffleWarning")}),
  error=function(e){
    writeLines(conditionMessage(e),file.path(outdir,paste0(name,"-error.txt")))
    cat("ERROR",name,"\n");NULL
  })
  writeLines(captured,file.path(outdir,paste0(name,"-warnings.txt")))
  result
}

start_vector <- function(fit) if(is.null(fit)) NULL else unname(fit$optRes$par)
primary <- run_fit("full_aghq7")
q11 <- run_fit("full_aghq11_warm",nagq=11,starting=start_vector(primary))
q15 <- run_fit("full_aghq15_warm",nagq=15,starting=start_vector(q11))
q21 <- run_fit("full_aghq21_warm",nagq=21,starting=start_vector(q15))
run_fit("full_aghq21_cold",nagq=21)
if(!is.null(q21)) run_fit("full_aghq21_perturbed",nagq=21,starting=start_vector(q21)+0.1)

samples <- c("attention_pass","comprehension_pass","very_fast_excluded","intended_s4",
             "intended_s4_s2","legacy_composite_unambiguous",
             "largest_recruitment_source_excluded","corrected_technical_unambiguous",
             "english","knowledge","factual")
run_sample <- function(sample) {
  extra <- if(sample %in% c("knowledge","factual")) sample else NULL
  dat <- if(!is.null(extra)) d else {
    ids <- membership$session_id[as.logical(membership[[sample]])]
    d[d$session_id %in% ids,,drop=FALSE]
  }
  fit <- run_fit(paste0(sample,"_aghq7"),dat=dat,extra=extra)
  if(is.null(fit) || mixed_fit_status(fit)!="ACCEPTED") {
    run_fit(paste0(sample,"_aghq21"),dat=dat,nagq=21,extra=extra)
  }
  NULL
}
# Independent fits share no output filenames. Windows runs them sequentially.
invisible(parallel::mclapply(samples,run_sample,
          mc.cores=if(.Platform$OS.type=="windows")1L else 3L))
paths <- list.files(outdir,pattern="-summary.csv$",full.names=TRUE)
summaries <- lapply(paths,read.csv,stringsAsFactors=FALSE)
write.csv(do.call(rbind,summaries),file.path(outdir,"fit-summary.csv"),row.names=FALSE)
cat("MIXED-MODEL DIAGNOSTICS COMPLETE; inspect fit-summary.csv for acceptance status\n")
