import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class EcsIam extends Resource {
    public ecsTaskExecutionRole: Role;

    constructor() {
        super();
      }

      createResources(scope: Construct) {
        const envType = scope.node.tryGetContext("envType");

        const uniqueName: string = this.createResourceName(
          scope,
          `${envType}-ecs-task-execution-role`
        );

        this.ecsTaskExecutionRole = new Role(scope, uniqueName, {
          roleName: uniqueName,
          assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
          managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName(
              "service-role/AmazonECSTaskExecutionRolePolicy"
            ),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
          ],
        });

        // ecs exec 用のRoleも入れてる
        this.ecsTaskExecutionRole.addToPrincipalPolicy(
            new PolicyStatement({
                actions: [
                    "ecs:ListClusters",
                    "ecs:ListContainerInstances",
                    "ecs:DescribeContainerInstances",
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel",
                ],
                resources: ["*"],
            })
        )
      }
}
