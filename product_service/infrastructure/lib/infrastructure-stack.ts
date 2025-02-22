import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Lambda functions
    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_products_list.handler',
      // code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda_functions')),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'dist')),
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_products_by_id.handler',
      // code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda_functions')),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda_functions', 'dist')),
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName: 'Product Service',
      description: 'This is the Product Service API',
    });

    // Create API resources and methods
    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));
  }
}
