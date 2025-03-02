import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    console.log('Starting to fetch all products and stocks');

    const productParam = event.pathParameters?.productId;
    const productId = Number(productParam);


    if (!productId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'No product ID provided' }),
      };
    }

    // Fetch product and stock data in parallel
    const [productResponse, stockResponse] = await Promise.all([
      // Get product details
      docClient.send(new GetCommand({
          TableName: productsTableName,
          Key: { id: productId }
      })),
      // Get stock details
      docClient.send(new GetCommand({
          TableName: stocksTableName,
          Key: { product_id: productId }
      }))
    ]);

    const product = productResponse.Item as Product | undefined;
    const stock = stockResponse.Item as Stock | undefined;

    // Check if product exists
    if (!product) {
      return {
          statusCode: 404,
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
              message: 'Product not found' 
          }),
      };
    }

    // Combine product and stock data
    const productWithStock: ProductWithStock = {
      ...product,
      count: stock?.count || 0
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(productWithStock),
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
