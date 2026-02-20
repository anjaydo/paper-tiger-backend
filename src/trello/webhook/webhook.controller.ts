// src/trello/webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  Head,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TRELLO_STATUS_MAP } from '../trello.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrelloWebhookGuard } from '../guards/trello-webhook.guard';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/trello')
export class TrelloWebhookController {
  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // 1. Trello sẽ gọi HEAD request để check xem endpoint của ông có sống không
  @Head()
  @HttpCode(HttpStatus.OK)
  verifyWebhook() {
    return;
  }

  @Get('test')
  @HttpCode(HttpStatus.OK)
  testTrelloWebhook() {
    return 'Trello Webhook';
  }

  // 2. Nơi nhận dữ liệu thực sự khi có thay đổi trên Trello
  @Post()
  @UseGuards(TrelloWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    const action = body?.action as any;

    // Kiểm tra nếu hành động
    if (['updateCard', 'updateCustomFieldItem']?.includes(action?.type)) {
      console.log('Action translationKey: ', action?.display?.translationKey);
      switch (action?.display?.translationKey) {
        case 'action_move_card_from_list_to_list': {
          const cardId = (action?.data?.card as any)?.id;
          const trelloListName = action.data.listAfter.name;
          const newStatus = TRELLO_STATUS_MAP[trelloListName]; // Tên cột: "Shipping", "Done"...

          // Cập nhật trạng thái đơn hàng trong DB
          if (newStatus) {
            console.log(
              `🚀 Card ${cardId} vừa được kéo sang cột: ${newStatus}`,
            );

            // Lưu ý: Lúc tạo Order, ông nên lưu kèm trelloCardId để mapping ở đây
            const orders = await this.prisma.order.updateManyAndReturn({
              where: { trelloCardId: cardId },
              data: { status: newStatus },
            });

            console.log('Orders updated: ', orders);
            if (
              orders.length > 0 &&
              orders[0]?.status === TRELLO_STATUS_MAP.DONE
            ) {
              this.eventEmitter.emit('order.completed', {
                orderId: orders[0].id,
                cardId: cardId,
                status: newStatus,
              });
            }
          } else {
            console.log(
              `⚠️ Cột "${trelloListName}" không nằm trong danh sách theo dõi.`,
            );
          }
          break;
        }
        case 'action_update_custom_field_item': {
          if (
            action?.data?.customField?.id ===
            this.configService.get('TRELLO_CUSTOM_FIELD_SHIPPING_ID')
          ) {
            console.log(
              'Action update custom field shipping tracking number: ',
              action?.data?.customFieldItem?.value,
            );

            const shippingTrackingNumber =
              action?.data?.customFieldItem?.value?.text || '';
            const trelloCardId = (action?.data?.card as any)?.id;

            // Cập nhật shipping tracking number trong DB
            const orders = await this.prisma.order.updateManyAndReturn({
              where: { trelloCardId },
              data: { shippingTrackingNumber },
            });

            console.log('Orders updated: ', orders);
          }
          break;
        }
        case 'action_moved_card_higher':
        case 'action_moved_card_lower': {
          break;
        }
        default: {
          console.log(action);
          console.log(
            'Action not supported: ',
            action?.display?.translationKey,
            '🚨',
          );
        }
      }
    }

    return { received: true };
  }
}
