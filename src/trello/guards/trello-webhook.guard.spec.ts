import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from 'src/notifications/telegram.service';
import { TrelloWebhookGuard } from './trello-webhook.guard';
import { verifyTrelloSignature } from '../trello.utils';

jest.mock('../trello.utils', () => ({
  verifyTrelloSignature: jest.fn(),
}));

const mockVerifyTrelloSignature = verifyTrelloSignature as jest.MockedFunction<
  typeof verifyTrelloSignature
>;

describe('TrelloWebhookGuard', () => {
  let guard: TrelloWebhookGuard;
  let configGet: jest.Mock;

  const createMockContext = (request: {
    body?: unknown;
    headers?: Record<string, string>;
  }) => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    configGet = jest.fn((key: string) => {
      const map: Record<string, string> = {
        APP_PUBLIC_URL: 'https://example.com',
        TRELLO_SECRET: 'secret',
      };
      return map[key];
    });
    mockVerifyTrelloSignature.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrelloWebhookGuard,
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: TelegramService, useValue: {} },
      ],
    }).compile();

    guard = module.get<TrelloWebhookGuard>(TrelloWebhookGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when signature is valid', () => {
    const ctx = createMockContext({
      body: {},
      headers: { 'x-trello-webhook': 'abc' },
    });

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockVerifyTrelloSignature).toHaveBeenCalledWith(
      expect.any(Object),
      'https://example.com/webhooks/trello',
      'secret',
    );
  });

  it('should throw UnauthorizedException when TRELLO_SECRET is missing', () => {
    configGet.mockImplementation((key: string) =>
      key === 'APP_PUBLIC_URL' ? 'https://example.com' : undefined,
    );

    const module = Test.createTestingModule({
      providers: [
        TrelloWebhookGuard,
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: TelegramService, useValue: {} },
      ],
    });

    return module.compile().then((m) => {
      const g = m.get<TrelloWebhookGuard>(TrelloWebhookGuard);
      const ctx = createMockContext({ body: {}, headers: {} });

      expect(() => g.canActivate(ctx)).toThrow(UnauthorizedException);
      expect(() => g.canActivate(ctx)).toThrow('No Trello signature found');
    });
  });

  it('should throw UnauthorizedException when signature is invalid', () => {
    mockVerifyTrelloSignature.mockReturnValue(false);
    const ctx = createMockContext({
      body: {},
      headers: { 'x-trello-webhook': 'wrong' },
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Invalid Trello signature');
  });
});
