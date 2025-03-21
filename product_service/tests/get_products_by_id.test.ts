// Создаем моки для AWS сервисов
const mockDynamoSend = jest.fn().mockImplementation((command) => {
  // Проверяем тип команды и ID продукта
  if (command.Key && command.Key.id === '1' && command.TableName === 'test-products') {
    return Promise.resolve({
      Item: { id: '1', title: 'Test Product', description: 'Test Description', price: 100 }
    });
  } else if (command.Key && command.Key.product_id === '1' && command.TableName === 'test-stocks') {
    return Promise.resolve({
      Item: { product_id: '1', count: 10 }
    });
  } else if (command.Key && command.Key.id && command.TableName === 'test-products') {
    // Любой другой ID продукта - возвращаем пустой результат
    return Promise.resolve({
      Item: undefined
    });
  } else if (command.Key && command.Key.product_id && command.TableName === 'test-stocks') {
    // Любой другой ID стока - возвращаем пустой результат
    return Promise.resolve({
      Item: undefined
    });
  }
  return Promise.resolve({});
});

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
  GetCommand: jest.fn().mockImplementation(params => params)
}));

// Импортируем функцию-обработчик после настройки моков
import { handler } from '../lambda_functions/get_products_by_id';

describe('getProductsById', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    mockDynamoSend.mockClear();
    jest.clearAllMocks();
    
    // Настраиваем переменные окружения
    process.env.PRODUCTS_TABLE = 'test-products';
    process.env.STOCKS_TABLE = 'test-stocks';
  });

  it('должен возвращать продукт, если он найден', async () => {
    // Подготавливаем тестовый запрос
    const event = {
      httpMethod: 'GET',
      path: '/products/1',
      pathParameters: { productId: '1' },
      requestContext: {
        requestId: 'test-request-id'
      }
    } as any;

    // Вызываем обработчик
    const result = await handler(event);
    
    // Проверяем код ответа
    expect(result.statusCode).toBe(200);
    
    // Парсим тело ответа
    const body = JSON.parse(result.body);
    
    // Проверяем содержимое продукта
    expect(body).toEqual({
      id: '1',
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      count: 10
    });
    
    // Проверяем, что DynamoDB вызывался дважды (для продукта и стока)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('должен возвращать 404, если продукт не найден', async () => {
    // Подготавливаем тестовый запрос
    const event = {
      httpMethod: 'GET',
      path: '/products/nonexistent',
      pathParameters: { productId: 'nonexistent' },
      requestContext: {
        requestId: 'test-request-id'
      }
    } as any;

    // Вызываем обработчик
    const result = await handler(event);
    
    // Проверяем код ответа
    expect(result.statusCode).toBe(404);
    
    // Парсим тело ответа
    const body = JSON.parse(result.body);
    
    // Проверяем сообщение об ошибке
    expect(body.message).toBe('Product not found');
  });

  it('должен возвращать 400, если ID продукта не указан', async () => {
    // Подготавливаем тестовый запрос без ID продукта
    const event = {
      httpMethod: 'GET',
      path: '/products/',
      pathParameters: null,
      requestContext: {
        requestId: 'test-request-id'
      }
    } as any;

    // Вызываем обработчик
    const result = await handler(event);
    
    // Проверяем код ответа
    expect(result.statusCode).toBe(400);
    
    // Парсим тело ответа
    const body = JSON.parse(result.body);
    
    // Проверяем сообщение об ошибке
    expect(body.message).toBe('No product ID provided');
  });

  it('должен возвращать 500 при проблемах с базой данных', async () => {
    // Симулируем ошибку в базе данных
    mockDynamoSend.mockRejectedValueOnce(new Error('Database error'));

    // Подготавливаем тестовый запрос
    const event = {
      httpMethod: 'GET',
      path: '/products/1',
      pathParameters: { productId: '1' },
      requestContext: {
        requestId: 'test-request-id'
      }
    } as any;

    // Вызываем обработчик
    const result = await handler(event);
    
    // Проверяем код ответа
    expect(result.statusCode).toBe(500);
    
    // Парсим тело ответа
    const body = JSON.parse(result.body);
    
    // Проверяем сообщение об ошибке
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Database error');
  });
});
