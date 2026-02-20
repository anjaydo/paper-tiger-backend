import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelegramService } from 'src/notifications/telegram.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let telegramService: TelegramService;

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockTelegramService = {
    sendLog: jest.fn(),
    sendOrderCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma }, // Bơm đồ giả vào
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    telegramService = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(prisma).toBeDefined();
    expect(eventEmitter).toBeDefined();
    expect(telegramService).toBeDefined();
  });

  it('nên tạo đơn hàng và trừ kho thành công', async () => {
    const dto = {
      customerName: 'Babe Test',
      items: [{ productId: 'p1', quantity: 1 }],
    };

    // Giả lập dữ liệu trả về từ DB
    (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      price: 100,
      stock: 10,
    });
    (mockPrisma.order.create as jest.Mock).mockResolvedValue({
      id: 'order1',
      ...dto,
      total: 100,
    });

    const result = await service.create(dto);

    expect(result.id).toEqual('order1');
    expect(mockPrisma.product.update).toHaveBeenCalled(); // Kiểm tra có gọi hàm trừ kho không
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'order.placed',
      expect.any(Object),
    ); // Kiểm tra có bắn event không
  });
});
