import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

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
      // code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'dist')),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'functions.zip')),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName
      }
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_products_by_id.handler',
      // code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'dist')),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'functions.zip')),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName
      }
    });

    const createProduct = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create_product.handler',
      // code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'dist')),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'functions.zip')),
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
