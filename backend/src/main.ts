import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  app.getHttpAdapter().get('/health', (_req, res) => res.json({ status: 'UP' }));
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();