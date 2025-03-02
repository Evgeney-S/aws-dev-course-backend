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
        // Fetch all products
        const productsCommand = new lib_dynamodb_1.ScanCommand({
            TableName: productsTableName,
        });
        const productsResponse = await docClient.send(productsCommand);
        const products = productsResponse.Items;
        // Fetch all stocks
        const stocksCommand = new lib_dynamodb_1.ScanCommand({
            TableName: stocksTableName,
        });
        const stocksResponse = await docClient.send(stocksCommand);
        const stocks = stocksResponse.Items;
        // Create a map of product_id to count for easier lookup
        const stocksMap = new Map(stocks.map(stock => [stock.product_id, stock.count]));
        // Join products with their stock counts
        const productsWithStock = products.map(product => ({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3Byb2R1Y3RzX2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9nZXRfcHJvZHVjdHNfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0RBQTRFO0FBb0I1RSw2QkFBNkI7QUFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sU0FBUyxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVqRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRix1QkFBdUI7SUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRTtRQUMvQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQ3hCLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxxQkFBcUI7UUFDbEQsU0FBUyxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsU0FBUyxJQUFJLGVBQWU7UUFDN0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0tBQ3BDLENBQUMsQ0FBQztJQUVILE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFlLENBQUM7SUFDdEQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7SUFFbEQsSUFBSSxDQUFDO1FBRUgscUJBQXFCO1FBQ3JCLE1BQU0sZUFBZSxHQUFHLElBQUksMEJBQVcsQ0FBQztZQUNwQyxTQUFTLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUNILE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLEtBQWtCLENBQUM7UUFFckQsbUJBQW1CO1FBQ25CLE1BQU0sYUFBYSxHQUFHLElBQUksMEJBQVcsQ0FBQztZQUNsQyxTQUFTLEVBQUUsZUFBZTtTQUM3QixDQUFDLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLEtBQWdCLENBQUM7UUFFL0Msd0RBQXdEO1FBQ3hELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUN2RCxDQUFDO1FBRUYsd0NBQXdDO1FBQ3hDLE1BQU0saUJBQWlCLEdBQXVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLEdBQUcsT0FBTztZQUNWLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1NBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7YUFDckM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQztTQUMxQyxDQUFDO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFO1lBQ3hDLEtBQUs7WUFDTCxLQUFLLEVBQUU7Z0JBQ0gsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7YUFDM0I7WUFDRCxNQUFNLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsTUFBTSxFQUFFLGVBQWU7YUFDMUI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNqQixPQUFPLEVBQUUsdUJBQXVCO2dCQUNoQyxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTthQUNsRSxDQUFDO1NBQ0wsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUF6RVcsUUFBQSxPQUFPLFdBeUVsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiXCI7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFNjYW5Db21tYW5kIH0gZnJvbSBcIkBhd3Mtc2RrL2xpYi1keW5hbW9kYlwiO1xyXG4vLyBpbXBvcnQgeyBwcm9kdWN0cyB9IGZyb20gJy4vcHJvZHVjdHNfZGF0YSc7XHJcblxyXG4vLyBJbnRlcmZhY2VzIGZvciBvdXIgZGF0YSB0eXBlc1xyXG5pbnRlcmZhY2UgUHJvZHVjdCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG4gIHByaWNlOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBTdG9jayB7XHJcbiAgcHJvZHVjdF9pZDogc3RyaW5nO1xyXG4gIGNvdW50OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBQcm9kdWN0V2l0aFN0b2NrIGV4dGVuZHMgUHJvZHVjdCB7XHJcbiAgY291bnQ6IG51bWJlcjtcclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSBEeW5hbW9EQiBjbGllbnRcclxuY29uc3QgZHluYW1vRGIgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xyXG5jb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vRGIpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcclxuICAvLyBMb2cgaW5jb21pbmcgcmVxdWVzdFxyXG4gIGNvbnNvbGUubG9nKCdJbmNvbWluZyByZXF1ZXN0OicsIHtcclxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXHJcbiAgICBtZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXHJcbiAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycyxcclxuICAgIHJlcXVlc3RJZDogZXZlbnQucmVxdWVzdENvbnRleHQ/LnJlcXVlc3RJZCB8fCAnbm8tcmVxdWVzdC1pZCcsXHJcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBwcm9kdWN0c1RhYmxlTmFtZSA9IHByb2Nlc3MuZW52LlBST0RVQ1RTX1RBQkxFITtcclxuICBjb25zdCBzdG9ja3NUYWJsZU5hbWUgPSBwcm9jZXNzLmVudi5TVE9DS1NfVEFCTEUhO1xyXG5cclxuICB0cnkge1xyXG5cclxuICAgIC8vIEZldGNoIGFsbCBwcm9kdWN0c1xyXG4gICAgY29uc3QgcHJvZHVjdHNDb21tYW5kID0gbmV3IFNjYW5Db21tYW5kKHtcclxuICAgICAgICBUYWJsZU5hbWU6IHByb2R1Y3RzVGFibGVOYW1lLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBwcm9kdWN0c1Jlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQocHJvZHVjdHNDb21tYW5kKTtcclxuICAgIGNvbnN0IHByb2R1Y3RzID0gcHJvZHVjdHNSZXNwb25zZS5JdGVtcyBhcyBQcm9kdWN0W107XHJcblxyXG4gICAgLy8gRmV0Y2ggYWxsIHN0b2Nrc1xyXG4gICAgY29uc3Qgc3RvY2tzQ29tbWFuZCA9IG5ldyBTY2FuQ29tbWFuZCh7XHJcbiAgICAgICAgVGFibGVOYW1lOiBzdG9ja3NUYWJsZU5hbWUsXHJcbiAgICB9KTtcclxuICAgIGNvbnN0IHN0b2Nrc1Jlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQoc3RvY2tzQ29tbWFuZCk7XHJcbiAgICBjb25zdCBzdG9ja3MgPSBzdG9ja3NSZXNwb25zZS5JdGVtcyBhcyBTdG9ja1tdO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIG1hcCBvZiBwcm9kdWN0X2lkIHRvIGNvdW50IGZvciBlYXNpZXIgbG9va3VwXHJcbiAgICBjb25zdCBzdG9ja3NNYXAgPSBuZXcgTWFwKFxyXG4gICAgICAgIHN0b2Nrcy5tYXAoc3RvY2sgPT4gW3N0b2NrLnByb2R1Y3RfaWQsIHN0b2NrLmNvdW50XSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gSm9pbiBwcm9kdWN0cyB3aXRoIHRoZWlyIHN0b2NrIGNvdW50c1xyXG4gICAgY29uc3QgcHJvZHVjdHNXaXRoU3RvY2s6IFByb2R1Y3RXaXRoU3RvY2tbXSA9IHByb2R1Y3RzLm1hcChwcm9kdWN0ID0+ICh7XHJcbiAgICAgICAgLi4ucHJvZHVjdCxcclxuICAgICAgICBjb3VudDogc3RvY2tzTWFwLmdldChwcm9kdWN0LmlkKSB8fCAwXHJcbiAgICB9KSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwcm9kdWN0c1dpdGhTdG9jayksXHJcbiAgICB9O1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgcHJvZHVjdHM6Jywge1xyXG4gICAgICBlcnJvcixcclxuICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgIHBhdGg6IGV2ZW50LnBhdGgsXHJcbiAgICAgICAgICBtZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2RcclxuICAgICAgfSxcclxuICAgICAgdGFibGVzOiB7XHJcbiAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHNUYWJsZU5hbWUsXHJcbiAgICAgICAgICBzdG9ja3M6IHN0b2Nrc1RhYmxlTmFtZVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBcclxuICAgICAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgIH0pLFxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcbiJdfQ==