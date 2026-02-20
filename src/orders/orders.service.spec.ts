import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: {
    $transaction: jest.Mock;
    product: { findUnique: jest.Mock; update: jest.Mock };
    order: { create: jest.Mock };
  };
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest
        .fn()
        .mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
    };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create order, decrement stock, and emit order.placed', async () => {
      const dto = {
        customerName: 'Test Customer',
        items: [{ productId: 'p1', quantity: 2 }],
      };

      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        price: 100,
        stock: 10,
      });
      (mockPrisma.product.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.order.create as jest.Mock).mockResolvedValue({
        id: 'order-1',
        customerName: dto.customerName,
        total: 200,
        status: 'PENDING',
      });

      const result = await service.create(dto);

      expect(result.id).toBe('order-1');
      expect(result.total).toBe(200);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { decrement: 2 } },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.placed', {
        orderId: 'order-1',
        customer: 'Test Customer',
        total: 200,
      });
    });

    it('should throw BadRequestException when product not found', async () => {
      const dto = {
        customerName: 'Test',
        items: [{ productId: 'missing', quantity: 1 }],
      };

      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Sản phẩm missing không đủ hàng!',
      );
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when stock insufficient', async () => {
      const dto = {
        customerName: 'Test',
        items: [{ productId: 'p1', quantity: 5 }],
      };

      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        price: 100,
        stock: 2,
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Sản phẩm p1 không đủ hàng!',
      );
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return string', () => {
      expect(service.findAll()).toBe('This action returns all orders');
    });
  });

  describe('findOne', () => {
    it('should return string with id', () => {
      expect(service.findOne('id-1')).toBe('This action returns a #id-1 order');
    });
  });
});
