import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { applySecurityMiddleware, HttpExceptionFilter, shouldEnableSwagger } from '@app/shared';
import { AiModule } from './ai.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AiModule);
  applySecurityMiddleware(app);

  app.setGlobalPrefix('ai');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (shouldEnableSwagger()) {
    const config = new DocumentBuilder()
      .setTitle('m-dicail AI API')
      .setDescription('Service IA — transcription audio (Groq) + suggestions')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(Number(process.env.AI_PORT));
}

bootstrap();
