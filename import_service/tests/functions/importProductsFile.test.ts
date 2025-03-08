import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { handler } from '../../src/functions/importProductsFile';

// Set environment variables at the top of the file
const TEST_BUCKET = 'XXXXXXXXXXX';
const TEST_FOLDER = 'uploaded';

beforeAll(() => {
  process.env.BUCKET_NAME = TEST_BUCKET;
  process.env.UPLOAD_FOLDER = TEST_FOLDER;
});

jest.mock('@aws-sdk/s3-request-presigner');

describe('importProductsFile', () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
    (getSignedUrl as jest.Mock).mockReset();
  });

  it('should return signed URL for valid filename', async () => {
    const mockSignedUrl = 'https://mock-signed-url';
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

    const event = {
      queryStringParameters: {
        name: 'test.csv'
      }
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(mockSignedUrl);
    
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.objectContaining({
        input: {
          Bucket: TEST_BUCKET,
          Key: `${TEST_FOLDER}/test.csv`,
          ContentType: 'text/csv'
        }
      }),
      { expiresIn: 3600 }
    );
  });

  it('should return 400 if filename is missing', async () => {
    const event = {
      queryStringParameters: {}
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({
      message: 'File name is required'
    }));
  });
});
