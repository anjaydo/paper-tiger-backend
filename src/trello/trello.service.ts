import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TrelloService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createCard(order: any) {
    const key = this.configService.get<string>('TRELLO_KEY');
    const token = this.configService.get<string>('TRELLO_TOKEN');
    const listId = this.configService.get<string>('TRELLO_LIST_ID');

    const url = `https://api.trello.com/1/cards`;

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(url, null, {
          params: {
            idList: listId,
            key: key,
            token: token,
            name: `📦 Đơn hàng #${order.orderId}`,
            desc: `Khách hàng: ${order.customer}\nTổng tiền: ${order.total} VNĐ`,
          },
        }),
      );
      console.log(`📦 Tạo Đơn hàng #${order?.orderId}`);

      // Trello related processing
      const cardId = response?.data?.id;

      // Cập nhật lại Order với Card ID vừa nhận được
      await this.prisma.order.update({
        where: { id: order?.orderId as string },
        data: { trelloCardId: cardId as string },
      });
    } catch (error) {
      console.error('Lỗi gọi Trello:', error.response?.data || error.message);
      throw error;
    }
  }
}
