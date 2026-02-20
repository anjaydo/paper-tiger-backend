import { HttpException, HttpStatus } from '@nestjs/common';
import { TelegramService } from 'src/notifications/telegram.service';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockTelegramService: {
    sendLog: jest.Mock;
    sendOrderCompleted: jest.Mock;
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const createMockHost = (url = '/test') => {
    const mockRequest = { url };
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  };

  beforeEach(async () => {
    mockTelegramService = {
      sendLog: jest.fn(),
      sendOrderCompleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    mockResponse.status.mockClear();
    mockResponse.json.mockClear();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should use exception status for HttpException and not call sendLog', () => {
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    const host = createMockHost('/orders');

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/orders',
      }),
    );
    expect(mockTelegramService.sendLog).not.toHaveBeenCalled();
  });

  it('should use 500 for non-HttpException and call sendLog', () => {
    const exception = new Error('Internal error');
    exception.stack = 'Error: Internal error\n  at test.ts:1:1';
    const host = createMockHost('/api/crash');

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: '/api/crash',
      }),
    );
    expect(mockTelegramService.sendLog).toHaveBeenCalledWith(
      expect.stringContaining('CRASH REPORT'),
    );
    expect(mockTelegramService.sendLog).toHaveBeenCalledWith(
      expect.stringContaining('/api/crash'),
    );
    expect(mockTelegramService.sendLog).toHaveBeenCalledWith(
      expect.stringContaining('Internal error'),
    );
  });
});
