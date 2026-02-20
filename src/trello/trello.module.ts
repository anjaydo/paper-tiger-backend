import { Module, Global } from '@nestjs/common';
import { TrelloService } from './trello.service';
import { HttpModule } from '@nestjs/axios';
import { TrelloWebhookController as WebhookController } from './webhook/webhook.controller';

@Global()
@Module({
  imports: [HttpModule],
  providers: [TrelloService],
  exports: [TrelloService],
  controllers: [WebhookController],
})
export class TrelloModule {}
