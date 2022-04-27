import { Resource } from "../abstract/resource";
import { Construct } from "constructs";
import { 
    ContainerDefinition,
    ContainerImage,
    FargateTaskDefinition,
    Protocol,
    LogDriver, 
    UlimitName, 
    EnvironmentFile
} from "aws-cdk-lib/aws-ecs";

import { Repository } from "aws-cdk-lib/aws-ecr";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class AppContainerDefinition extends Resource {
    private appContainerDef: ContainerDefinition
    public nginxContainerDef: ContainerDefinition
    // private jobContainerDef: ContainerDefinition

    private readonly taskDefinition: FargateTaskDefinition
    private readonly logGrp: LogGroup
    private readonly rds: DatabaseInstance

    constructor(
        taskDefinition: FargateTaskDefinition,
        logGrp: LogGroup,
        rds: DatabaseInstance,
      ) {
        super();
        this.taskDefinition = taskDefinition
        this.logGrp = logGrp
        this.rds = rds
      }
      createResources(scope: Construct) {
        const systemName = scope.node.tryGetContext("systemName");
        const envType = scope.node.tryGetContext("envType");
        // const bucket = Bucket.fromBucketName(scope, `${envType}EnvBucket`, `${envType}-dotenv`) as Bucket;
    
        const credential = StringParameter.fromStringParameterAttributes(
          scope,
          `${envType}-credential`,
          {
            parameterName: `${envType}-credential`,
          }
        ).stringValue;
    
        const dbCredentials = Secret.fromSecretNameV2(
          scope,
          "database-credentials-secret",
          `${envType}/db/credentials`
        );
    
        
        this.appContainerDef = new ContainerDefinition(scope, "appContainer", {
          containerName: `cdktest-app-${envType}-container`,
          taskDefinition: this.taskDefinition,
    
          image: ContainerImage.fromEcrRepository(
            Repository.fromRepositoryName(scope, "CdktestAppImage", `cdktest-app-${envType}`)
          ),
          logging: LogDriver.awsLogs({
            streamPrefix: envType,
            logGroup: this.logGrp,
          }),

          environment: {
            RAILS_LOG_TO_STDOUT: envType,
            SECRET_KEY_BASE: 'secret-sss',
            RAILS_ENV: envType,
            RAILS_MASTER_KEY: credential,
            DATABASE_HOST: this.rds.instanceEndpoint.hostname,
            DATABASE_PASSWORD: dbCredentials.secretValueFromJson("password").toString(),
            DATABASE_USERNAME: dbCredentials.secretValueFromJson("username").toString(),
            TZ: "Japan",
          },
          environmentFiles: [],
          command: [
            "bash",
            "-c",
            `bundle exec rake ridgepole:apply && bundle exec puma -C config/puma.rb`,
          ],
          workingDirectory: `/${systemName}`,
          essential: true,
        });
        this.appContainerDef.addUlimits({
          name: UlimitName.NOFILE,
          hardLimit: 64000,
          softLimit: 64000
        });
    
        this.nginxContainerDef = new ContainerDefinition(scope, "nginxContainer", {
          containerName: `cdktest-nginx-${envType}-container`,
          taskDefinition: this.taskDefinition,
    
          image: ContainerImage.fromEcrRepository(
            Repository.fromRepositoryName(scope, "CdktestNginxImage", `cdktest-nginx-${envType}`)
          ),
          logging: LogDriver.awsLogs({
            streamPrefix: envType,
            logGroup: this.logGrp,
          }),
          portMappings: [
            {
              protocol: Protocol.TCP,
              containerPort: 80,
            },
          ],
          workingDirectory: `/${systemName}`,
          essential: true,
        });
    
        this.nginxContainerDef.addUlimits({
          name: UlimitName.NOFILE,
          hardLimit: 64000,
          softLimit: 64000
        });
    
        this.nginxContainerDef.addVolumesFrom({
          sourceContainer: `cdktest-app-${envType}-container`,
          readOnly: false,
        });
    
        this.taskDefinition.defaultContainer = this.nginxContainerDef;
      }
}
