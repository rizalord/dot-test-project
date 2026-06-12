import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import hbs from 'hbs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Views live at src/views/ (dev) or dist/views/ (prod)
  const viewsDir = existsSync(join(__dirname, 'views'))
    ? join(__dirname, 'views')
    : join(__dirname, '..', 'views');

  // Register partials (navbar, etc.)
  const partialsDir = join(viewsDir, 'partials');
  if (existsSync(partialsDir)) {
    for (const file of readdirSync(partialsDir)) {
      const name = file.replace(/\.hbs$/, '');
      const content = readFileSync(join(partialsDir, file), 'utf8');
      hbs.handlebars.registerPartial(name, content);
    }
  }

  hbs.handlebars.registerHelper('formatPrice', (price: number) => {
    return price?.toLocaleString('id-ID') ?? '0';
  });
  hbs.handlebars.registerHelper('categoryName', (categoryId: number) => {
    const map: Record<number, string> = { 1: 'Electronics', 2: 'Clothing' };
    return map[categoryId] ?? '-';
  });
  hbs.handlebars.registerHelper('eq', (a: any, b: any) => a === b);

  app.useStaticAssets(join(viewsDir, '..', 'public'));
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
