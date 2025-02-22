export interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    count: number;
  }
  
  export const products: Product[] = [
    {
      id: 1,
      title: "Product 1",
      description: "Description for product 1",
      price: 100,
      count: 10,
    },
    {
      id: 2,
      title: "Product 2",
      description: "Description for product 2",
      price: 200,
      count: 20,
    },
    {
      id: 3,
      title: "Product 3",
      description: "Description for product 3",
      price: 300,
      count: 30,
    },
    {
      id: 4,
      title: "Product 4",
      description: "Description for product 4",
      price: 400,
      count: 40,
    },
  ];
  