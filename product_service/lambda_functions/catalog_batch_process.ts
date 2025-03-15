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

export const handler = async (event: SQSEvent): Promise<void> => {
    try {
        const records = event.Records;

        for (const record of records) {
            await processRecord(record);
        }
    } catch (error) {
        console.error('Error processing batch:', error);
        throw error;
    }
};

async function processRecord(record: SQSRecord): Promise<void> {
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

        // Send SNS notification
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

        console.log(`Successfully created product: ${productData.title}`);

    } catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
}
