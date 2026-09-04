import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const region = args.region ?? "eu-north-1";
const stack = args.stack ?? "LlmSurveyEcrStack";
const tag = args.tag ?? timestampTag();
const platform = args.platform ?? "linux/arm64";
const repositoryUri =
  args.repositoryUri ?? stackOutput(stack, "RepositoryUri", region);
const registry = repositoryUri.split("/")[0];
const image = `${repositoryUri}:${tag}`;
const alsoTagLatest = args.latest !== "false" && tag !== "latest";

run("aws", ["ecr", "get-login-password", "--region", region], {
  captureStdout: true,
  pipeTo: ["docker", ["login", "--username", "AWS", "--password-stdin", registry]],
});
run("docker", [
  "buildx",
  "build",
  "--platform",
  platform,
  "--target",
  "runner",
  "--tag",
  image,
  ...(alsoTagLatest ? ["--tag", `${repositoryUri}:latest`] : []),
  "--push",
  ".",
]);

console.error(
  alsoTagLatest
    ? `Pushed ${image} and ${repositoryUri}:latest`
    : `Pushed ${image}`,
);
console.log(image);

function stackOutput(stackName, outputKey, awsRegion) {
  const result = run(
    "aws",
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
    { captureStdout: true },
  );

  const value = result.stdout.trim();
  if (!value || value === "None") {
    throw new Error(`Could not resolve ${outputKey} from ${stackName}.`);
  }
  return value;
}

function run(command, commandArgs, options = {}) {
  if (options.pipeTo) {
    const source = spawnSync(command, commandArgs, {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "inherit"],
    });
    if (source.status !== 0) {
      throw new Error(`${command} ${commandArgs.join(" ")} failed.`);
    }
    const [target, targetArgs] = options.pipeTo;
    const piped = spawnSync(target, targetArgs, {
      input: source.stdout,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
    });
    if (piped.status !== 0) {
      throw new Error(`${target} ${targetArgs.join(" ")} failed.`);
    }
    return source;
  }

  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    stdio: options.captureStdout ? ["inherit", "pipe", "inherit"] : "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed.`);
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

function timestampTag() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");
}
