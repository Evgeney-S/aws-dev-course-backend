import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Auth env

export class AWSDevCourseAuthServiceStack extends cdk.Stack {
    public readonly basicAuthorizerFunction: lambda.Function;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        if(!process.env.GITHUB_ACCOUNT || !process.env[process.env.GITHUB_ACCOUNT]){
            throw new Error("Credentials are not set in .env");
        }

        this.basicAuthorizerFunction = new NodejsFunction(this, 'BasicAuthorizer', {
            functionName: 'AWSDevCourseAuthServiceStack-BasicAuthorizer',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: path.join(__dirname, '../../src/functions/basicAuthorizer.ts'),
            environment : {
                [process.env.GITHUB_ACCOUNT]: process.env[process.env.GITHUB_ACCOUNT] || ""
            }
        });
    }
}
