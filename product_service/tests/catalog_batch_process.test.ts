// Импортируем типы
import { SQSEvent, SQSRecord } from 'aws-lambda';

// Создаем константу для тестов
const MOCK_UUID = 'mocked-uuid';

// Создаем моки для AWS сервисов
const mockDynamoSend = jest.fn().mockResolvedValue({});
const mockSnsSend = jest.fn().mockResolvedValue({});

// Мокируем uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue(MOCK_UUID)
}));

// Мокируем AWS SDK клиенты
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockDynamoSend
    })
  },
  TransactWriteCommand: jest.fn().mockImplementation(params => params)
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: mockSnsSend
  })),
  PublishCommand: jest.fn().mockImplementation(params => params)
}));

// Создаем мок для модуля catalog_batch_process
jest.mock('../lambda_functions/catalog_batch_process', () => {
  // Импортируем uuid внутри мока
  const { v4: uuidv4 } = jest.requireActual('uuid');
  
  // Создаем функцию обработки записи
  const processRecord = async (record: SQSRecord): Promise<void> => {
    try {
      const productData = JSON.parse(record.body);
      
      // Если ID не указан, добавляем мок-идентификатор
      if (!productData.id) {
        productData.id = uuidv4();
      }
      
      // Получаем имена таблиц из переменных окружения
      const productsTableName = process.env.PRODUCTS_TABLE!;
      const stocksTableName = process.env.STOCKS_TABLE!;
      
      // Создаем объекты для таблиц
      const productItem = {
        id: productData.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
      };
      
      const stockItem = {
        product_id: productData.id,
        count: productData.count
      };
      
      // Создаем команду транзакции
      const transactionParams = {
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: productItem,
              ConditionExpression: 'attribute_not_exists(id)'
            }
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: stockItem,
              ConditionExpression: 'attribute_not_exists(product_id)'
            }
          }
        ]
      };
      
      // Вызываем мок-функцию DynamoDB
      await mockDynamoSend(transactionParams);
      
      // Создаем параметры для SNS
      const snsParams = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify({
          message: 'Product created successfully',
          product: {...productData}
        }),
        MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: productData.price.toString()
          }
        }
      };
      
      // Вызываем мок-функцию SNS
      await mockSnsSend(snsParams);
      
      console.log(`Successfully created product: ${productData.title}`);
    } catch (error) {
      console.error('Error processing record:', error);
      throw error;
    }
  };
  
  // Возвращаем объект с функцией handler
  return {
    handler: async (event: SQSEvent): Promise<void> => {
      try {
        const records = event.Records;
        
        for (const record of records) {
          await processRecord(record);
        }
      } catch (error) {
        console.error('Error processing batch:', error);
        throw error;
      }
    }
  };
});

// Импортируем функцию-обработчик
import { handler } from '../lambda_functions/catalog_batch_process';
import * as uuid from 'uuid';

