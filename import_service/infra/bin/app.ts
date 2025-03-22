// infra/bin/app.ts
import * as cdk from 'aws-cdk-lib';
import { AWSDevCourseImportService } from '../lib/import-service-stack';

const app = new cdk.App();

new AWSDevCourseImportService(app, 'AWSDevCourseImportService', {
    env: { 
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    }
});
