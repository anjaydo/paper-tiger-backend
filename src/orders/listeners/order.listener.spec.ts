import { Test, TestingModule } from '@nestjs/testing';
import { TrelloService } from 'src/trello/trello.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramService } from 'src/notifications/telegram.service';
import { OrderListener } from './order.listener';

describe('OrderListener', () => {
  let listener: OrderListener;
  let trelloService: TrelloService;
  let prisma: PrismaService;
  let telegramService: TelegramService;

  const mockTrelloCreateCard = jest.fn();
  const mockOrderFindUnique = jest.fn();
  const mockSendOrderCompleted = jest.fn();

  beforeEach(async () => {
    mockTrelloCreateCard.mockResolvedValue(undefined);
    mockOrderFindUnique.mockResolvedValue({ id: 'order-1', total: 100 });
    mockSendOrderCompleted.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderListener,
        {
          provide: TrelloService,
          useValue: { createCard: mockTrelloCreateCard },
        },
        {
          provide: PrismaService,
          useValue: { order: { findUnique: mockOrderFindUnique } },
        },
        {
          provide: TelegramService,
          useValue: { sendOrderCompleted: mockSendOrderCompleted },
        },
      ],
    }).compile();

    listener = module.get<OrderListener>(OrderListener);
    trelloService = module.get<TrelloService>(TrelloService);
    prisma = module.get<PrismaService>(PrismaService);
    telegramService = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
    expect(trelloService).toBeDefined();
    expect(prisma).toBeDefined();
    expect(telegramService).toBeDefined();
  });

  describe('handleOrderPlacedEvent', () => {
    it('should call trelloService.createCard with payload', async () => {
      const payload = { orderId: 'ord-1', customer: 'Customer', total: 200 };

      await listener.handleOrderPlacedEvent(payload);

      expect(mockTrelloCreateCard).toHaveBeenCalledWith(payload);
    });

    it('should not throw when createCard fails', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockTrelloCreateCard.mockRejectedValue(new Error('Trello error'));

      await expect(
        listener.handleOrderPlacedEvent({
          orderId: '1',
          customer: 'C',
          total: 0,
        }),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Thất bại khi tạo Card Trello',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('handleOrderCompletedEvent', () => {
    it('should fetch order and send telegram notification', async () => {
      const payload = { orderId: 'order-1' };
      const order = { id: 'order-1', total: 100, status: 'COMPLETED' };
      mockOrderFindUnique.mockResolvedValue(order);

      await listener.handleOrderCompletedEvent(payload);

      expect(mockOrderFindUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
      });
      expect(mockSendOrderCompleted).toHaveBeenCalledWith(order);
    });
  });
});
