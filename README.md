# Product Management System

A full-featured admin panel for managing products and categories, built with NestJS, Prisma, and PostgreSQL.

## Screenshots

| Page | Screenshot | Page | Screenshot |
|---|---|---|---|
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) | Products | ![Products](docs/screenshots/products.png) |
| Create Product | ![Create Product](docs/screenshots/create-product.png) | Edit Product | ![Edit Product](docs/screenshots/edit-product.png) |
| Categories | ![Categories](docs/screenshots/categories.png) | Create Category | ![Create Category](docs/screenshots/create-category.png) |
| Edit Category | ![Edit Category](docs/screenshots/edit-category.png) | Login | ![Login](docs/screenshots/login.png) |
| Register | ![Register](docs/screenshots/register.png) | | |

## Features

- **Authentication** — Register, login, and session management with JWT (httpOnly cookies)
- **Products** — Full CRUD with price (Rupiah) and multi-category assignment
- **Categories** — Full CRUD for organizing products
- **Dashboard** — Real-time product and category counts with action navigation
- **Responsive UI** — Tailwind CSS with mobile-friendly layout and navbar

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [NestJS](https://nestjs.com/) (Node.js 22) |
| ORM | [Prisma](https://www.prisma.io/) 7.x |
| Database | PostgreSQL 18 |
| Frontend | Server-side rendered Handlebars + Tailwind CSS CDN |
| Auth | JWT (JSON Web Tokens) with Passport |

## Project Structure

```
src/
├── config/                  # App configuration (port, JWT, database)
├── helpers/                 # Handlebars helpers
├── modules/
│   ├── api/                 # REST API modules (auth, products, categories)
│   │   ├── auth/            # JWT auth with Passport
│   │   ├── products/        # Product CRUD with Prisma
│   │   └── categories/      # Category CRUD with Prisma
│   ├── web/                 # Server-side rendered web modules
│   │   ├── auth/            # Login/register/logout views + JwtCookieGuard
│   │   ├── dashboard/       # Dashboard with stats and navigation
│   │   ├── products/        # Product management views
│   │   └── categories/      # Category management views
│   └── prisma/              # Prisma service
├── common/                  # Shared DTOs and decorators
├── main.ts                  # App entry point
└── app.module.ts            # Root module
views/
├── auth/                    # Login and register forms
├── products/                # Product list and form views
├── categories/              # Category list and form views
└── partials/                # Navbar, head, footer partials
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Docker & Docker Compose (for PostgreSQL)
- Git

### Quick Start (Development)

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd dot-test-project

# 2. Install dependencies
npm install

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Create .env file
cat > .env << EOF
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adminpanel?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-change-this"
JWT_REFRESH_EXPIRES_IN="7d"
EOF

# 5. Run database migrations
npm run db:migrate

# 6. Generate Prisma client
npm run db:generate

# 7. Start the dev server with hot reload
npm run start:dev
```

Open [http://localhost:3000](http://localhost:3000) and register a new account.

### Development Mode (detailed)

| Step | Command | Description |
|---|---|---|
| Start database | `docker compose up -d` | Runs PostgreSQL 18 in background |
| Check database | `docker compose ps` | Verify DB container is running |
| Run migrations | `npm run db:migrate` | Apply schema changes to database |
| Start app | `npm run start:dev` | Hot-reload dev server on port 3000 |
| Stop database | `docker compose down` | Stops and removes DB container |

### Production Build

```bash
# 1. Build the app
npm run build

# 2. Start in production mode
NODE_ENV=production npm run start:prod
```

Or using the included Dockerfile:

```bash
# Build image
docker build -t product-management-system .

# Run with a PostgreSQL instance
docker run -d --name pms-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=adminpanel \
  postgres:18-alpine

docker run -d -p 3000:3000 --name pms-app \
  --link pms-db:db \
  -e DATABASE_URL="postgresql://postgres:postgres@db:5432/adminpanel?schema=public" \
  product-management-system
```

## Database

### Entity Relationship Diagram

![Database Diagram](docs/diagrams/db.png)

### Schema

The database consists of 4 models defined in [prisma/schema.prisma](prisma/schema.prisma):

| Model | Description |
|---|---|
| `User` | Application users (authentication) |
| `Category` | Product categories (user-scoped) |
| `Product` | Products with price (stored as BigInt, user-scoped) |
| `ProductCategory` | Many-to-many relation between Product and Category |

### Migrations

```bash
# Create and apply a new migration
npm run db:migrate

# Create migration only (without applying)
npm run db:migrate:create

# Apply pending migrations (production)
npm run db:migrate:deploy

# Reset database (drops all data)
npm run db:migrate:reset
```

### Prisma Studio

Browse and edit data through a GUI:

```bash
npm run db:studio
```

Opens at [http://localhost:5555](http://localhost:5555).

### Generate Prisma Client

After pulling changes that modify the Prisma schema:

```bash
npm run db:generate
```

### Environment Variables

Copy `.env` from the quickstart section or reference the table below:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Application port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/adminpanel?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | (required) | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token expiration duration |
| `JWT_REFRESH_SECRET` | (required) | Secret key for signing refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration duration |

## Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## API Endpoints

### REST API (prefix: `/api/v1`)

All API endpoints require JWT Bearer token in `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET | `/api/v1/products` | List products (paginated, searchable) |
| GET | `/api/v1/products/count` | Get total product count |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create a new product |
| PUT | `/api/v1/products/:id` | Update a product |
| DELETE | `/api/v1/products/:id` | Delete a product |
| GET | `/api/v1/categories` | List categories (paginated, searchable) |
| GET | `/api/v1/categories/count` | Get total category count |
| GET | `/api/v1/categories/:id` | Get category by ID |
| POST | `/api/v1/categories` | Create a new category |
| PUT | `/api/v1/categories/:id` | Update a category |
| DELETE | `/api/v1/categories/:id` | Delete a category |

### Web Routes (SSR with Handlebars)

| Method | Route | Description |
|---|---|---|
| GET | `/` | Dashboard (protected) |
| GET/POST | `/auth/login` | Login form |
| GET/POST | `/auth/register` | Registration form |
| GET/POST | `/auth/logout` | Logout |
| GET | `/products` | Product list (protected) |
| GET/POST | `/products/create` | Create product form (protected) |
| GET/POST | `/products/:id/edit` | Edit product form (protected) |
| POST | `/products/:id/delete` | Delete product (protected) |
| GET | `/categories` | Category list (protected) |
| GET/POST | `/categories/create` | Create category form (protected) |
| GET/POST | `/categories/:id/edit` | Edit category form (protected) |
| POST | `/categories/:id/delete` | Delete category (protected) |
