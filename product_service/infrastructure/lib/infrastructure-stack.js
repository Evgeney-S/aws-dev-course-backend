"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");
class InfrastructureStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.InfrastructureStack = InfrastructureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUV6RCw2QkFBNkI7QUFFN0IsTUFBYSxtQkFBb0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNoRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBCQUEwQjtRQUMxQixNQUFNLGVBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ25FLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLDJCQUEyQjtZQUNwQywrRUFBK0U7WUFDL0UsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDMUYsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNuRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsK0VBQStFO1lBQy9FLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFGLENBQUMsQ0FBQztRQUVILHFCQUFxQjtRQUNyQixNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUN0RCxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFdBQVcsRUFBRSxpQ0FBaUM7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsbUNBQW1DO1FBQ25DLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFN0UsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwRCxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBQzlFLENBQUM7Q0FDRjtBQWhDRCxrREFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBJbmZyYXN0cnVjdHVyZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIExhbWJkYSBmdW5jdGlvbnNcbiAgICBjb25zdCBnZXRQcm9kdWN0c0xpc3QgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdnZXRQcm9kdWN0c0xpc3QnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdnZXRfcHJvZHVjdHNfbGlzdC5oYW5kbGVyJyxcbiAgICAgIC8vIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vbGFtYmRhX2Z1bmN0aW9ucycpKSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnbGFtYmRhX2Z1bmN0aW9ucycsICdkaXN0JykpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0UHJvZHVjdHNCeUlkID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZ2V0UHJvZHVjdHNCeUlkJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnZ2V0X3Byb2R1Y3RzX2J5X2lkLmhhbmRsZXInLFxuICAgICAgLy8gY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9sYW1iZGFfZnVuY3Rpb25zJykpLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICdsYW1iZGFfZnVuY3Rpb25zJywgJ2Rpc3QnKSksXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdQcm9kdWN0c0FwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnUHJvZHVjdCBTZXJ2aWNlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBpcyB0aGUgUHJvZHVjdCBTZXJ2aWNlIEFQSScsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQVBJIHJlc291cmNlcyBhbmQgbWV0aG9kc1xuICAgIGNvbnN0IHByb2R1Y3RzID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Byb2R1Y3RzJyk7XG4gICAgcHJvZHVjdHMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRQcm9kdWN0c0xpc3QpKTtcblxuICAgIGNvbnN0IHByb2R1Y3QgPSBwcm9kdWN0cy5hZGRSZXNvdXJjZSgne3Byb2R1Y3RJZH0nKTtcbiAgICBwcm9kdWN0LmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHJvZHVjdHNCeUlkKSk7XG4gIH1cbn1cbiJdfQ==