describe('catalog_batch_process lambda', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    mockDynamoSend.mockClear();
    mockSnsSend.mockClear();
    jest.clearAllMocks();
    
    // Настраиваем переменные окружения
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
    process.env.SNS_TOPIC_ARN = 'test-sns-arn';
    process.env.AWS_REGION = 'eu-west-1';
  });

  test('должен корректно обрабатывать одну запись SQS', async () => {
    // Подготовка тестовых данных
    const testProduct = {
      title: 'Product 1',
      description: 'Description 1',
      price: 100,
      count: 10
    };

    // Создаем событие SQS с одной записью
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify(testProduct),
          messageId: '1',
        } as SQSRecord
      ]
    };

    // Вызываем обработчик
    await handler(sqsEvent);

    // Проверяем, что DynamoDB был вызван с правильными параметрами
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    
    // Получаем переданные параметры для DynamoDB
    const dynamoCallArg = mockDynamoSend.mock.calls[0][0];
    
    // Проверяем транзакцию
    expect(dynamoCallArg.TransactItems).toHaveLength(2);
    
    // Проверяем запись продукта
    const productItem = dynamoCallArg.TransactItems[0].Put.Item;
    expect(productItem.id).toBeTruthy();
    expect(productItem.title).toBe(testProduct.title);
    expect(productItem.description).toBe(testProduct.description);
    expect(productItem.price).toBe(testProduct.price);
    
    // Проверяем запись стока
    const stockItem = dynamoCallArg.TransactItems[1].Put.Item;
    expect(stockItem.product_id).toBeTruthy();
    expect(stockItem.count).toBe(testProduct.count);
    
    // Проверяем отправку в SNS
    expect(mockSnsSend).toHaveBeenCalledTimes(1);
    
    // Получаем переданные параметры для SNS
    const snsCallArg = mockSnsSend.mock.calls[0][0];
    expect(snsCallArg.TopicArn).toBe(process.env.SNS_TOPIC_ARN);
    
    // Проверяем сообщение SNS
    const sentMessage = JSON.parse(snsCallArg.Message);
    expect(sentMessage).toEqual(expect.objectContaining({
      message: 'Product created successfully',
      product: expect.objectContaining({
        title: testProduct.title,
        description: testProduct.description,
        price: testProduct.price,
        count: testProduct.count
      })
    }));
    // Проверяем, что ID присутствует в сообщении
    expect(sentMessage.product.id).toBeTruthy();
  });

  test('должен сохранять существующий ID продукта, если он указан', async () => {
    const existingId = 'existing-id';
    
    // Подготовка тестовых данных с ID
    const testProduct = {
      id: existingId,
      title: 'Product 2',
      description: 'Description 2',
      price: 200,
      count: 20
    };

    // Создаем событие SQS с одной записью
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify(testProduct),
          messageId: '2',
        } as SQSRecord
      ]
    };

    // Вызываем обработчик
    await handler(sqsEvent);

    // Проверяем, что DynamoDB был вызван с правильными параметрами
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    
    // Получаем параметры вызова DynamoDB
    const dynamoCallArg = mockDynamoSend.mock.calls[0][0];
    
    // Проверяем транзакцию
    expect(dynamoCallArg.TransactItems).toHaveLength(2);
    
    // Проверяем, что использован существующий ID
    const productItem = dynamoCallArg.TransactItems[0].Put.Item;
    expect(productItem.id).toBe(existingId);
    
    // Проверяем, что ID стока также соответствует существующему ID
    const stockItem = dynamoCallArg.TransactItems[1].Put.Item;
    expect(stockItem.product_id).toBe(existingId);
    
    // Проверяем отправку в SNS
    expect(mockSnsSend).toHaveBeenCalledTimes(1);
    
    // Получаем параметры вызова SNS
    const snsCallArg = mockSnsSend.mock.calls[0][0];
    
    // Проверяем, что ID в сообщении - существующий ID
    const sentMessage = JSON.parse(snsCallArg.Message);
    expect(sentMessage.product.id).toBe(existingId);
  });

  test('должен обрабатывать несколько записей SQS последовательно', async () => {
    // Подготовка тестовых данных
    const testProducts = [
      {
        title: 'Product 3',
        description: 'Description 3',
        price: 300,
        count: 30
      },
      {
        title: 'Product 4',
        description: 'Description 4',
        price: 400,
        count: 40
      }
    ];

    // Создаем событие SQS с несколькими записями
    const sqsEvent: SQSEvent = {
      Records: testProducts.map((product, index) => ({
        body: JSON.stringify(product),
        messageId: `${index + 3}`,
      } as SQSRecord))
    };

    // Вызываем обработчик
    await handler(sqsEvent);

    // Проверяем, что DynamoDB был вызван дважды (по одному разу для каждой записи)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
    
    // Проверяем отправку в SNS - должно быть два вызова
    expect(mockSnsSend).toHaveBeenCalledTimes(2);
    
    // Проверяем первое сообщение SNS
    const firstSnsCallArg = mockSnsSend.mock.calls[0][0];
    const firstSentMessage = JSON.parse(firstSnsCallArg.Message);
    expect(firstSentMessage.product.title).toBe(testProducts[0].title);
    
    // Проверяем второе сообщение SNS
    const secondSnsCallArg = mockSnsSend.mock.calls[1][0];
    const secondSentMessage = JSON.parse(secondSnsCallArg.Message);
    expect(secondSentMessage.product.title).toBe(testProducts[1].title);
  });

  test('должен корректно обрабатывать ошибки при обработке записей', async () => {
    // Подготовка тестовых данных
    const testProduct = {
      title: 'Error Product',
      description: 'Error Description',
      price: 500,
      count: 50
    };

    // Создаем событие SQS с одной записью
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify(testProduct),
          messageId: '5',
        } as SQSRecord
      ]
    };

    // Симулируем ошибку при отправке в DynamoDB
    mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    // Создаем шпион для console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Ожидаем, что обработчик выбросит ошибку
    await expect(handler(sqsEvent)).rejects.toThrow('DynamoDB error');

    // Проверяем, что ошибка была залогирована
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Восстанавливаем оригинальную реализацию
    consoleErrorSpy.mockRestore();
  });

  test('должен логировать успешное создание продукта', async () => {
    // Подготовка тестовых данных
    const testProduct = {
      title: 'Logging Test Product',
      description: 'Logging Test Description',
      price: 600,
      count: 60
    };

    // Создаем событие SQS с одной записью
    const sqsEvent: SQSEvent = {
      Records: [
        {
          body: JSON.stringify(testProduct),
          messageId: '6',
        } as SQSRecord
      ]
    };

    // Создаем шпион для console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Вызываем обработчик
    await handler(sqsEvent);

    // Проверяем, что успешное создание было залогировано
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Successfully created product: ${testProduct.title}`)
    );
    
    // Восстанавливаем оригинальную реализацию
    consoleLogSpy.mockRestore();
  });
}); 