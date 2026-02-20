import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { TelegramService } from 'src/notifications/telegram.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private telegramService: TelegramService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    // Chỉ bắn Telegram nếu là lỗi nghiêm trọng (500)
    if (status === 500) {
      const message = `🔥 *CRASH REPORT*\n\n📌 Route: ${request.url}\n❌ Error: ${exception.message}\n📂 Trace: ${exception.stack?.substring(0, 200)}...`;
      this.telegramService.sendLog(message);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
