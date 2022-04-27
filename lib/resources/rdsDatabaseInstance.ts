import { Resource } from "./abstract/resource";
import { Construct } from "constructs";
import {
  Vpc, 
  SecurityGroup,
  InstanceSize,
  InstanceType,
  InstanceClass,
  Peer,
  Port 
} from "aws-cdk-lib/aws-ec2";

import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  Credentials,
  ParameterGroup
} from "aws-cdk-lib/aws-rds";

export class RdsDatabaseInstance extends Resource {
 
    private readonly vpc: Vpc;
    public rds: DatabaseInstance;

    constructor(vpc: Vpc) {
      super();
      this.vpc = vpc;
    }
    
    createResources(scope: Construct) {
      const envType = scope.node.tryGetContext('envType');
      const systemName = scope.node.tryGetContext('systemName');

      const dbSg = new SecurityGroup(scope, "rdsSg", { vpc: this.vpc, allowAllOutbound: true });

      this.vpc.selectSubnets( { subnetGroupName: 'app-public' } ).subnets.forEach((x) => {
        dbSg.addIngressRule(Peer.ipv4(x.ipv4CidrBlock), Port.tcp(3306));
      })

      const parameterGroup = new ParameterGroup(scope, "RDSParameterGroup", {
          description: `${systemName}-${envType}-pram-grp`,
          engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
          parameters: {
            time_zone: "Asia/Tokyo",
            character_set_client: "utf8mb4",
            character_set_connection: "utf8mb4",
            character_set_database: "utf8mb4",
            character_set_results: "utf8mb4",
            character_set_server: "utf8mb4",
            collation_connection: "utf8mb4_bin",
          },
        });

      const credentials = Credentials.fromGeneratedSecret(`${envType}_root`, {
        secretName: `${envType}/db/credentials`,
      });

      this.rds = new DatabaseInstance(scope, 'DbInstance', {
          databaseName: `${systemName}_${envType}`,
          instanceIdentifier: `${envType}-db-instance`,
          engine: DatabaseInstanceEngine.mysql({version: MysqlEngineVersion.VER_5_7_34}),
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
          parameterGroup,
          credentials,
          vpc: this.vpc,
          vpcSubnets: this.vpc.selectSubnets( { onePerAz:true, subnetGroupName: 'rds' } ),
          securityGroups: [dbSg],
          port: 3306,
          multiAz: true,
      })   
    }
}
