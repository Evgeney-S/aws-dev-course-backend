"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var products_data_1 = require("./lambda_functions/products_data");
// Initialize DynamoDB client
var client = new client_dynamodb_1.DynamoDBClient({ region: "eu-north-1" });
var docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
// Function to chunk array into smaller arrays
// We have only 4 products, so we don't need to worry about pagination, but, still, let's do the universal solution
var chunkArray = function (arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, function (_, i) {
        return arr.slice(i * size, i * size + size);
    });
};
// Function to prepare products data
var prepareProductsData = function (productsArray) {
    return productsArray.map(function (product) { return ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price
    }); });
};
// Function to prepare stocks data
var prepareStocksData = function (productsArray) {
    return productsArray.map(function (product) { return ({
        product_id: product.id,
        count: product.count || 0
    }); });
};
// Function to write items to DynamoDB
function batchWriteItems(tableName, items) {
    return __awaiter(this, void 0, void 0, function () {
        var chunks, _i, chunks_1, chunk, writeRequests, command, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    chunks = chunkArray(items, 25);
                    _i = 0, chunks_1 = chunks;
                    _b.label = 1;
                case 1:
                    if (!(_i < chunks_1.length)) return [3 /*break*/, 4];
                    chunk = chunks_1[_i];
                    writeRequests = chunk.map(function (item) { return ({
                        PutRequest: {
                            Item: item
                        }
                    }); });
                    command = new lib_dynamodb_1.BatchWriteCommand({
                        RequestItems: (_a = {},
                            _a[tableName] = writeRequests,
                            _a)
                    });
                    return [4 /*yield*/, docClient.send(command)];
                case 2:
                    _b.sent();
                    console.log("Successfully wrote ".concat(chunk.length, " items to ").concat(tableName));
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("Completed writing all items to ".concat(tableName));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    console.error("Error writing items to ".concat(tableName, ":"), error_1);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Main function to populate both tables
function populateTables() {
    return __awaiter(this, void 0, void 0, function () {
        var PRODUCTS_TABLE, STOCKS_TABLE, productsData, stocksData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    PRODUCTS_TABLE = 'products';
                    STOCKS_TABLE = 'stocks';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    productsData = prepareProductsData(products_data_1.products);
                    stocksData = prepareStocksData(products_data_1.products);
                    // Write to products table first
                    console.log('Starting to write products data...');
                    return [4 /*yield*/, batchWriteItems(PRODUCTS_TABLE, productsData)];
                case 2:
                    _a.sent();
                    // Then write to stocks table
                    console.log('Starting to write stocks data...');
                    return [4 /*yield*/, batchWriteItems(STOCKS_TABLE, stocksData)];
                case 3:
                    _a.sent();
                    console.log('Successfully populated both tables');
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Failed to populate tables:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Run the script
populateTables();
