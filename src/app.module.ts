import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { TrelloModule } from './trello/trello.module';
import { NotificationsModule } from './notifications/notifications.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({
      // Các cấu hình tùy chọn (không bắt buộc)
      wildcard: true, // Cho phép dùng ký tự * (VD: order.*)
      delimiter: '.', // Dấu phân cách giữa các level sự kiện
      verboseMemoryLeak: true, // Cảnh báo nếu bị rò rỉ bộ nhớ
    }),
    ProductsModule,
    OrdersModule,
    PrismaModule,
    TrelloModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
