import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Cluster, FargateTaskDefinition, CfnService, FargateService } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Duration } from "aws-cdk-lib";
import { CfnLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Schedule } from "aws-cdk-lib/aws-events"

export class AlbFargateService extends Resource {
    public service: ApplicationLoadBalancedFargateService
  
    private readonly cluster: Cluster
    private readonly taskDef: FargateTaskDefinition
    private readonly sgGroups: [SecurityGroup]
    private readonly vpc: Vpc
  
    constructor(
      cluster: Cluster,
      taskDef: FargateTaskDefinition,
      sgGroups: [SecurityGroup],
      vpc: Vpc
    ) {
      super()
      this.cluster = cluster
      this.taskDef = taskDef
      this.sgGroups = sgGroups
      this.vpc = vpc
    }
  
    createResources(scope: Construct): void {
        const envType = scope.node.tryGetContext("envType");

        const zoneName = scope.node.tryGetContext("zoneName");
        const hostedZoneId = scope.node.tryGetContext("hostedZoneId");

        const domainZone = HostedZone.fromHostedZoneAttributes(scope, "host", {
            hostedZoneId,
            zoneName,
        });
    
        // ACM
        const certificate = Certificate.fromCertificateArn(
            scope,
            "Cert",
            scope.node.tryGetContext(`${envType}Certificate`)
        );
    
        let desiredCount = 1
        if (envType == 'staging') {
            desiredCount = 1
        }
    
        this.service = new ApplicationLoadBalancedFargateService(scope, "Service", {
            cluster: this.cluster,
            taskDefinition: this.taskDef,
            desiredCount,
            minHealthyPercent: 50,
            maxHealthyPercent: 500,
            assignPublicIp: true,
            certificate,
            sslPolicy: SslPolicy.RECOMMENDED,
            domainName: zoneName,
            domainZone,
            redirectHTTP: true,
            publicLoadBalancer: true,
            securityGroups: this.sgGroups,
            taskSubnets: this.cluster.vpc.selectSubnets({
                subnetGroupName: "app-public",
            }),
            healthCheckGracePeriod: Duration.seconds(300),
            circuitBreaker: {
            rollback: true,
            },
        });
    
        const cfnLoadBalancer = this.service.loadBalancer.node.defaultChild as CfnLoadBalancer
        cfnLoadBalancer.subnets = this.cluster.vpc.selectSubnets({ onePerAz: true, subnetGroupName: 'app-public'}).subnetIds

        if(envType === 'staging') {
            this.service.node.children.filter(isFargateService).forEach((fargateService) => {
                fargateService.node.children.filter(isCfnService).forEach((cfnService) => {
                    cfnService.addOverride("Properties.EnableExecuteCommand", true);
                });
            });

            function isFargateService(cdkChild: any): cdkChild is FargateService {
                return cdkChild instanceof FargateService;
            }
                
            function isCfnService(cdkChild: any): cdkChild is CfnService {
                return cdkChild instanceof CfnService;
            }
        }
    
        this.service.targetGroup.healthCheck = {
            path: "/",
            healthyHttpCodes: "200",
            unhealthyThresholdCount: 5,
            timeout: Duration.seconds(15),
            interval: Duration.seconds(120),
        };

        const autoScale = this.service.service.autoScaleTaskCount({
            minCapacity: 1,
            maxCapacity: 10,
        });

        autoScale.scaleOnSchedule('PrescaleInTheMorning', {
            schedule: Schedule.cron({ hour: '18', minute: '0' }),
            minCapacity: 1,
        });

        autoScale.scaleOnSchedule('AllowDownscalingAtNight', {
            schedule: Schedule.cron({ hour: '19', minute: '20' }),
            minCapacity: 5
        });
    }
  }
