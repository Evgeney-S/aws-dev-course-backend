import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { products } from './lambda_functions/products_data';

// Define interfaces for our data structures
interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    count?: number;
}

interface Stock {
    product_id: string;
    count: number;
}

interface ProductRecord {
    id: string;
    title: string;
    description?: string;
    price: number;
}

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Function to chunk array into smaller arrays
// We have only 4 products, so we don't need to worry about pagination, but, still, let's do the universal solution
const chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
};

// Function to prepare products data
const prepareProductsData = (productsArray: Product[]): ProductRecord[] => {
    return productsArray.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price
    }));
};

// Function to prepare stocks data
const prepareStocksData = (productsArray: Product[]): Stock[] => {
    return productsArray.map(product => ({
        product_id: product.id,
        count: product.count || 0
    }));
};

// Function to write items to DynamoDB
async function batchWriteItems(tableName: string, items: Record<string, any>[]): Promise<void> {
    try {
        const chunks = chunkArray(items, 25);

        for (const chunk of chunks) {
            const writeRequests = chunk.map(item => ({
                PutRequest: {
                    Item: item
                }
            }));

            const command = new BatchWriteCommand({
                RequestItems: {
                    [tableName]: writeRequests
                }
            });

            await docClient.send(command);
            console.log(`Successfully wrote ${chunk.length} items to ${tableName}`);
        }

        console.log(`Completed writing all items to ${tableName}`);
    } catch (error) {
        console.error(`Error writing items to ${tableName}:`, error);
        throw error;
    }
}

// Main function to populate both tables
async function populateTables(): Promise<void> {
    const PRODUCTS_TABLE = 'products';
    const STOCKS_TABLE = 'stocks';
    
    try {
        // Prepare data for both tables
        const productsData = prepareProductsData(products);
        const stocksData = prepareStocksData(products);

        // Write to products table first
        console.log('Starting to write products data...');
        await batchWriteItems(PRODUCTS_TABLE, productsData);

        // Then write to stocks table
        console.log('Starting to write stocks data...');
        await batchWriteItems(STOCKS_TABLE, stocksData);

        console.log('Successfully populated both tables');
    } catch (error) {
        console.error('Failed to populate tables:', error);
    }
}

// Run the script
populateTables();
