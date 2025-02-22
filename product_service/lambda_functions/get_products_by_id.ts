import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from './products_data';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productParam = event.pathParameters?.productId;
    const productId = Number(productParam);


    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    const product = products.find(p => p.id === Number(productId));

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
