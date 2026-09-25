#!/usr/bin/env Rscript
# Run after adversarial.py; all outputs remain private.
args <- commandArgs(trailingOnly=TRUE)
if (length(args) != 1) stop("Usage: Rscript clmm_floor_checks.R /private/audit-directory")
script <- normalizePath(sub("^--file=", "", grep("^--file=", commandArgs(), value=TRUE)[1]))
repository <- normalizePath(file.path(dirname(script), "../.."))
base <- normalizePath(args[[1]], mustWork=TRUE)
if (base == repository || startsWith(base, paste0(repository, .Platform$file.sep))) {
  stop("The audit directory must be outside the repository")
}
outdir <- file.path(base, "mixed-floor-checks")
if (dir.exists(outdir)) stop("mixed-floor-checks already exists; use a new audit directory")
Sys.umask("0077")
dir.create(outdir, mode="0700")
source(file.path(dirname(script), "clmm_primary.R"))
writeLines(c(R.version.string, paste("ordinal", packageVersion("ordinal"))),
           file.path(outdir, "runtime.txt"))
d <- read.csv(file.path(base, "completed.csv"), check.names=FALSE)
d <- d[order(d$completed_at),]
l <- make_long(d)
results <- list()
for(label in c('without_neutral','without_neutral_empathy')) {
 excluded <- if(label=='without_neutral') 'neutral_helpful' else c('neutral_helpful','empathic_response')
 dat <- droplevels(l[!l$scenario_type %in% excluded,])
 for(nagq in c(7,21)) {
 cat('START',label,nagq,'\n');flush.console()
 fit <- withCallingHandlers(clmm2(S4 ~ technical_expertise_tier_c + scenario_type + scenario_position_c + usage_intensity_c + recruitment_source,random=session_id,data=dat,Hess=TRUE,nAGQ=nagq,control=clmm2.control(method='ucminf',grtol=1e-5,maxIter=200,gradTol=1e-6,maxLineIter=100,innerCtrl='warnOnly')), warning=function(w) {
 write(conditionMessage(w), file=file.path(outdir, paste0(label, '-', nagq, '-warnings.txt')), append=TRUE)
 invokeRestart('muffleWarning')
 })
 status <- mixed_fit_status(fit)
 cf <- summary(fit)$coefficients
 beta <- cf['technical_expertise_tier_c',1];se <- cf['technical_expertise_tier_c',2]
 results[[paste(label,nagq)]] <- data.frame(label=label,nagq=nagq,status=status,OR=exp(beta),low=if(status=='ACCEPTED')exp(beta-1.96*se) else NA,high=if(status=='ACCEPTED')exp(beta+1.96*se) else NA,sd=as.numeric(fit$stDev),outer=unname(fit$optRes$info['maxgradient']),hessian_min=min(eigen(fit$Hessian,symmetric=TRUE)$values))
 write.csv(do.call(rbind,results),file.path(outdir,'fit-summary.csv'),row.names=FALSE)
 print(results[[paste(label,nagq)]]);flush.console()
 }
}
