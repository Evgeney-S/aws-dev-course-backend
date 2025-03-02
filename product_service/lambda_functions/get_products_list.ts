import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
// import { products } from './products_data';

// Interfaces for our data types
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

interface ProductWithStock extends Product {
  count: number;
}

// Initialize DynamoDB client
const dynamoDb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDb);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Log incoming request
  console.log('Incoming request:', {
    path: event.path,
    method: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    requestId: event.requestContext?.requestId || 'no-request-id',
    timestamp: new Date().toISOString()
  });

  const productsTableName = process.env.PRODUCTS_TABLE!;
  const stocksTableName = process.env.STOCKS_TABLE!;

  try {

    // Fetch all products
    const productsCommand = new ScanCommand({
        TableName: productsTableName,
    });
    const productsResponse = await docClient.send(productsCommand);
    const products = productsResponse.Items as Product[];

    // Fetch all stocks
    const stocksCommand = new ScanCommand({
        TableName: stocksTableName,
    });
    const stocksResponse = await docClient.send(stocksCommand);
    const stocks = stocksResponse.Items as Stock[];

    // Create a map of product_id to count for easier lookup
    const stocksMap = new Map(
        stocks.map(stock => [stock.product_id, stock.count])
    );

    // Join products with their stock counts
    const productsWithStock: ProductWithStock[] = products.map(product => ({
        ...product,
        count: stocksMap.get(product.id) || 0
    }));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(productsWithStock),
    };

  } catch (error) {
    console.error('Error fetching products:', {
      error,
      event: {
          path: event.path,
          method: event.httpMethod
      },
      tables: {
          products: productsTableName,
          stocks: stocksTableName
      }
    });
    return {
        statusCode: 500,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }),
    };
  }
};
