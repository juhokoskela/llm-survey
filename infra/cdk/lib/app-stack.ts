import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

export type LlmSurveyAppStackProps = StackProps & {
  repositoryName: string;
  imageTag: string;
  cpuArchitecture: string;
  domainName: string;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
  researchContactEmail: string;
  privacyNoticeLastUpdated: string;
  apiRateLimit: number;
};

export class LlmSurveyAppStack extends Stack {
  constructor(scope: Construct, id: string, props: LlmSurveyAppStackProps) {
    super(scope, id, props);

    const repository = ecr.Repository.fromRepositoryName(
      this,
      "Repository",
      props.repositoryName,
    );

    const vpc = new ec2.Vpc(this, "Vpc", {
      availabilityZones: [`${this.region}a`, `${this.region}b`],
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      "LoadBalancerSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
        description: "Public HTTPS access to the survey load balancer.",
      },
    );
    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "HTTP redirect",
    );
    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "HTTPS",
    );

    const appSecurityGroup = new ec2.SecurityGroup(this, "AppSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Survey container access from the load balancer only.",
    });
    appSecurityGroup.addIngressRule(
      loadBalancerSecurityGroup,
      ec2.Port.tcp(3000),
      "ALB to survey container",
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc,
        allowAllOutbound: false,
        description: "PostgreSQL access only from the survey containers.",
      },
    );
    databaseSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      "Survey containers to PostgreSQL",
    );

    const dbCredentials = new secretsmanager.Secret(this, "DbCredentials", {
      description: "LLM survey production database credentials.",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "llmsurvey" }),
        generateStringKey: "password",
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    const rateLimitSecret = new secretsmanager.Secret(this, "RateLimitSecret", {
      description: "LLM survey HMAC key for process-local rate-limit identifiers.",
      generateSecretString: {
        passwordLength: 48,
        excludePunctuation: true,
      },
    });

    const postgresEngine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.of("18.4", "18"),
    });
    const databaseParameterGroup = new rds.ParameterGroup(
      this,
      "DatabaseParameterGroup",
      {
        engine: postgresEngine,
        parameters: {
          "rds.force_ssl": "1",
        },
      },
    );

    const database = new rds.DatabaseInstance(this, "Database", {
      engine: postgresEngine,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      databaseName: "llm_survey",
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: false,
      publiclyAccessible: false,
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      autoMinorVersionUpgrade: true,
      parameterGroup: databaseParameterGroup,
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    const manageRoute53 = !props.certificateArn && props.hostedZoneId && props.hostedZoneName;
    const hostedZone =
      manageRoute53
        ? route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.hostedZoneName,
          })
        : null;
    const certificate =
      props.certificateArn
        ? acm.Certificate.fromCertificateArn(
            this,
            "Certificate",
            props.certificateArn,
          )
        : hostedZone
          ? new acm.Certificate(this, "Certificate", {
              domainName: props.domainName,
              validation: acm.CertificateValidation.fromDns(hostedZone),
            })
          : null;

    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      "LoadBalancer",
      {
        vpc,
        internetFacing: true,
        securityGroup: loadBalancerSecurityGroup,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      },
    );

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    const logGroup = new logs.LogGroup(this, "AppLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          cpuArchitecture: cpuArchitecture(props.cpuArchitecture),
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      },
    );

    const container = taskDefinition.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromEcrRepository(repository, props.imageTag),
      portMappings: [{ containerPort: 3000 }],
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: "app",
      }),
      environment: {
        NODE_ENV: "production",
        DATABASE_HOST: database.dbInstanceEndpointAddress,
        DATABASE_PORT: database.dbInstanceEndpointPort,
        DATABASE_NAME: "llm_survey",
        DATABASE_SSL_MODE: "require",
        RESEARCH_CONTACT_EMAIL: props.researchContactEmail,
        PRIVACY_NOTICE_LAST_UPDATED: props.privacyNoticeLastUpdated,
        STUDY_BASE_URL: `https://${props.domainName}`,
        RUN_MIGRATIONS_ON_STARTUP: "true",
      },
      secrets: {
        DATABASE_CREDENTIALS_JSON: ecs.Secret.fromSecretsManager(dbCredentials),
        RATE_LIMIT_SECRET: ecs.Secret.fromSecretsManager(rateLimitSecret),
      },
    });

    repository.grantPull(taskDefinition.obtainExecutionRole());
    dbCredentials.grantRead(taskDefinition.obtainExecutionRole());
    rateLimitSecret.grantRead(taskDefinition.obtainExecutionRole());

    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [appSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });
    service.node.addDependency(database);

    const httpListener = loadBalancer.addListener("HttpListener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      ...(certificate
        ? {
            defaultAction: elbv2.ListenerAction.redirect({
              protocol: "HTTPS",
              port: "443",
              permanent: true,
            }),
          }
        : {}),
    });

    const appListener = certificate
      ? loadBalancer.addListener("HttpsListener", {
          port: 443,
          protocol: elbv2.ApplicationProtocol.HTTPS,
          certificates: [certificate],
        })
      : httpListener;

    appListener.addTargets("AppTargets", {
      targets: [
        service.loadBalancerTarget({
          containerName: container.containerName,
          containerPort: 3000,
        }),
      ],
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: "/api/ready",
        healthyHttpCodes: "200",
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
    });

    if (hostedZone) {
      new route53.ARecord(this, "DomainRecord", {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(loadBalancer),
        ),
      });
    }

    const scalableService = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    });
    scalableService.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.minutes(5),
      scaleOutCooldown: Duration.minutes(2),
    });

    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: visibility("llm-survey-web-acl"),
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 0,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: visibility("llm-survey-common-rules"),
        },
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          visibilityConfig: visibility("llm-survey-known-bad-inputs"),
        },
        {
          name: "ApiRateLimit",
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: props.apiRateLimit,
              aggregateKeyType: "IP",
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: "STARTS_WITH",
                  searchString: "/api/",
                  textTransformations: [{ priority: 0, type: "NONE" }],
                },
              },
            },
          },
          visibilityConfig: visibility("llm-survey-api-rate-limit"),
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, "WebAclAssociation", {
      resourceArn: loadBalancer.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    new CfnOutput(this, "ImageIdentifier", {
      value: repository.repositoryUriForTag(props.imageTag),
    });
    new CfnOutput(this, "LoadBalancerDnsName", {
      value: loadBalancer.loadBalancerDnsName,
    });
    new CfnOutput(this, "LoadBalancerCanonicalHostedZoneId", {
      value: loadBalancer.loadBalancerCanonicalHostedZoneId,
    });
    new CfnOutput(this, "ServiceName", { value: service.serviceName });
    new CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new CfnOutput(this, "DatabaseEndpoint", {
      value: database.dbInstanceEndpointAddress,
    });
    new CfnOutput(this, "WebAclArn", { value: webAcl.attrArn });
    new CfnOutput(this, "DomainName", { value: props.domainName });
    new CfnOutput(this, "HostedZoneId", {
      value: props.hostedZoneId || "not-set",
    });
    new CfnOutput(this, "CertificateArn", {
      value: props.certificateArn || "managed-by-this-stack-or-not-set",
    });
  }
}

function visibility(metricName: string): wafv2.CfnWebACL.VisibilityConfigProperty {
  return {
    cloudWatchMetricsEnabled: true,
    metricName,
    sampledRequestsEnabled: true,
  };
}

function cpuArchitecture(value: string): ecs.CpuArchitecture {
  const normalized = value.trim().toUpperCase();

  if (normalized === "X86_64" || normalized === "AMD64") {
    return ecs.CpuArchitecture.X86_64;
  }

  if (normalized === "ARM64" || normalized === "AARCH64") {
    return ecs.CpuArchitecture.ARM64;
  }

  throw new Error("cpuArchitecture must be ARM64 or X86_64.");
}
