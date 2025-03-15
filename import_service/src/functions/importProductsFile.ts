// src/functions/importProductsFile.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'File name is required'
        })
      };
    }

    // Validate environment variables
    const bucketName = process.env.BUCKET_NAME;
    const uploadFolder = process.env.UPLOAD_FOLDER;

    if (!bucketName || !uploadFolder) {
      throw new Error('Required environment variables are not set');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${uploadFolder}/${fileName}`,
      ContentType: 'text/csv'
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'text/plain'
      },
      body: signedUrl
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error'
      })
    };
  }
};
