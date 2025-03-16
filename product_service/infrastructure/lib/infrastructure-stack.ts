import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference existing DynamoDB tables
    const productsTable = dynamodb.Table.fromTableName(
      this, 
      'ProductsTable', 
      'products'
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this, 
      'StocksTable', 
      'stocks'
    );

    // Create Lambda functions
    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_products_list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda_functions/functions.zip')),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName
      }
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_products_by_id.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda_functions/functions.zip')),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName
      }
    });

    const createProduct = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create_product.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda_functions/functions.zip')),
      environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCKS_TABLE: stocksTable.tableName
      }
    });

    // Grant permissions to Lambda functions to access DynamoDB tables
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    // Create SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
        queueName: 'catalogItemsQueue',
        visibilityTimeout: cdk.Duration.seconds(30),
    });

    // Create SNS Topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
        topicName: 'createProductTopic',
        displayName: 'Create Product Topic'
    });
    cdk.Tags.of(createProductTopic).add('project', 'aws-dev-course');

    // Add email subscription for all products
    if (!process.env.MAIN_EMAIL) {
        throw new Error('MAIN_EMAIL environment variable is required');
    }
    createProductTopic.addSubscription(
        new subscriptions.EmailSubscription(process.env.MAIN_EMAIL)
    );

    // Add filtered subscription for expensive products
    if (!process.env.EXTRA_EMAIL) {
        throw new Error('EXTRA_EMAIL environment variable is required');
    }
    createProductTopic.addSubscription(
        new subscriptions.EmailSubscription(process.env.EXTRA_EMAIL, {
            filterPolicy: {
                price: sns.SubscriptionFilter.numericFilter({
                    greaterThan: 100
                })
            }
        })
    );
    
    // Create Catalog Batch Process Lambda
    const catalogBatchProcess = new lambda.Function(this, 'catalogBatchProcess', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'catalog_batch_process.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'functions.zip')),
        environment: {
            PRODUCTS_TABLE: productsTable.tableName,
            STOCKS_TABLE: stocksTable.tableName,
            SNS_TOPIC_ARN: createProductTopic.topicArn
        }
    });
    
    // Add SQS event source to Lambda
    catalogBatchProcess.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
        reportBatchItemFailures: true
    }));

    catalogBatchProcess.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [createProductTopic.topicArn]
    }));
    
    // Grant permissions
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);
  

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName: 'Product Service',
      description: 'This is the Product Service API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      }
    });

    // Create API resources and methods
    const products = api.root.addResource('products');

    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));
  }
}
