import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const dynamoDb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDb);
const sns = new SNSClient({ region: process.env.AWS_REGION });

interface ProductRecord {
    id?: string;
    title: string;
    description?: string;
    price: number;
    count: number;
}

interface SQSBatchResponse {
    batchItemFailures: {
        itemIdentifier: string;
    }[];
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    
    const failedMessageIds: string[] = [];
    const records = event.Records;

    for (const record of records) {
        try {
            const productData: ProductRecord = JSON.parse(record.body);

            if(!productData.id) {
                productData.id = uuidv4();
            }
            const productsTableName = process.env.PRODUCTS_TABLE!;
            const stocksTableName = process.env.STOCKS_TABLE!;

            const productItem = {
                id: productData.id,
                title: productData.title,
                description: productData.description,
                price: productData.price,
            }
            const stockItem = {
                product_id: productData.id,
                count: productData.count
            }

            // Create both product and stock in a transaction
            const transaction = new TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: productsTableName,
                            Item: productItem
                        }
                    },
                    {
                        Put: {
                            TableName: stocksTableName,
                            Item: stockItem
                        }
                    }
                ]
            });

            await docClient.send(transaction);
            console.log(`Successfully created product: ${productData.title}`);

            // Send SNS notification
            try {
                await sns.send(new PublishCommand({
                    TopicArn: process.env.SNS_TOPIC_ARN,
                    Message: JSON.stringify({
                        message: 'Product created successfully',
                        product: {...productData}
                    }),
                    MessageAttributes: {
                        price: {
                            DataType: 'Number',
                            StringValue: productData.price.toString()
                        }
                    }
                }));
                console.log(`Successfully sended to SNS about: ${productData.title}`);

            } catch (snsError) {
                // don't throw error, but log it
                // to prevent the SQS message from being returned to the queue
                console.error('SNS error, but DB save was successful:', snsError);
            }

            
        } catch (error) {
            console.error('Error processing record:', error);
            failedMessageIds.push(record.messageId);
        }

    }

    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id
        }))
    };
};

