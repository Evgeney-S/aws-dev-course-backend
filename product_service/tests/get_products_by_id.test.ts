import { handler } from '../lambda_functions/get_products_by_id';

describe('getProductsById', () => {
  it('should return product when found', async () => {
    const event = {
      pathParameters: { productId: '1' }
    } as any;

    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe(1);
  });

  it('should return 404 when product not found', async () => {
    const event = {
      pathParameters: { productId: 'nonexistent' }
    } as any;

    const result = await handler(event);
    
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Product not found');
  });
});
