import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const appProfile = args.appProfile ?? "juho";
const dnsProfile = args.dnsProfile ?? appProfile;
const region = args.region ?? "eu-north-1";
const stack = args.stack ?? "LlmSurveyProdStack";
const hostedZoneId = required(args.hostedZoneId, "--hosted-zone-id");
const domain = required(args.domain, "--domain");
const loadBalancerDnsName =
  args.loadBalancerDnsName ??
  stackOutput(stack, "LoadBalancerDnsName", region, appProfile);
const loadBalancerHostedZoneId =
  args.loadBalancerHostedZoneId ??
  stackOutput(stack, "LoadBalancerCanonicalHostedZoneId", region, appProfile);

const changeBatchPath = join(
  tmpdir(),
  `llm-survey-external-dns-${Date.now()}.json`,
);
writeFileSync(
  changeBatchPath,
  JSON.stringify(
    {
      Changes: [
        {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: ensureTrailingDot(domain),
            Type: "A",
            AliasTarget: {
              DNSName: ensureTrailingDot(loadBalancerDnsName),
              HostedZoneId: loadBalancerHostedZoneId,
              EvaluateTargetHealth: true,
            },
          },
        },
      ],
    },
    null,
    2,
  ),
);

const result = awsJson(
  [
    "route53",
    "change-resource-record-sets",
    "--hosted-zone-id",
    hostedZoneId,
    "--change-batch",
    `file://${changeBatchPath}`,
  ],
  dnsProfile,
);

console.log(
  JSON.stringify(
    {
      domain,
      loadBalancerDnsName,
      loadBalancerHostedZoneId,
      route53ChangeId: result.ChangeInfo?.Id,
      route53ChangeStatus: result.ChangeInfo?.Status,
    },
    null,
    2,
  ),
);

function stackOutput(stackName, outputKey, awsRegion, profile) {
  const result = aws(
    [
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      stackName,
      "--region",
      awsRegion,
      "--query",
      `Stacks[0].Outputs[?OutputKey=='${outputKey}'].OutputValue | [0]`,
      "--output",
      "text",
    ],
    profile,
  );
  const value = result.stdout.trim();

  if (!value || value === "None") {
    throw new Error(`Could not resolve ${outputKey} from ${stackName}.`);
  }

  return value;
}

function awsJson(commandArgs, profile) {
  const result = aws([...commandArgs, "--output", "json"], profile);
  return JSON.parse(result.stdout);
}

function aws(commandArgs, profile) {
  const result = spawnSync(
    "aws",
    profile ? [...commandArgs, "--profile", profile] : commandArgs,
    {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "inherit"],
    },
  );

  if (result.status !== 0) {
    throw new Error(`aws ${commandArgs.join(" ")} failed.`);
  }

  return result;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = value;
      index += 1;
    }
  }
  return parsed;
}

function required(value, flag) {
  if (!value) {
    throw new Error(`${flag} is required.`);
  }
  return value;
}

function ensureTrailingDot(value) {
  return value.endsWith(".") ? value : `${value}.`;
}
