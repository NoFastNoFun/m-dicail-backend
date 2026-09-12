import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { applySecurityMiddleware, HttpExceptionFilter, shouldEnableSwagger } from '@app/shared';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  applySecurityMiddleware(app);

  // health + email bounce URLs live at the origin root so nginx can proxy them without /api/v1.
  app.setGlobalPrefix('api', { exclude: ['health', 'reset-password', 'recovery'] });
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
    const config = new DocumentBuilder().setTitle('m-dicail API').setDescription('API m-dicail').setVersion('1.0').addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(Number(process.env.PORT));
}

bootstrap();
