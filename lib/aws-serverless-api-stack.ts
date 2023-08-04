import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventBus, IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import * as eventsTarget from "aws-cdk-lib/aws-events-targets";

interface StackProps extends cdk.StackProps {
  sharedEventBusArn?: string;
}

export class AwsServerlessApiStack extends cdk.Stack {
  public readonly sharedEventBus: IEventBus;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // HTTP Lambda
    const httpLambda = new NodejsFunction(this, 'aws-serverless-api-http-lambda', {
      entry: 'src/lambda/http/hello-world.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['aws-sdk']
      }
    });

    // Define an API Gateway REST API
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html#defining-apis

    const api = new apigw.RestApi(this, 'hello-api', {
      restApiName: 'api-gw',
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'test'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS
      },
      endpointExportName: 'api-gateway-url'
    });

    // GET /hello
    const hello = api.root.addResource('hello');
    hello.addMethod('GET', new apigw.LambdaIntegration(httpLambda));

    // Create a shared event bus for events
    // if a shared event bus arn is provided, use it
    this.sharedEventBus = props?.sharedEventBusArn
      ? EventBus.fromEventBusArn(this, "SharedEventBus", props.sharedEventBusArn)
      : new EventBus(this, "SharedEventBus", {
          eventBusName: "shared-event-bus"
        });

    new cdk.CfnOutput(this, "SharedEventBusArn", {
      value: this.sharedEventBus.eventBusArn
    });


    // Event Lambda
    const onExampleEventLambda = new NodejsFunction(this, 'aws-serverless-api-event-lambda', {
      entry: 'src/lambda/event/onExampleEvent.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['aws-sdk']
      }
    });

    // EventBridge rule that triggers the Lambda
    // When an event is sent to the default event bus with the detail type ExampleEventName, the Lambda is invoked
    new Rule(this, 'aws-serverless-api-event-rule', {
      eventBus: this.sharedEventBus,
      eventPattern: {
        source: ['ExampleEventSource'],
        detailType: ['ExampleEventName']
      },
      targets: [new eventsTarget.LambdaFunction(onExampleEventLambda)]
    });

  }
}
