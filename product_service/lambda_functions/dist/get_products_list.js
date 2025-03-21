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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0X3Byb2R1Y3RzX2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9nZXRfcHJvZHVjdHNfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0RBQTRFO0FBb0I1RSw2QkFBNkI7QUFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sU0FBUyxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVqRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRix1QkFBdUI7SUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRTtRQUMvQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQ3hCLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxxQkFBcUI7UUFDbEQsU0FBUyxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsU0FBUyxJQUFJLGVBQWU7UUFDN0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0tBQ3BDLENBQUMsQ0FBQztJQUVILE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFlLENBQUM7SUFDdEQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7SUFFbEQsSUFBSSxDQUFDO1FBRUgscUJBQXFCO1FBQ3JCLE1BQU0sZUFBZSxHQUFHLElBQUksMEJBQVcsQ0FBQztZQUNwQyxTQUFTLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUNILE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLEtBQWtCLENBQUM7UUFFckQsbUJBQW1CO1FBQ25CLE1BQU0sYUFBYSxHQUFHLElBQUksMEJBQVcsQ0FBQztZQUNsQyxTQUFTLEVBQUUsZUFBZTtTQUM3QixDQUFDLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLEtBQWdCLENBQUM7UUFFL0Msd0RBQXdEO1FBQ3hELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUN2RCxDQUFDO1FBRUYsd0NBQXdDO1FBQ3hDLE1BQU0saUJBQWlCLEdBQXVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLEdBQUcsT0FBTztZQUNWLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1NBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNMLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7YUFDckM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQztTQUMxQyxDQUFDO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFO1lBQ3hDLEtBQUs7WUFDTCxLQUFLLEVBQUU7Z0JBQ0gsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7YUFDM0I7WUFDRCxNQUFNLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsTUFBTSxFQUFFLGVBQWU7YUFDMUI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNqQixPQUFPLEVBQUUsdUJBQXVCO2dCQUNoQyxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTthQUNsRSxDQUFDO1NBQ0wsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUF6RVcsUUFBQSxPQUFPLFdBeUVsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1keW5hbW9kYlwiO1xuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgU2NhbkNvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvbGliLWR5bmFtb2RiXCI7XG4vLyBpbXBvcnQgeyBwcm9kdWN0cyB9IGZyb20gJy4vcHJvZHVjdHNfZGF0YSc7XG5cbi8vIEludGVyZmFjZXMgZm9yIG91ciBkYXRhIHR5cGVzXG5pbnRlcmZhY2UgUHJvZHVjdCB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBwcmljZTogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgU3RvY2sge1xuICBwcm9kdWN0X2lkOiBzdHJpbmc7XG4gIGNvdW50OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBQcm9kdWN0V2l0aFN0b2NrIGV4dGVuZHMgUHJvZHVjdCB7XG4gIGNvdW50OiBudW1iZXI7XG59XG5cbi8vIEluaXRpYWxpemUgRHluYW1vREIgY2xpZW50XG5jb25zdCBkeW5hbW9EYiA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vRGIpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICAvLyBMb2cgaW5jb21pbmcgcmVxdWVzdFxuICBjb25zb2xlLmxvZygnSW5jb21pbmcgcmVxdWVzdDonLCB7XG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgICBtZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMsXG4gICAgcmVxdWVzdElkOiBldmVudC5yZXF1ZXN0Q29udGV4dD8ucmVxdWVzdElkIHx8ICduby1yZXF1ZXN0LWlkJyxcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICB9KTtcblxuICBjb25zdCBwcm9kdWN0c1RhYmxlTmFtZSA9IHByb2Nlc3MuZW52LlBST0RVQ1RTX1RBQkxFITtcbiAgY29uc3Qgc3RvY2tzVGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuU1RPQ0tTX1RBQkxFITtcblxuICB0cnkge1xuXG4gICAgLy8gRmV0Y2ggYWxsIHByb2R1Y3RzXG4gICAgY29uc3QgcHJvZHVjdHNDb21tYW5kID0gbmV3IFNjYW5Db21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiBwcm9kdWN0c1RhYmxlTmFtZSxcbiAgICB9KTtcbiAgICBjb25zdCBwcm9kdWN0c1Jlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQocHJvZHVjdHNDb21tYW5kKTtcbiAgICBjb25zdCBwcm9kdWN0cyA9IHByb2R1Y3RzUmVzcG9uc2UuSXRlbXMgYXMgUHJvZHVjdFtdO1xuXG4gICAgLy8gRmV0Y2ggYWxsIHN0b2Nrc1xuICAgIGNvbnN0IHN0b2Nrc0NvbW1hbmQgPSBuZXcgU2NhbkNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHN0b2Nrc1RhYmxlTmFtZSxcbiAgICB9KTtcbiAgICBjb25zdCBzdG9ja3NSZXNwb25zZSA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKHN0b2Nrc0NvbW1hbmQpO1xuICAgIGNvbnN0IHN0b2NrcyA9IHN0b2Nrc1Jlc3BvbnNlLkl0ZW1zIGFzIFN0b2NrW107XG5cbiAgICAvLyBDcmVhdGUgYSBtYXAgb2YgcHJvZHVjdF9pZCB0byBjb3VudCBmb3IgZWFzaWVyIGxvb2t1cFxuICAgIGNvbnN0IHN0b2Nrc01hcCA9IG5ldyBNYXAoXG4gICAgICAgIHN0b2Nrcy5tYXAoc3RvY2sgPT4gW3N0b2NrLnByb2R1Y3RfaWQsIHN0b2NrLmNvdW50XSlcbiAgICApO1xuXG4gICAgLy8gSm9pbiBwcm9kdWN0cyB3aXRoIHRoZWlyIHN0b2NrIGNvdW50c1xuICAgIGNvbnN0IHByb2R1Y3RzV2l0aFN0b2NrOiBQcm9kdWN0V2l0aFN0b2NrW10gPSBwcm9kdWN0cy5tYXAocHJvZHVjdCA9PiAoe1xuICAgICAgICAuLi5wcm9kdWN0LFxuICAgICAgICBjb3VudDogc3RvY2tzTWFwLmdldChwcm9kdWN0LmlkKSB8fCAwXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwcm9kdWN0c1dpdGhTdG9jayksXG4gICAgfTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHByb2R1Y3RzOicsIHtcbiAgICAgIGVycm9yLFxuICAgICAgZXZlbnQ6IHtcbiAgICAgICAgICBwYXRoOiBldmVudC5wYXRoLFxuICAgICAgICAgIG1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZFxuICAgICAgfSxcbiAgICAgIHRhYmxlczoge1xuICAgICAgICAgIHByb2R1Y3RzOiBwcm9kdWN0c1RhYmxlTmFtZSxcbiAgICAgICAgICBzdG9ja3M6IHN0b2Nrc1RhYmxlTmFtZVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICAgIH0pLFxuICAgIH07XG4gIH1cbn07XG4iXX0=