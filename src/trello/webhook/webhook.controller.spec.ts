import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelegramService } from 'src/notifications/telegram.service';
import { TrelloWebhookController } from './webhook.controller';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TrelloWebhookController', () => {
  let controller: TrelloWebhookController;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockOrderUpdateManyAndReturn = jest.fn();
  const mockConfigGet = jest.fn();
  const mockEmit = jest.fn();

  beforeEach(async () => {
    mockConfigGet.mockReturnValue('custom-field-shipping-id');
    mockOrderUpdateManyAndReturn.mockResolvedValue([]);
    mockEmit.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrelloWebhookController],
      providers: [
        { provide: ConfigService, useValue: { get: mockConfigGet } },
        {
          provide: PrismaService,
          useValue: {
            order: { updateManyAndReturn: mockOrderUpdateManyAndReturn },
          },
        },
        { provide: EventEmitter2, useValue: { emit: mockEmit } },
        { provide: TelegramService, useValue: { sendLog: jest.fn(), sendOrderCompleted: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TrelloWebhookController>(TrelloWebhookController);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prisma).toBeDefined();
    expect(eventEmitter).toBeDefined();
  });

  describe('verifyWebhook', () => {
    it('should return void (HEAD)', () => {
      expect(controller.verifyWebhook()).toBeUndefined();
    });
  });

  describe('testTrelloWebhook', () => {
    it('should return "Trello Webhook"', () => {
      expect(controller.testTrelloWebhook()).toBe('Trello Webhook');
    });
  });

  describe('handleWebhook', () => {
    it('should return { received: true }', async () => {
      const result = await controller.handleWebhook({});
      expect(result).toEqual({ received: true });
    });

    it('should update order status on action_move_card_from_list_to_list', async () => {
      mockOrderUpdateManyAndReturn.mockResolvedValue([
        { id: 'order-1', status: 'SHIPPING' },
      ]);

      const body = {
        action: {
          type: 'updateCard',
          display: { translationKey: 'action_move_card_from_list_to_list' },
          data: {
            card: { id: 'card-1' },
            listAfter: { name: 'Shipping' },
          },
        },
      };

      const result = await controller.handleWebhook(body);

      expect(result).toEqual({ received: true });
      expect(mockOrderUpdateManyAndReturn).toHaveBeenCalledWith({
        where: { trelloCardId: 'card-1' },
        data: { status: 'SHIPPING' },
      });
      expect(mockEmit).not.toHaveBeenCalled(); // COMPLETED would emit
    });

    it('should emit order.completed when status is DONE', async () => {
      mockOrderUpdateManyAndReturn.mockResolvedValue([
        { id: 'order-1', status: 'COMPLETED' },
      ]);

      const body = {
        action: {
          type: 'updateCard',
          display: { translationKey: 'action_move_card_from_list_to_list' },
          data: {
            card: { id: 'card-1' },
            listAfter: { name: 'Done 🎉' },
          },
        },
      };

      await controller.handleWebhook(body);

      expect(mockEmit).toHaveBeenCalledWith('order.completed', {
        orderId: 'order-1',
        cardId: 'card-1',
        status: 'COMPLETED',
      });
    });

    it('should update shippingTrackingNumber on action_update_custom_field_item', async () => {
      mockConfigGet.mockReturnValue('custom-field-shipping-id');
      mockOrderUpdateManyAndReturn.mockResolvedValue([]);

      const body = {
        action: {
          type: 'updateCustomFieldItem',
          display: { translationKey: 'action_update_custom_field_item' },
          data: {
            card: { id: 'card-1' },
            customField: { id: 'custom-field-shipping-id' },
            customFieldItem: { value: { text: 'TRACK-123' } },
          },
        },
      };

      await controller.handleWebhook(body);

      expect(mockOrderUpdateManyAndReturn).toHaveBeenCalledWith({
        where: { trelloCardId: 'card-1' },
        data: { shippingTrackingNumber: 'TRACK-123' },
      });
    });
  });
});
