import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.enableCors();

  // Quan trọng: Chỉ listen khi không phải môi trường Vercel
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3000);
  }
}
bootstrap();
