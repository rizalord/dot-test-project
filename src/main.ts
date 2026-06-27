import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import configFn, { Config } from './config'
import * as hbs from 'hbs'
import cookieParser = require('cookie-parser')

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())

  app.useStaticAssets(join(__dirname, '..', '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', '..', 'views'))
  app.setViewEngine('hbs')

  hbs.registerPartials(join(__dirname, '..', '..', 'views', 'partials'))

  const cfg = configFn()
  await app.listen(cfg.port)
}
bootstrap()
