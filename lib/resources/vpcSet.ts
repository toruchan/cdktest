import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Resource } from "./abstract/resource";
import { Tags } from "aws-cdk-lib";

export class VpcSet extends Resource {
  public vpc: Vpc;

  constructor() {
    super();
  }

  createResources(scope: Construct) {
    interface subnetConfObj {
      cidrMask: number;
      name: string;
      subnetType: SubnetType;
    }
    
    let subnetConf: subnetConfObj[];

    subnetConf = [
      {
        cidrMask: 27,
        name: "app-public",
        subnetType: SubnetType.PUBLIC,
      },
      {
        cidrMask: 27,
        name: "tracker-public",
        subnetType: SubnetType.PUBLIC
      },
      {
        cidrMask: 27,
        name: "rds",
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      {
        cidrMask: 27,
        name: "elasticache",
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    ];

    this.vpc = new Vpc(scope, "vpc", {
      cidr: "172.16.0.0/17",
      natGateways: 0,  
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      subnetConfiguration: subnetConf,
    });

    Tags.of(this.vpc).add("Name", this.createResourceName(scope, "vpc"));
  }
}
