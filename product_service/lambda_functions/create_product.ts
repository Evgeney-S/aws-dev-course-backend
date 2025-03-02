import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
    DynamoDBDocumentClient, 
    TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

// Interfaces
interface ProductRequest {
    title: string;
    description?: string;
    price: number;
    count: number;
}

interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
}

interface Stock {
    product_id: string;
    count: number;
}

// Initialize DynamoDB client
const dynamoDb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDb);

// Helper function to validate request body
const validateProductRequest = (data: any): data is ProductRequest => {
    return (
        typeof data === 'object' &&
        typeof data.title === 'string' && data.title.length > 0 &&
        (data.description === undefined || typeof data.description === 'string') &&
        typeof data.price === 'number' && data.price >= 0 &&
        typeof data.count === 'number' && data.count >= 0
    );
};



export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Log incoming request
    console.log('Incoming request:', {
        path: event.path,
        method: event.httpMethod,
        body: event.body,
        requestId: event.requestContext?.requestId || 'no-request-id',
        timestamp: new Date().toISOString()
    });

    const productsTableName = process.env.PRODUCTS_TABLE!;
    const stocksTableName = process.env.STOCKS_TABLE!;

    try {
        // Parse and validate request body
        if (!event.body) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Missing product data' })
            };
        }

        const productData = JSON.parse(event.body);

        if (!validateProductRequest(productData)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    message: 'Invalid product data. Required fields: title (string), price (number), count (number)' 
                })
            };
        }

        // Prepare product and stock items
        const product: Product = {
            id: uuidv4(),
            title: productData.title,
            description: productData.description,
            price: productData.price
        };

        const stock: Stock = {
            product_id: product.id,
            count: productData.count
        };

        console.log('Creating new product and stock:', {
            product,
            stock,
            tables: {
                products: productsTableName,
                stocks: stocksTableName
            }
        });

        // Create both product and stock in a transaction
        const command = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: productsTableName,
                        Item: product,
                        ConditionExpression: 'attribute_not_exists(id)'
                    }
                },
                {
                    Put: {
                        TableName: stocksTableName,
                        Item: stock,
                        ConditionExpression: 'attribute_not_exists(product_id)'
                    }
                }
            ]
        });

        await docClient.send(command);

        console.log('Successfully created product and stock:', {
            productId: product.id
        });

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                ...product,
                count: stock.count
            })
        };

    } catch (error) {
        console.error('Error creating product:', {
            error,
            event: {
                path: event.path,
                method: event.httpMethod
            }
        });

        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    message: 'Invalid JSON in request body' 
                })
            };
        }

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' 
                    ? error instanceof Error ? error.message : 'Unknown error'
                    : undefined
            })
        };
    }
};
