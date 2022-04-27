import { Resource } from "../abstract/resource";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Tags } from "aws-cdk-lib";

export class EcsCluster extends Resource {
  public cluster: Cluster;

  private readonly vpc: Vpc;

  constructor(vpc: Vpc) {
    super();
    this.vpc = vpc;
  }

  createResources(scope: Construct) {
    this.cluster = new Cluster(scope, "cluster", {
      vpc: this.vpc,
      clusterName: this.createResourceName(scope, "cluster")
    });

    Tags.of(this.cluster).add(
      "cdktest",
      this.createResourceName(scope, "cluster")
    );
  }
}
