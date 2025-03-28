import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class AWSDevCourseImportService extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Reference existing S3 bucket
        const uploadBucket = s3.Bucket.fromBucketName(this, 'ImportServiceBucket', 'aws-dev-course-import-service');
        // Reference existing SQS queue (in product_service stack)
        const catalogItemsQueue = sqs.Queue.fromQueueAttributes(
            this, 
            'CatalogItemsQueue', 
            {
                queueName: 'catalogItemsQueue',
                queueArn: `arn:aws:sqs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:catalogItemsQueue`
            }
        );
        // Reference the authorizer lambda function by ARN
        const authorizerFn = lambda.Function.fromFunctionArn(this, 'BasicAuthorizerFunction', 
            `arn:aws:lambda:${this.region}:${this.account}:function:AWSDevCourseAuthServiceStack-BasicAuthorizer`
        );
            

        // importProductsFile Lambda function
        const importProductsFile = new NodejsFunction(this, 'ImportProductsFile', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../src/functions/importProductsFile.ts'),
            environment: {
                BUCKET_NAME: uploadBucket.bucketName,
                UPLOAD_FOLDER: 'uploaded'
            }
        });

        uploadBucket.grantReadWrite(importProductsFile);


        // importFileParser Lambda function
        const importFileParser = new NodejsFunction(this, 'ImportFileParser', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../src/functions/importFileParser.ts'),
            environment: {
                BUCKET_NAME: uploadBucket.bucketName,
                SQS_QUEUE_URL: catalogItemsQueue.queueUrl
            }
        });

        uploadBucket.grantReadWrite(importFileParser);
        // Grant SQS permissions to the Lambda
        importFileParser.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['sqs:SendMessage'],
            resources: [catalogItemsQueue.queueArn]
        }));


        // Create API Gateway
        const api = new apigateway.RestApi(this, 'ImportServiceApi', {
            defaultCorsPreflightOptions: {
                // allowOrigins: ['https://d1rnsh23r9ia7o.cloudfront.net'],
                allowOrigins: ['*'],
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
                // allowCredentials: true
            }
        });

        const apiResponseHeaders = {
            'Access-Control-Allow-Origin': "'*'",
            'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Api-Key'",
            'Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
            "Content-Type": "'application/json'"
        }
        api.addGatewayResponse('UNAUTHORIZED', {
            type: apigateway.ResponseType.UNAUTHORIZED,
            statusCode: "401",
            responseHeaders: apiResponseHeaders,
            templates: {
                "application/json": '{"message": "Authorization required"}',
            },
        });
        api.addGatewayResponse('ACCESS_DENIED', {
            type: apigateway.ResponseType.ACCESS_DENIED,
            statusCode: "403",
            responseHeaders: apiResponseHeaders,
            templates: {
                "application/json": '{"message": "Access denied"}',
            },
        });

        // Create API Gateway authorizer
        const authorizer = new apigateway.TokenAuthorizer(this, 'ImportApiAuthorizer', {
            handler: authorizerFn,
            identitySource: apigateway.IdentitySource.header('Authorization')
        });

        // Add /import endpoint
        const importResource = api.root.addResource('import');

        importResource.addMethod(
            'GET', 
            new apigateway.LambdaIntegration(importProductsFile), 
            {
                authorizer: authorizer,
                requestParameters: {
                    'method.request.querystring.name': true
                }
            }
        );

    }
}
