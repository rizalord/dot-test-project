import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import hbs from 'hbs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  hbs.handlebars.registerHelper('formatPrice', (price: number) => {
    return price?.toLocaleString('id-ID') ?? '0';
  });

  hbs.handlebars.registerHelper('categoryName', (categoryId: number) => {
    const map: Record<number, string> = { 1: 'Electronics', 2: 'Clothing' };
    return map[categoryId] ?? '-';
  });

  hbs.handlebars.registerHelper('eq', (a: any, b: any) => a === b);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
