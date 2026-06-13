import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import hbs from 'hbs';

// Resolve views dir by walking up from __dirname until a `views/` directory is found.
// Works for both ts-node (src/helpers/) and compiled output (dist/src/helpers/).
export function resolveViewsDir(): string {
  let dir = __dirname;
  for (let i = 0; i < 4; i++) {
    const candidate = join(dir, 'views');
    if (existsSync(candidate)) return candidate;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`views/ directory not found from ${__dirname}`);
}

// Register all partials in views/partials/ to handlebars. Partial name is filename without .hbs extension.
export function registerPartials(viewsDir: string): void {
  const partialsDir = join(viewsDir, 'partials');
  if (!existsSync(partialsDir)) return;

  for (const file of readdirSync(partialsDir)) {
    const name = file.replace(/\.hbs$/, '');
    const content = readFileSync(join(partialsDir, file), 'utf8');
    hbs.handlebars.registerPartial(name, content);
  }
}

// Register custom handlebars helpers.
export function registerHelpers(): void {
  hbs.handlebars.registerHelper('formatPrice', (price: number) => {
    return price?.toLocaleString('id-ID') ?? '0';
  });
  hbs.handlebars.registerHelper('categoryName', (categoryId: number) => {
    const map: Record<number, string> = { 1: 'Electronics', 2: 'Clothing' };
    return map[categoryId] ?? '-';
  });
  hbs.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
}
