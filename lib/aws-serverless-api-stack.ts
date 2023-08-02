import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';


export class AwsServerlessApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

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
  }
}
