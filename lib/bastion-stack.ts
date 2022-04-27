import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Vpc,
    SecurityGroup,
    Peer,
    Port,
} from 'aws-cdk-lib/aws-ec2';
import { BastionHost } from './resources/bastionHost';

export class BastionStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
    super(scope, id, props);

    let bastionSg = new SecurityGroup(this, "bastionSg", { vpc, allowAllOutbound: true });
    bastionSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));

    const bastionHost = new BastionHost(vpc, bastionSg)
    bastionHost.createResources(this)
  }
}