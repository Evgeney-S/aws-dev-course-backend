import { handler } from '../lambda_functions/get_products_list';

describe('getProductsList', () => {
  it('should return all products', async () => {
    const result = await handler({} as any);
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});
