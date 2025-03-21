// Создаем моки для AWS сервисов
const mockDynamoSend = jest.fn().mockImplementation((command) => {
  // Проверяем тип команды по наличию определенных полей
  if (command.TableName === 'test-products') {
    return Promise.resolve({
      Items: [
        { id: '1', title: 'Test Product 1', description: 'Description 1', price: 100 },
        { id: '2', title: 'Test Product 2', description: 'Description 2', price: 200 }
      ]
    });
  } else if (command.TableName === 'test-stocks') {
    return Promise.resolve({
      Items: [
        { product_id: '1', count: 10 },
        { product_id: '2', count: 20 }
      ]
    });
  }
  return Promise.resolve({ Items: [] });
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
  ScanCommand: jest.fn().mockImplementation(params => params)
}));

// Импортируем функцию-обработчик после настройки моков
import { handler } from '../lambda_functions/get_products_list';

describe('getProductsList', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    mockDynamoSend.mockClear();
    jest.clearAllMocks();
    
    // Настраиваем переменные окружения
    process.env.PRODUCTS_TABLE = 'test-products';
    process.env.STOCKS_TABLE = 'test-stocks';
  });

  it('должен возвращать все продукты со стоками', async () => {
    // Подготавливаем тестовый запрос
    const event = {
      httpMethod: 'GET',
      path: '/products',
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
    
    // Проверяем, что ответ - массив
    expect(Array.isArray(body)).toBe(true);
    
    // Проверяем количество продуктов
    expect(body.length).toBe(2);
    
    // Проверяем содержимое первого продукта
    expect(body[0]).toEqual({
      id: '1',
      title: 'Test Product 1',
      description: 'Description 1',
      price: 100,
      count: 10
    });
    
    // Проверяем содержимое второго продукта
    expect(body[1]).toEqual({
      id: '2',
      title: 'Test Product 2',
      description: 'Description 2',
      price: 200,
      count: 20
    });
    
    // Проверяем, что DynamoDB вызывался дважды (для продуктов и стоков)
    expect(mockDynamoSend).toHaveBeenCalledTimes(2);
  });

  it('должен возвращать ошибку 500 при проблемах с базой данных', async () => {
    // Симулируем ошибку в базе данных
    mockDynamoSend.mockRejectedValueOnce(new Error('Database error'));

    // Подготавливаем тестовый запрос
    const event = {
      httpMethod: 'GET',
      path: '/products',
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
