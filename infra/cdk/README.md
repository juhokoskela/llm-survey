# Production CDK Runbook

This CDK app synthesizes CloudFormation for a low-cost production deployment in
`eu-north-1`.

App Runner is not available in `eu-north-1`, so the app stack uses ECS Fargate
behind an Application Load Balancer while keeping the database in isolated
private subnets. The stack uses no NAT gateway.

## Stacks

- `LlmSurveyEcrStack`: encrypted ECR repository with scan-on-push and untagged
  image cleanup.
- `LlmSurveyProdStack`: ALB, ECS Fargate service, private RDS PostgreSQL, WAF,
  Secrets Manager, optional ACM certificate import, and VPC networking.

## Cross-account DNS

Route 53 is managed in a separate AWS account. Keep the ACM certificate in the
app account (`eu-north-1`) and validate it by adding the ACM DNS validation CNAME
in the DNS account. After validation, pass the certificate ARN to the app stack.

Request the certificate in the app account:

```sh
AWS_PROFILE=juho aws acm request-certificate \
  --region eu-north-1 \
  --domain-name survey.juhokoskela.fi \
  --validation-method DNS \
  --idempotency-token llmsurveyprod
```

Fetch the DNS validation record:

```sh
AWS_PROFILE=juho aws acm describe-certificate \
  --region eu-north-1 \
  --certificate-arn CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord"
```

Create that CNAME in the DNS account, then wait until the certificate is issued:

```sh
AWS_PROFILE=juho aws acm wait certificate-validated \
  --region eu-north-1 \
  --certificate-arn CERTIFICATE_ARN
```

## First Deploy

Bootstrap CDK once per account/region:

```sh
AWS_PROFILE=juho pnpm exec cdk bootstrap aws://ACCOUNT_ID/eu-north-1
```

Deploy the ECR repository:

```sh
AWS_PROFILE=juho pnpm infra:deploy:ecr \
  --profile juho \
  -c region=eu-north-1 \
  -c repositoryName=llm-survey
```

Build and push the production image. The script prints the full image URI; keep
the tag suffix for the app stack deploy. It builds `linux/arm64` by default to
match the ECS Fargate task architecture and avoid QEMU amd64 emulation on Apple
Silicon. It also updates the `latest` tag by default so a stack accidentally
deployed with the default `imageTag=latest` can still pull an image. Pass
`--latest false` to skip that extra tag.

```sh
IMAGE_URI=$(AWS_PROFILE=juho pnpm prod:image:push --region eu-north-1 --stack LlmSurveyEcrStack)
IMAGE_TAG="${IMAGE_URI##*:}"
```

Deploy the app stack with the issued certificate ARN. Do not pass
`hostedZoneId`/`hostedZoneName` when DNS lives in another account.

```sh
AWS_PROFILE=juho pnpm infra:deploy:app \
  --profile juho \
  -c region=eu-north-1 \
  -c repositoryName=llm-survey \
  -c imageTag="$IMAGE_TAG" \
  -c cpuArchitecture=ARM64 \
  -c domainName=survey.juhokoskela.fi \
  -c certificateArn=CERTIFICATE_ARN \
  -c researchContactEmail=research@juhokoskela.fi \
  -c privacyNoticeLastUpdated=2026-06-02
```

Create or update the external Route 53 alias after the ALB exists:

```sh
pnpm prod:dns:alias \
  --app-profile juho \
  --dns-profile DNS_ACCOUNT_PROFILE \
  --region eu-north-1 \
  --domain survey.juhokoskela.fi \
  --hosted-zone-id DNS_ACCOUNT_HOSTED_ZONE_ID
```

## Updates and Rollback

Push a new image and redeploy the app stack with the new `imageTag`.

```sh
IMAGE_URI=$(AWS_PROFILE=juho pnpm prod:image:push --region eu-north-1)
IMAGE_TAG="${IMAGE_URI##*:}"
AWS_PROFILE=juho pnpm infra:deploy:app \
  --profile juho \
  -c imageTag="$IMAGE_TAG" \
  -c cpuArchitecture=ARM64 \
  -c domainName=survey.juhokoskela.fi \
  -c certificateArn=CERTIFICATE_ARN
```

Rollback by redeploying the previous known-good image tag:

```sh
AWS_PROFILE=juho pnpm infra:deploy:app \
  --profile juho \
  -c imageTag=PREVIOUS_TAG \
  -c cpuArchitecture=ARM64 \
  -c domainName=survey.juhokoskela.fi \
  -c certificateArn=CERTIFICATE_ARN
```

To deploy an x86 image instead, push with `--platform linux/amd64` and deploy
with `-c cpuArchitecture=X86_64`.

## Verification

```sh
curl -fsS https://survey.juhokoskela.fi/api/ready
AWS_PROFILE=juho aws ecs describe-services \
  --region eu-north-1 \
  --cluster "$(AWS_PROFILE=juho aws cloudformation describe-stacks --region eu-north-1 --stack-name LlmSurveyProdStack --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue | [0]" --output text)" \
  --services "$(AWS_PROFILE=juho aws cloudformation describe-stacks --region eu-north-1 --stack-name LlmSurveyProdStack --query "Stacks[0].Outputs[?OutputKey=='ServiceName'].OutputValue | [0]" --output text)"
```

Confirm in AWS:

- RDS is not public, has deletion protection, backups, encryption, and SSL
  parameter group enabled.
- WAF is associated with the ALB.
- ECS task plain environment variables do not contain database credentials or
  `RATE_LIMIT_SECRET`.
- ECS task security group only allows inbound container traffic from the ALB
  security group.

## Destroy

The RDS instance uses snapshot removal policy and deletion protection. To remove
the stack, first disable deletion protection intentionally, then destroy the app
stack. The ECR repository is retained by default.
