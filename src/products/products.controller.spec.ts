import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockPrisma = {
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call service create and return created product', async () => {
      const dto = { name: 'P', price: 10, stock: 5 };
      const created = { id: 'prod-1', name: 'P', price: 10, stock: 5 };
      mockPrisma.product.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toMatchObject(created);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { name: 'P', price: 10, stock: 5 },
      });
    });

    it('should pass stock 0 when stock is omitted (stock ?? 0)', async () => {
      const dto = { name: 'Q', price: 20 };
      const created = { id: 'prod-2', name: 'Q', price: 20, stock: 0 };
      mockPrisma.product.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toMatchObject(created);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { name: 'Q', price: 20, stock: 0 },
      });
    });
  });

  describe('findAll', () => {
    it('should return service findAll result', async () => {
      const products = [{ id: '1', name: 'P1' }];
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return service findOne result', () => {
      expect(controller.findOne('id-1')).toBe(
        'This action returns a #id-1 product',
      );
    });
  });

  describe('update', () => {
    it('should return service update result', () => {
      expect(controller.update('id-1', {})).toBe(
        'This action updates a #id-1 product',
      );
    });
  });

  describe('remove', () => {
    it('should return service remove result', () => {
      expect(controller.remove('id-1')).toBe(
        'This action removes a #id-1 product',
      );
    });
  });
});
