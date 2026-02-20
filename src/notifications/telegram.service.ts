import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async sendLog(message: string) {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN') as string;
    const chatId = this.configService.get('TELEGRAM_CHAT_ID') as string;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      await firstValueFrom(
        this.httpService.post(url, {
          chat_id: chatId,
          text: `🚨 *HỆ THỐNG CẢNH BÁO*\n\`\`\`${JSON.stringify(message)?.substring(0, 2000)}\`\`\``,
          parse_mode: 'Markdown',
        }),
      );
    } catch (error) {
      console.error('Lỗi bắn tin Telegram:', error.message);
    }
  }

  async sendOrderCompleted(order: any) {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN') as string;
    const chatId = this.configService.get('TELEGRAM_CHAT_ID') as string;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      await firstValueFrom(
        this.httpService.post(url, {
          chat_id: chatId,
          text: `🎉 *Đơn hàng* \`${order?.id}\` *đã hoàn thành*\n\`\`\`json\n${JSON.stringify(order)?.substring(0, 2000)}\`\`\``,
          parse_mode: 'Markdown',
        }),
      );
    } catch (error) {
      console.error('Lỗi bắn tin Telegram:', error.message);
    }
  }
}
