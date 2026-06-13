import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { AppModule } from './app.module';
import {
  resolveViewsDir,
  registerPartials,
  registerHelpers,
} from './helpers/hbs';
import { buildValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(buildValidationPipe());

  const viewsDir = resolveViewsDir();
  registerPartials(viewsDir);
  registerHelpers();

  app.useStaticAssets(join(viewsDir, '..', 'public'));
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');

  await app.listen(config.get('port') ?? 3000);
}
bootstrap();
