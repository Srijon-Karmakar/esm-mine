

// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';


// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.enableCors({
//     origin: true,
//     credentials: true,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//       forbidNonWhitelisted: true,
//     }),
//   );

//   await app.listen(3000);
// }
// bootstrap();



















import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('EsportM API')
    .setDescription('EsportM Backend APIs Documentation')
    .setVersion('1.0')
    .addBearerAuth() // for JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
