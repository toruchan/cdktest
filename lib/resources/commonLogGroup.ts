import { Resource } from "./abstract/resource";
import { Construct } from "constructs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy } from "aws-cdk-lib";

export class CommonLogGroup extends Resource {
    public logGrp: LogGroup;
    private readonly type: string;

    constructor(type: string) {
        super();
        this.type = type
    }

    createResources(scope: Construct): void {
        const envType = scope.node.tryGetContext("envType")

        this.logGrp = new LogGroup(scope, `${this.type}logGroup`, {
          logGroupName: `${envType}/${this.type}/`,
          removalPolicy: RemovalPolicy.DESTROY,
        })
    }
}
