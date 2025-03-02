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
        const productId = event.pathParameters?.productId;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3Byb2R1Y3RzX2J5X2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZ2V0X3Byb2R1Y3RzX2J5X2lkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3REFBMkU7QUFvQjNFLDZCQUE2QjtBQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLHVCQUF1QjtJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1FBQy9CLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDeEIscUJBQXFCLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtRQUNsRCxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLElBQUksZUFBZTtRQUM3RCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDcEMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWUsQ0FBQztJQUN0RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQWEsQ0FBQztJQUVsRCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFFekQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUM7UUFFbEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztpQkFDbkM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQzthQUM1RCxDQUFDO1FBQ0osQ0FBQztRQUVELDJDQUEyQztRQUMzQyxNQUFNLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUN6RCxzQkFBc0I7WUFDdEIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLHlCQUFVLENBQUM7Z0JBQzFCLFNBQVMsRUFBRSxpQkFBaUI7Z0JBQzVCLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUU7YUFDekIsQ0FBQyxDQUFDO1lBQ0gsb0JBQW9CO1lBQ3BCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx5QkFBVSxDQUFDO2dCQUMxQixTQUFTLEVBQUUsZUFBZTtnQkFDMUIsR0FBRyxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRTthQUNqQyxDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsSUFBMkIsQ0FBQztRQUM1RCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBeUIsQ0FBQztRQUV0RCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTztnQkFDSCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztpQkFDckM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ2pCLE9BQU8sRUFBRSxtQkFBbUI7aUJBQy9CLENBQUM7YUFDTCxDQUFDO1FBQ0osQ0FBQztRQUVELGlDQUFpQztRQUNqQyxNQUFNLGdCQUFnQixHQUFxQjtZQUN6QyxHQUFHLE9BQU87WUFDVixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDO1NBQ3pCLENBQUM7UUFFRixPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1NBQ3pDLENBQUM7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUU7WUFDeEMsS0FBSztZQUNMLEtBQUssRUFBRTtnQkFDSCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxLQUFLLENBQUMsVUFBVTthQUMzQjtZQUNELE1BQU0sRUFBRTtnQkFDSixRQUFRLEVBQUUsaUJBQWlCO2dCQUMzQixNQUFNLEVBQUUsZUFBZTthQUMxQjtTQUNGLENBQUMsQ0FBQztRQUNILE9BQU87WUFDSCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2FBQ3JDO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ2pCLE9BQU8sRUFBRSx1QkFBdUI7Z0JBQ2hDLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO2FBQ2xFLENBQUM7U0FDTCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQW5HVyxRQUFBLE9BQU8sV0FtR2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtZHluYW1vZGJcIjtcclxuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgR2V0Q29tbWFuZCB9IGZyb20gXCJAYXdzLXNkay9saWItZHluYW1vZGJcIjtcclxuLy8gaW1wb3J0IHsgcHJvZHVjdHMgfSBmcm9tICcuL3Byb2R1Y3RzX2RhdGEnO1xyXG5cclxuLy8gSW50ZXJmYWNlcyBmb3Igb3VyIGRhdGEgdHlwZXNcclxuaW50ZXJmYWNlIFByb2R1Y3Qge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbj86IHN0cmluZztcclxuICBwcmljZTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgU3RvY2sge1xyXG4gIHByb2R1Y3RfaWQ6IHN0cmluZztcclxuICBjb3VudDogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUHJvZHVjdFdpdGhTdG9jayBleHRlbmRzIFByb2R1Y3Qge1xyXG4gIGNvdW50OiBudW1iZXI7XHJcbn1cclxuXHJcbi8vIEluaXRpYWxpemUgRHluYW1vREIgY2xpZW50XHJcbmNvbnN0IGR5bmFtb0RiID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcclxuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0RiKTtcclxuXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XHJcbiAgLy8gTG9nIGluY29taW5nIHJlcXVlc3RcclxuICBjb25zb2xlLmxvZygnSW5jb21pbmcgcmVxdWVzdDonLCB7XHJcbiAgICBwYXRoOiBldmVudC5wYXRoLFxyXG4gICAgbWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxyXG4gICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMsXHJcbiAgICByZXF1ZXN0SWQ6IGV2ZW50LnJlcXVlc3RDb250ZXh0Py5yZXF1ZXN0SWQgfHwgJ25vLXJlcXVlc3QtaWQnLFxyXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICB9KTtcclxuICBcclxuICBjb25zdCBwcm9kdWN0c1RhYmxlTmFtZSA9IHByb2Nlc3MuZW52LlBST0RVQ1RTX1RBQkxFITtcclxuICBjb25zdCBzdG9ja3NUYWJsZU5hbWUgPSBwcm9jZXNzLmVudi5TVE9DS1NfVEFCTEUhO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIHRvIGZldGNoIGFsbCBwcm9kdWN0cyBhbmQgc3RvY2tzJyk7XHJcblxyXG4gICAgY29uc3QgcHJvZHVjdElkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnByb2R1Y3RJZDtcclxuXHJcbiAgICBpZiAoIXByb2R1Y3RJZCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnTm8gcHJvZHVjdCBJRCBwcm92aWRlZCcgfSksXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggcHJvZHVjdCBhbmQgc3RvY2sgZGF0YSBpbiBwYXJhbGxlbFxyXG4gICAgY29uc3QgW3Byb2R1Y3RSZXNwb25zZSwgc3RvY2tSZXNwb25zZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgIC8vIEdldCBwcm9kdWN0IGRldGFpbHNcclxuICAgICAgZG9jQ2xpZW50LnNlbmQobmV3IEdldENvbW1hbmQoe1xyXG4gICAgICAgICAgVGFibGVOYW1lOiBwcm9kdWN0c1RhYmxlTmFtZSxcclxuICAgICAgICAgIEtleTogeyBpZDogcHJvZHVjdElkIH1cclxuICAgICAgfSkpLFxyXG4gICAgICAvLyBHZXQgc3RvY2sgZGV0YWlsc1xyXG4gICAgICBkb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XHJcbiAgICAgICAgICBUYWJsZU5hbWU6IHN0b2Nrc1RhYmxlTmFtZSxcclxuICAgICAgICAgIEtleTogeyBwcm9kdWN0X2lkOiBwcm9kdWN0SWQgfVxyXG4gICAgICB9KSlcclxuICAgIF0pO1xyXG5cclxuICAgIGNvbnN0IHByb2R1Y3QgPSBwcm9kdWN0UmVzcG9uc2UuSXRlbSBhcyBQcm9kdWN0IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RvY2sgPSBzdG9ja1Jlc3BvbnNlLkl0ZW0gYXMgU3RvY2sgfCB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgcHJvZHVjdCBleGlzdHNcclxuICAgIGlmICghcHJvZHVjdCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1Byb2R1Y3Qgbm90IGZvdW5kJyBcclxuICAgICAgICAgIH0pLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbWJpbmUgcHJvZHVjdCBhbmQgc3RvY2sgZGF0YVxyXG4gICAgY29uc3QgcHJvZHVjdFdpdGhTdG9jazogUHJvZHVjdFdpdGhTdG9jayA9IHtcclxuICAgICAgLi4ucHJvZHVjdCxcclxuICAgICAgY291bnQ6IHN0b2NrPy5jb3VudCB8fCAwXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocHJvZHVjdFdpdGhTdG9jayksXHJcbiAgICB9O1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgcHJvZHVjdHM6Jywge1xyXG4gICAgICBlcnJvcixcclxuICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgIHBhdGg6IGV2ZW50LnBhdGgsXHJcbiAgICAgICAgICBtZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2RcclxuICAgICAgfSxcclxuICAgICAgdGFibGVzOiB7XHJcbiAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHNUYWJsZU5hbWUsXHJcbiAgICAgICAgICBzdG9ja3M6IHN0b2Nrc1RhYmxlTmFtZVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBcclxuICAgICAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgIH0pLFxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcbiJdfQ==