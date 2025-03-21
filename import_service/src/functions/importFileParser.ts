import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import csvParser from 'csv-parser';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key);

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(command);
      const stream = response.Body as NodeJS.ReadableStream;

      // Process CSV
      await new Promise((resolve, reject) => {
        let hasError = false;

        const parser = csvParser()
          .on('data', async (data: Record<string, unknown>) => {
            try {

                 // Send message to SQS
                await sqsClient.send(new SendMessageCommand({
                    QueueUrl: process.env.SQS_QUEUE_URL,
                    MessageBody: JSON.stringify(data)
                }));

            } catch (error) {
              hasError = true;
              parser.destroy(error as Error);
            }
          })
          .on('error', (error: Error) => {
            hasError = true;
            reject(error);
          })
          .on('end', () => {
            if (!hasError) {
              console.log('Finished processing CSV file');
              resolve(null);
            }
          });

        stream
          .on('error', (error: Error) => {
            hasError = true;
            reject(error);
          })
          .pipe(parser);
      });

      // Move file to parsed folder only if processing was successful
      const newKey = key.replace('uploaded/', 'parsed/');
      
      await s3Client.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: newKey
      }));

      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      }));

      console.log(`File moved from ${key} to ${newKey}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
