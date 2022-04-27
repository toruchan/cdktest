import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { VpcSet } from './resources/vpcSet';

export class VpcStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpcSet = new VpcSet();
    vpcSet.createResources(this);
    this.vpc = vpcSet.vpc
  }
}