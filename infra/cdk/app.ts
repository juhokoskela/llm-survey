import * as cdk from "aws-cdk-lib";

import { LlmSurveyAppStack } from "./lib/app-stack";
import { LlmSurveyEcrStack } from "./lib/ecr-stack";

const app = new cdk.App();

const region = contextString("region", "eu-north-1");
const account = optionalContextString("account") ?? process.env.CDK_DEFAULT_ACCOUNT;
const repositoryName = contextString("repositoryName", "llm-survey");
const imageTag = contextString("imageTag", "latest");
const cpuArchitecture = contextString("cpuArchitecture", "ARM64");
const domainName = contextString("domainName", "survey.juhokoskela.fi");
const certificateArn = contextString("certificateArn", "");
const hostedZoneId = contextString("hostedZoneId", "");
const hostedZoneName = contextString(
  "hostedZoneName",
  parentZoneName(domainName),
);
const researchContactEmail = contextString(
  "researchContactEmail",
  "research@juhokoskela.fi",
);
const privacyNoticeLastUpdated = contextString(
  "privacyNoticeLastUpdated",
  "2026-06-02",
);
const apiRateLimit = Number(contextString("apiRateLimit", "600"));

validateDeployContext({
  account,
  region,
  domainName,
  certificateArn,
  apiRateLimit,
});

const env = {
  account,
  region,
};

new LlmSurveyEcrStack(app, "LlmSurveyEcrStack", {
  env,
  repositoryName,
});

new LlmSurveyAppStack(app, "LlmSurveyProdStack", {
  env,
  repositoryName,
  imageTag,
  cpuArchitecture,
  domainName,
  certificateArn,
  hostedZoneId,
  hostedZoneName,
  researchContactEmail,
  privacyNoticeLastUpdated,
  apiRateLimit,
});

function contextString(name: string, defaultValue: string) {
  const value = app.node.tryGetContext(name);
  return value === undefined || value === null ? defaultValue : String(value);
}

function optionalContextString(name: string) {
  const value = app.node.tryGetContext(name);
  return value === undefined || value === null || value === "" ? undefined : String(value);
}

function parentZoneName(domainNameValue: string) {
  const labels = domainNameValue.split(".").filter(Boolean);
  return labels.length > 1 ? labels.slice(1).join(".") : domainNameValue;
}

function validateDeployContext(options: {
  account?: string;
  region: string;
  domainName: string;
  certificateArn: string;
  apiRateLimit: number;
}) {
  if (isPlaceholder(options.domainName)) {
    throw new Error(
      "domainName must be the real production hostname, not an example or placeholder value.",
    );
  }

  if (!Number.isFinite(options.apiRateLimit) || options.apiRateLimit < 1) {
    throw new Error("apiRateLimit must be a positive number.");
  }

  if (!options.certificateArn) {
    return;
  }

  const certificate = parseAcmCertificateArn(options.certificateArn);
  if (!certificate) {
    throw new Error("certificateArn must be a valid ACM certificate ARN.");
  }

  if (certificate.region !== options.region) {
    throw new Error(
      `certificateArn is in ${certificate.region}, but this stack deploys to ${options.region}.`,
    );
  }

  if (options.account && certificate.account !== options.account) {
    throw new Error(
      `certificateArn is in account ${certificate.account}, but this stack deploys to account ${options.account}. Request/import the certificate in the app account.`,
    );
  }
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["example", "placeholder", "replace", "todo"].some((placeholder) =>
    normalized.includes(placeholder),
  );
}

function parseAcmCertificateArn(arn: string) {
  const match = /^arn:aws:acm:([^:]+):(\d{12}):certificate\/.+$/.exec(arn);
  if (!match) return null;
  return {
    region: match[1],
    account: match[2],
  };
}
