import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: { product: { findMany: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    mockPrisma = {
      product: { findMany: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call prisma.product.create and return created product', async () => {
      const dto = { name: 'A', price: 100, stock: 10 };
      const created = { id: 'prod-1', name: 'A', price: 100, stock: 10 };
      mockPrisma.product.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toMatchObject(created);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { name: 'A', price: 100, stock: 10 },
      });
    });

    it('should pass stock 0 when stock is omitted (stock ?? 0)', async () => {
      const dto = { name: 'B', price: 50 };
      const created = { id: 'prod-2', name: 'B', price: 50, stock: 0 };
      mockPrisma.product.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toMatchObject(created);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { name: 'B', price: 50, stock: 0 },
      });
    });
  });

  describe('findAll', () => {
    it('should return products from prisma', async () => {
      const products = [{ id: '1', name: 'P1', price: 100 }];
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return string with id', () => {
      expect(service.findOne('id-1')).toBe(
        'This action returns a #id-1 product',
      );
    });
  });

  describe('update', () => {
    it('should return placeholder string', () => {
      expect(service.update('id-1', {})).toBe(
        'This action updates a #id-1 product',
      );
    });
  });

  describe('remove', () => {
    it('should return placeholder string', () => {
      expect(service.remove('id-1')).toBe(
        'This action removes a #id-1 product',
      );
    });
  });
});
