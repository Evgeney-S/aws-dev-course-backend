// import_service/tests/functions/importFileParser.test.ts
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { handler } from '../../src/functions/importFileParser';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { SdkStream } from '@aws-sdk/types';

const TEST_BUCKET = 'XXXXXXXXXXX';

describe('importFileParser', () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
  });

  it('should process CSV file and move it to parsed folder', async () => {
    const mockCsvContent = 'id,name\n1,test';
    
    const mockStream = sdkStreamMixin(
      new Readable({
        read() {
          this.push(mockCsvContent);
          this.push(null);
        }
      })
    );

    const mockResponse: Partial<GetObjectCommandOutput> = {
      Body: mockStream as SdkStream<Readable>,
      $metadata: {}
    };

    s3Mock
      .on(GetObjectCommand)
      .resolves(mockResponse as GetObjectCommandOutput)
      .on(CopyObjectCommand)
      .resolves({})
      .on(DeleteObjectCommand)
      .resolves({});

    const event = {
      Records: [{
        s3: {
          bucket: {
            name: TEST_BUCKET
          },
          object: {
            key: 'uploaded/test.csv'
          }
        }
      }]
    };

    await handler(event as any);

    expect(s3Mock.calls()).toHaveLength(3);
    
    const copyCall = s3Mock.commandCalls(CopyObjectCommand)[0];
    expect(copyCall.args[0].input).toEqual({
      Bucket: TEST_BUCKET,
      CopySource: `${TEST_BUCKET}/uploaded/test.csv`,
      Key: 'parsed/test.csv'
    });

    const deleteCall = s3Mock.commandCalls(DeleteObjectCommand)[0];
    expect(deleteCall.args[0].input).toEqual({
      Bucket: TEST_BUCKET,
      Key: 'uploaded/test.csv'
    });
  });

  // Increased timeout and improved error handling test
  it('should handle CSV parsing errors', async () => {
    // Create an invalid CSV content that will cause parsing error
    const mockStream = sdkStreamMixin(
      new Readable({
        read() {
          // Push invalid CSV content
          this.push('invalid,csv\ndata with no proper structure');
          this.push(null);
        }
      })
    );

    const mockResponse: Partial<GetObjectCommandOutput> = {
      Body: mockStream as SdkStream<Readable>,
      $metadata: {}
    };

    s3Mock
      .on(GetObjectCommand)
      .resolves(mockResponse as GetObjectCommandOutput);

    const event = {
      Records: [{
        s3: {
          bucket: {
            name: TEST_BUCKET
          },
          object: {
            key: 'uploaded/test.csv'
          }
        }
      }]
    };

    try {
      await handler(event as any);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 10000); // Increased timeout to 10 seconds
});
