import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { Role } from "aws-cdk-lib/aws-iam";
import { FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";

export class TaskDefinition extends Resource {
    public taskDef: FargateTaskDefinition
    private readonly ecsTaskExecutionRole: Role

    constructor(ecsTaskExecutionRole: Role) {
        super()
        this.ecsTaskExecutionRole = ecsTaskExecutionRole
    }
    createResources(scope: Construct) {
        this.taskDef = new FargateTaskDefinition(scope, "taskDefinition", {
          family: this.createResourceName(scope, "cdktest-app-nginx"),
          cpu: 512,
          memoryLimitMiB: 2048,
          executionRole: this.ecsTaskExecutionRole,
          taskRole: this.ecsTaskExecutionRole,
        })
      }

}
