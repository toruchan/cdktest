import { Resource } from "./abstract/resource";
import { Vpc, BastionHostLinux, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { CfnOutput, Aws } from 'aws-cdk-lib';
import { Construct } from "constructs";
export class BastionHost extends Resource {
    private readonly vpc: Vpc;
    private readonly bastionSg: SecurityGroup;

    constructor(vpc: Vpc, bastionSg: SecurityGroup) {
        super();
        this.vpc = vpc;
        this.bastionSg = bastionSg;
    }

    createResources(scope: Construct) {
        const envType = scope.node.tryGetContext('envType');
        const profile = scope.node.tryGetContext('systemName');
        
        const bastionHost = new BastionHostLinux(scope, 'BastionHostLinux', {
            vpc: this.vpc,
            securityGroup: this.bastionSg,
            subnetSelection: this.vpc.selectSubnets({ onePerAz: true, subnetGroupName: 'app-public' }),
            instanceName: `${envType}-bastion`
        });

        const createSshKeyCommand = `ssh-keygen -t rsa -f ${profile}_${envType}_rsa_key -m pem`;
        const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${Aws.REGION} --instance-id ${bastionHost.instanceId} --availability-zone ${bastionHost.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://${profile}_${envType}_rsa_key.pub ${profile ? `--profile ${profile}` : ''}`;
        const sshCommand = `ssh -o "IdentitiesOnly=yes" -i ${profile}_${envType}_rsa_key ec2-user@${bastionHost.instancePublicDnsName}`;
                
        new CfnOutput(scope, 'CreateSshKeyCommand', { value: createSshKeyCommand });
        new CfnOutput(scope, 'PushSshKeyCommand', { value: pushSshKeyCommand });
        new CfnOutput(scope, 'SshCommand', { value: sshCommand});
    }
}