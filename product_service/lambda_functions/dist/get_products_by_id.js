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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3Byb2R1Y3RzX2J5X2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZ2V0X3Byb2R1Y3RzX2J5X2lkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3REFBMkU7QUFvQjNFLDZCQUE2QjtBQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLHVCQUF1QjtJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1FBQy9CLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDeEIscUJBQXFCLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtRQUNsRCxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLElBQUksZUFBZTtRQUM3RCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDcEMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWUsQ0FBQztJQUN0RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQWEsQ0FBQztJQUVsRCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFFekQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUM7UUFFbEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztpQkFDbkM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQzthQUM1RCxDQUFDO1FBQ0osQ0FBQztRQUVELDJDQUEyQztRQUMzQyxNQUFNLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUN6RCxzQkFBc0I7WUFDdEIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLHlCQUFVLENBQUM7Z0JBQzFCLFNBQVMsRUFBRSxpQkFBaUI7Z0JBQzVCLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUU7YUFDekIsQ0FBQyxDQUFDO1lBQ0gsb0JBQW9CO1lBQ3BCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx5QkFBVSxDQUFDO2dCQUMxQixTQUFTLEVBQUUsZUFBZTtnQkFDMUIsR0FBRyxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRTthQUNqQyxDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsSUFBMkIsQ0FBQztRQUM1RCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBeUIsQ0FBQztRQUV0RCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTztnQkFDSCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztpQkFDckM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ2pCLE9BQU8sRUFBRSxtQkFBbUI7aUJBQy9CLENBQUM7YUFDTCxDQUFDO1FBQ0osQ0FBQztRQUVELGlDQUFpQztRQUNqQyxNQUFNLGdCQUFnQixHQUFxQjtZQUN6QyxHQUFHLE9BQU87WUFDVixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDO1NBQ3pCLENBQUM7UUFFRixPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1NBQ3pDLENBQUM7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUU7WUFDeEMsS0FBSztZQUNMLEtBQUssRUFBRTtnQkFDSCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxLQUFLLENBQUMsVUFBVTthQUMzQjtZQUNELE1BQU0sRUFBRTtnQkFDSixRQUFRLEVBQUUsaUJBQWlCO2dCQUMzQixNQUFNLEVBQUUsZUFBZTthQUMxQjtTQUNGLENBQUMsQ0FBQztRQUNILE9BQU87WUFDSCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2FBQ3JDO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ2pCLE9BQU8sRUFBRSx1QkFBdUI7Z0JBQ2hDLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO2FBQ2xFLENBQUM7U0FDTCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQW5HVyxRQUFBLE9BQU8sV0FtR2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiXCI7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBHZXRDb21tYW5kIH0gZnJvbSBcIkBhd3Mtc2RrL2xpYi1keW5hbW9kYlwiO1xuLy8gaW1wb3J0IHsgcHJvZHVjdHMgfSBmcm9tICcuL3Byb2R1Y3RzX2RhdGEnO1xuXG4vLyBJbnRlcmZhY2VzIGZvciBvdXIgZGF0YSB0eXBlc1xuaW50ZXJmYWNlIFByb2R1Y3Qge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgcHJpY2U6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFN0b2NrIHtcbiAgcHJvZHVjdF9pZDogc3RyaW5nO1xuICBjb3VudDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgUHJvZHVjdFdpdGhTdG9jayBleHRlbmRzIFByb2R1Y3Qge1xuICBjb3VudDogbnVtYmVyO1xufVxuXG4vLyBJbml0aWFsaXplIER5bmFtb0RCIGNsaWVudFxuY29uc3QgZHluYW1vRGIgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0RiKTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgLy8gTG9nIGluY29taW5nIHJlcXVlc3RcbiAgY29uc29sZS5sb2coJ0luY29taW5nIHJlcXVlc3Q6Jywge1xuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gICAgbWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczogZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzLFxuICAgIHJlcXVlc3RJZDogZXZlbnQucmVxdWVzdENvbnRleHQ/LnJlcXVlc3RJZCB8fCAnbm8tcmVxdWVzdC1pZCcsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgfSk7XG4gIFxuICBjb25zdCBwcm9kdWN0c1RhYmxlTmFtZSA9IHByb2Nlc3MuZW52LlBST0RVQ1RTX1RBQkxFITtcbiAgY29uc3Qgc3RvY2tzVGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuU1RPQ0tTX1RBQkxFITtcblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCdTdGFydGluZyB0byBmZXRjaCBhbGwgcHJvZHVjdHMgYW5kIHN0b2NrcycpO1xuXG4gICAgY29uc3QgcHJvZHVjdElkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnByb2R1Y3RJZDtcblxuICAgIGlmICghcHJvZHVjdElkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnTm8gcHJvZHVjdCBJRCBwcm92aWRlZCcgfSksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZldGNoIHByb2R1Y3QgYW5kIHN0b2NrIGRhdGEgaW4gcGFyYWxsZWxcbiAgICBjb25zdCBbcHJvZHVjdFJlc3BvbnNlLCBzdG9ja1Jlc3BvbnNlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIC8vIEdldCBwcm9kdWN0IGRldGFpbHNcbiAgICAgIGRvY0NsaWVudC5zZW5kKG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgICBUYWJsZU5hbWU6IHByb2R1Y3RzVGFibGVOYW1lLFxuICAgICAgICAgIEtleTogeyBpZDogcHJvZHVjdElkIH1cbiAgICAgIH0pKSxcbiAgICAgIC8vIEdldCBzdG9jayBkZXRhaWxzXG4gICAgICBkb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgICAgVGFibGVOYW1lOiBzdG9ja3NUYWJsZU5hbWUsXG4gICAgICAgICAgS2V5OiB7IHByb2R1Y3RfaWQ6IHByb2R1Y3RJZCB9XG4gICAgICB9KSlcbiAgICBdKTtcblxuICAgIGNvbnN0IHByb2R1Y3QgPSBwcm9kdWN0UmVzcG9uc2UuSXRlbSBhcyBQcm9kdWN0IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHN0b2NrID0gc3RvY2tSZXNwb25zZS5JdGVtIGFzIFN0b2NrIHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gQ2hlY2sgaWYgcHJvZHVjdCBleGlzdHNcbiAgICBpZiAoIXByb2R1Y3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1Byb2R1Y3Qgbm90IGZvdW5kJyBcbiAgICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQ29tYmluZSBwcm9kdWN0IGFuZCBzdG9jayBkYXRhXG4gICAgY29uc3QgcHJvZHVjdFdpdGhTdG9jazogUHJvZHVjdFdpdGhTdG9jayA9IHtcbiAgICAgIC4uLnByb2R1Y3QsXG4gICAgICBjb3VudDogc3RvY2s/LmNvdW50IHx8IDBcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwcm9kdWN0V2l0aFN0b2NrKSxcbiAgICB9O1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgcHJvZHVjdHM6Jywge1xuICAgICAgZXJyb3IsXG4gICAgICBldmVudDoge1xuICAgICAgICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gICAgICAgICAgbWV0aG9kOiBldmVudC5odHRwTWV0aG9kXG4gICAgICB9LFxuICAgICAgdGFibGVzOiB7XG4gICAgICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzVGFibGVOYW1lLFxuICAgICAgICAgIHN0b2Nrczogc3RvY2tzVGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgfSksXG4gICAgfTtcbiAgfVxufTtcbiJdfQ==