import { TelegramService } from 'src/notifications/telegram.service';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Test, TestingModule } from '@nestjs/testing';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let telegramService: TelegramService;

  const mockTelegramService = {
    sendLog: jest.fn(),
    sendOrderCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: TelegramService, useValue: mockTelegramService }],
    }).compile();
    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    telegramService = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
    expect(telegramService).toBeDefined();
  });
});
