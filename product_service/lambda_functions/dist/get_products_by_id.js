"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize DynamoDB client
const dynamoDb = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoDb);
const handler = async (event) => {
    // Log incoming request
    console.log('Incoming request:', {
        path: event.path,
        method: event.httpMethod,
        queryStringParameters: event.queryStringParameters,
        requestId: event.requestContext?.requestId || 'no-request-id',
        timestamp: new Date().toISOString()
    });
    const productsTableName = process.env.PRODUCTS_TABLE;
    const stocksTableName = process.env.STOCKS_TABLE;
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
            docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: productsTableName,
                Key: { id: productId }
            })),
            // Get stock details
            docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: stocksTableName,
                Key: { product_id: productId }
            }))
        ]);
        const product = productResponse.Item;
        const stock = stockResponse.Item;
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
        const productWithStock = {
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
    }
    catch (error) {
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
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3Byb2R1Y3RzX2J5X2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZ2V0X3Byb2R1Y3RzX2J5X2lkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3REFBMkU7QUFvQjNFLDZCQUE2QjtBQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLHVCQUF1QjtJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1FBQy9CLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDeEIscUJBQXFCLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtRQUNsRCxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLElBQUksZUFBZTtRQUM3RCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDcEMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWUsQ0FBQztJQUN0RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQWEsQ0FBQztJQUVsRCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFFekQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUM7UUFDckQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBR3ZDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7aUJBQ25DO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLENBQUM7YUFDNUQsQ0FBQztRQUNKLENBQUM7UUFFRCwyQ0FBMkM7UUFDM0MsTUFBTSxDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDekQsc0JBQXNCO1lBQ3RCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx5QkFBVSxDQUFDO2dCQUMxQixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFO2FBQ3pCLENBQUMsQ0FBQztZQUNILG9CQUFvQjtZQUNwQixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUkseUJBQVUsQ0FBQztnQkFDMUIsU0FBUyxFQUFFLGVBQWU7Z0JBQzFCLEdBQUcsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUU7YUFDakMsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLElBQTJCLENBQUM7UUFDNUQsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLElBQXlCLENBQUM7UUFFdEQsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU87Z0JBQ0gsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFO29CQUNMLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7aUJBQ3JDO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNqQixPQUFPLEVBQUUsbUJBQW1CO2lCQUMvQixDQUFDO2FBQ0wsQ0FBQztRQUNKLENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsTUFBTSxnQkFBZ0IsR0FBcUI7WUFDekMsR0FBRyxPQUFPO1lBQ1YsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLElBQUksQ0FBQztTQUN6QixDQUFDO1FBRUYsT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7YUFDckM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztTQUN6QyxDQUFDO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFO1lBQ3hDLEtBQUs7WUFDTCxLQUFLLEVBQUU7Z0JBQ0gsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7YUFDM0I7WUFDRCxNQUFNLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsTUFBTSxFQUFFLGVBQWU7YUFDMUI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNqQixPQUFPLEVBQUUsdUJBQXVCO2dCQUNoQyxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTthQUNsRSxDQUFDO1NBQ0wsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUFyR1csUUFBQSxPQUFPLFdBcUdsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiXCI7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIEdldENvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvbGliLWR5bmFtb2RiXCI7XHJcbi8vIGltcG9ydCB7IHByb2R1Y3RzIH0gZnJvbSAnLi9wcm9kdWN0c19kYXRhJztcclxuXHJcbi8vIEludGVyZmFjZXMgZm9yIG91ciBkYXRhIHR5cGVzXHJcbmludGVyZmFjZSBQcm9kdWN0IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcbiAgcHJpY2U6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFN0b2NrIHtcclxuICBwcm9kdWN0X2lkOiBzdHJpbmc7XHJcbiAgY291bnQ6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFByb2R1Y3RXaXRoU3RvY2sgZXh0ZW5kcyBQcm9kdWN0IHtcclxuICBjb3VudDogbnVtYmVyO1xyXG59XHJcblxyXG4vLyBJbml0aWFsaXplIER5bmFtb0RCIGNsaWVudFxyXG5jb25zdCBkeW5hbW9EYiA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XHJcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9EYik7XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xyXG4gIC8vIExvZyBpbmNvbWluZyByZXF1ZXN0XHJcbiAgY29uc29sZS5sb2coJ0luY29taW5nIHJlcXVlc3Q6Jywge1xyXG4gICAgcGF0aDogZXZlbnQucGF0aCxcclxuICAgIG1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcclxuICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzLFxyXG4gICAgcmVxdWVzdElkOiBldmVudC5yZXF1ZXN0Q29udGV4dD8ucmVxdWVzdElkIHx8ICduby1yZXF1ZXN0LWlkJyxcclxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgfSk7XHJcbiAgXHJcbiAgY29uc3QgcHJvZHVjdHNUYWJsZU5hbWUgPSBwcm9jZXNzLmVudi5QUk9EVUNUU19UQUJMRSE7XHJcbiAgY29uc3Qgc3RvY2tzVGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuU1RPQ0tTX1RBQkxFITtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKCdTdGFydGluZyB0byBmZXRjaCBhbGwgcHJvZHVjdHMgYW5kIHN0b2NrcycpO1xyXG5cclxuICAgIGNvbnN0IHByb2R1Y3RQYXJhbSA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5wcm9kdWN0SWQ7XHJcbiAgICBjb25zdCBwcm9kdWN0SWQgPSBOdW1iZXIocHJvZHVjdFBhcmFtKTtcclxuXHJcblxyXG4gICAgaWYgKCFwcm9kdWN0SWQpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ05vIHByb2R1Y3QgSUQgcHJvdmlkZWQnIH0pLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoIHByb2R1Y3QgYW5kIHN0b2NrIGRhdGEgaW4gcGFyYWxsZWxcclxuICAgIGNvbnN0IFtwcm9kdWN0UmVzcG9uc2UsIHN0b2NrUmVzcG9uc2VdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xyXG4gICAgICAvLyBHZXQgcHJvZHVjdCBkZXRhaWxzXHJcbiAgICAgIGRvY0NsaWVudC5zZW5kKG5ldyBHZXRDb21tYW5kKHtcclxuICAgICAgICAgIFRhYmxlTmFtZTogcHJvZHVjdHNUYWJsZU5hbWUsXHJcbiAgICAgICAgICBLZXk6IHsgaWQ6IHByb2R1Y3RJZCB9XHJcbiAgICAgIH0pKSxcclxuICAgICAgLy8gR2V0IHN0b2NrIGRldGFpbHNcclxuICAgICAgZG9jQ2xpZW50LnNlbmQobmV3IEdldENvbW1hbmQoe1xyXG4gICAgICAgICAgVGFibGVOYW1lOiBzdG9ja3NUYWJsZU5hbWUsXHJcbiAgICAgICAgICBLZXk6IHsgcHJvZHVjdF9pZDogcHJvZHVjdElkIH1cclxuICAgICAgfSkpXHJcbiAgICBdKTtcclxuXHJcbiAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdFJlc3BvbnNlLkl0ZW0gYXMgUHJvZHVjdCB8IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IHN0b2NrID0gc3RvY2tSZXNwb25zZS5JdGVtIGFzIFN0b2NrIHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHByb2R1Y3QgZXhpc3RzXHJcbiAgICBpZiAoIXByb2R1Y3QpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcm9kdWN0IG5vdCBmb3VuZCcgXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21iaW5lIHByb2R1Y3QgYW5kIHN0b2NrIGRhdGFcclxuICAgIGNvbnN0IHByb2R1Y3RXaXRoU3RvY2s6IFByb2R1Y3RXaXRoU3RvY2sgPSB7XHJcbiAgICAgIC4uLnByb2R1Y3QsXHJcbiAgICAgIGNvdW50OiBzdG9jaz8uY291bnQgfHwgMFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHByb2R1Y3RXaXRoU3RvY2spLFxyXG4gICAgfTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHByb2R1Y3RzOicsIHtcclxuICAgICAgZXJyb3IsXHJcbiAgICAgIGV2ZW50OiB7XHJcbiAgICAgICAgICBwYXRoOiBldmVudC5wYXRoLFxyXG4gICAgICAgICAgbWV0aG9kOiBldmVudC5odHRwTWV0aG9kXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhYmxlczoge1xyXG4gICAgICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzVGFibGVOYW1lLFxyXG4gICAgICAgICAgc3RvY2tzOiBzdG9ja3NUYWJsZU5hbWVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcclxuICAgICAgICB9KSxcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG4iXX0=