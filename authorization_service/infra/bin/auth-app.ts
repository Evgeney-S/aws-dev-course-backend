#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AWSDevCourseAuthServiceStack } from '../lib/auth-service-stack';

const app = new cdk.App();
new AWSDevCourseAuthServiceStack(app, 'AWSDevCourseAuthServiceStack', {
  env: { 
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }
});
