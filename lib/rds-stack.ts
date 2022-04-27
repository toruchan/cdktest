import { CopyOptions, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { RdsDatabaseInstance } from "./resources/rdsDatabaseInstance";

export class RdsStack extends Stack {
    public readonly rds: DatabaseInstance;
    
    constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
        super(scope, id, props)

        const rdsDatabaseInstance = new RdsDatabaseInstance(vpc);
        rdsDatabaseInstance.createResources(this);
        this.rds = rdsDatabaseInstance.rds
    }
}
