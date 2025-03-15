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
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
            allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
        }
    });

    // Add /import endpoint
    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile), {
        requestParameters: {
            'method.request.querystring.name': true
        }
    });
  }
}
