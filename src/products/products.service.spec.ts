import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: { product: { findMany: jest.Mock } };

  beforeEach(async () => {
    mockPrisma = {
      product: { findMany: jest.fn() },
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
    it('should return placeholder string', () => {
      expect(service.create({ name: 'A', price: 100 })).toBe(
        'This action adds a new product',
      );
    });
  });

  describe('findAll', () => {
    it('should return products from prisma', async () => {
      const products = [{ id: '1', name: 'P1', price: 100 }];
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products);

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
