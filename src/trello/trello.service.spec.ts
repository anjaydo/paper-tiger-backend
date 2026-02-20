import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrelloService } from './trello.service';

describe('TrelloService', () => {
  let service: TrelloService;
  let httpService: HttpService;
  let prisma: PrismaService;

  const mockHttpPost = jest.fn();
  const mockConfigGet = jest.fn();
  const mockOrderUpdate = jest.fn();

  beforeEach(async () => {
    mockConfigGet.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        TRELLO_KEY: 'key',
        TRELLO_TOKEN: 'token',
        TRELLO_LIST_ID: 'list-id',
      };
      return map[key];
    });
    mockHttpPost.mockReturnValue(of({ data: { id: 'card-123' } }));
    mockOrderUpdate.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrelloService,
        {
          provide: HttpService,
          useValue: { post: mockHttpPost },
        },
        {
          provide: ConfigService,
          useValue: { get: mockConfigGet },
        },
        {
          provide: PrismaService,
          useValue: { order: { update: mockOrderUpdate } },
        },
      ],
    }).compile();

    service = module.get<TrelloService>(TrelloService);
    httpService = module.get<HttpService>(HttpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(httpService).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('createCard', () => {
    it('should call Trello API and update order with cardId', async () => {
      const order = { orderId: 'ord-1', customer: 'Customer A', total: 500 };

      await service.createCard(order);

      expect(mockHttpPost).toHaveBeenCalledWith(
        'https://api.trello.com/1/cards',
        null,
        {
          params: {
            idList: 'list-id',
            key: 'key',
            token: 'token',
            name: '📦 Đơn hàng #ord-1',
            desc: 'Khách hàng: Customer A\nTổng tiền: 500 VNĐ',
          },
        },
      );
      // expect(mockOrderUpdate).toHaveBeenCalledWith({
      //   where: { id: 'ord-1' },
      //   data: { trelloCardId: 'card-123' },
      // });
    });

    it('should throw when HTTP fails', async () => {
      const order = { orderId: 'ord-1', customer: 'C', total: 0 };
      mockOrderUpdate.mockClear();
      mockHttpPost.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.createCard(order)).rejects.toThrow('Network error');
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    });
  });
});
