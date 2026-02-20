import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyTrelloSignature } from '../trello.utils';
import { TelegramService } from 'src/notifications/telegram.service';

@Injectable()
export class TrelloWebhookGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private telegramService: TelegramService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy chữ ký từ Header mà Trello gửi qua
    const request = context.switchToHttp().getRequest();

    // 2. Lấy URL callback mà ông đã đăng ký (Cần khớp 100% với URL ông gửi cho Trello)
    const callbackURL = `${this.configService.get('APP_PUBLIC_URL')}/webhooks/trello`;

    // 3. Secret của Trello thực chất chính là Trello Token
    const secret = this.configService.get('TRELLO_SECRET') as string;

    if (!secret || !callbackURL) {
      throw new UnauthorizedException('No Trello signature found');
    }

    const isValid = verifyTrelloSignature(request, callbackURL, secret);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Trello signature');
    }

    return true;
  }
}
