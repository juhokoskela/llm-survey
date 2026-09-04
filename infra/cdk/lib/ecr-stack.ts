import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Repository, RepositoryEncryption, TagStatus } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export type LlmSurveyEcrStackProps = StackProps & {
  repositoryName: string;
};

export class LlmSurveyEcrStack extends Stack {
  constructor(scope: Construct, id: string, props: LlmSurveyEcrStackProps) {
    super(scope, id, props);

    const repository = new Repository(this, "Repository", {
      repositoryName: props.repositoryName,
      imageScanOnPush: true,
      encryption: RepositoryEncryption.AES_256,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    repository.addLifecycleRule({
      tagStatus: TagStatus.UNTAGGED,
      maxImageAge: Duration.days(14),
      description: "Remove untagged images after 14 days.",
    });

    new CfnOutput(this, "RepositoryName", {
      value: repository.repositoryName,
    });
    new CfnOutput(this, "RepositoryUri", {
      value: repository.repositoryUri,
    });
    new CfnOutput(this, "RepositoryArn", {
      value: repository.repositoryArn,
    });
  }
}
