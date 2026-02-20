import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let httpPost: jest.Mock;
  let configGet: jest.Mock;

  beforeEach(async () => {
    httpPost = jest.fn().mockReturnValue(of({ data: {} }));
    configGet = jest.fn((key: string) => {
      const map: Record<string, string> = {
        TELEGRAM_BOT_TOKEN: 'bot-token',
        TELEGRAM_CHAT_ID: 'chat-123',
      };
      return map[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: HttpService, useValue: { post: httpPost } },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendLog', () => {
    it('should call Telegram API with log message', async () => {
      await service.sendLog('Error message');

      expect(httpPost).toHaveBeenCalledWith(
        'https://api.telegram.org/botbot-token/sendMessage',
        expect.objectContaining({
          chat_id: 'chat-123',
          parse_mode: 'Markdown',
          text: expect.stringContaining('HỆ THỐNG CẢNH BÁO'),
        }),
      );
      expect(httpPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('Error message'),
        }),
      );
    });

    it('should not throw when request fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      httpPost.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.sendLog('msg')).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Lỗi bắn tin Telegram:',
        'Network error',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('sendOrderCompleted', () => {
    it('should call Telegram API with order data', async () => {
      const order = { id: 'order-1', total: 100 };

      await service.sendOrderCompleted(order);

      expect(httpPost).toHaveBeenCalledWith(
        'https://api.telegram.org/botbot-token/sendMessage',
        expect.objectContaining({
          chat_id: 'chat-123',
          parse_mode: 'Markdown',
          text: expect.stringContaining('order-1'),
        }),
      );
      expect(httpPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('đã hoàn thành'),
        }),
      );
    });

    it('should not throw when request fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      httpPost.mockReturnValue(throwError(() => new Error('API error')));

      await expect(
        service.sendOrderCompleted({ id: '1' }),
      ).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Lỗi bắn tin Telegram:',
        'API error',
      );
      consoleSpy.mockRestore();
    });
  });
});
