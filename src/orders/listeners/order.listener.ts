import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TrelloService } from 'src/trello/trello.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramService } from 'src/notifications/telegram.service';

@Injectable()
export class OrderListener {
  constructor(
    private trelloService: TrelloService,
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  // Tui để tạm console.log để ông test xem "súng" có nổ không nhé
  @OnEvent('order.placed')
  async handleOrderPlacedEvent(payload: any) {
    console.log('--- 🛒 EVENT RECEIVED ---');
    console.log(
      `Đang xử lý đơn hàng #${(payload as any)?.orderId} cho khách ${(payload as any)?.customer}`,
    );
    try {
      await this.trelloService.createCard(payload);
      console.log('✅ Đã tạo Card trên Trello thành công!');
    } catch (error) {
      console.log('❌ Thất bại khi tạo Card Trello', error);
    }
  }

  @OnEvent('order.completed')
  async handleOrderCompletedEvent(payload: any) {
    console.log('--- 🎉 EVENT RECEIVED ---');
    const order = await this.prisma.order.findUnique({
      where: { id: (payload as any)?.orderId },
    });
    await this.telegramService.sendOrderCompleted(order);
    console.log(`Đơn hàng #${(payload as any)?.orderId} đã hoàn thành`);
    console.log('Order: ', JSON.stringify(order));
  }
}
