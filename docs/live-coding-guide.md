# Live Coding Preparation Guide

## Project Overview

| Layer | Teknologi |
|-------|-----------|
| Framework | NestJS 11 (Express) |
| ORM | Prisma 7 + PostgreSQL |
| Auth | JWT + Passport (@nestjs/jwt, passport-jwt) |
| Validation | class-validator + class-transformer |
| View Engine | Handlebars (hbs) — server-side rendered |
| CSS | Tailwind CSS (CDN) |
| Frontend JS | Vanilla JS (IIFE pattern) |
| Testing | Jest + supertest (E2E) |

---

## Table of Contents

1. [Project Structure Map](#1-project-structure-map)
2. [Flow Data dari Request ke Response](#2-flow-data-dari-request-ke-response)
3. [Case Study 1: Menambah Tabel Baru (Prisma)](#3-case-study-1-menambah-tabel-baru-prisma)
4. [Case Study 2: Membuat API Module Lengkap](#4-case-study-2-membuat-api-module-lengkap)
5. [Case Study 3: Membuat Web Module (Halaman + View)](#5-case-study-3-membuat-web-module-halaman--view)
6. [Case Study 4: Menambah Fitur di Frontend JS](#6-case-study-4-menambah-fitur-di-frontend-js)
7. [Case Study 5: Menambah Field ke Tabel Existing](#7-case-study-5-menambah-field-ke-tabel-existing)
8. [Case Study 6: Menambah Endpoint API Baru di Module Existing](#8-case-study-6-menambah-endpoint-api-baru-di-module-existing)
9. [Case Study 7: Memperbaiki Bug — NotFoundException & Error Handling](#9-case-study-7-memperbaiki-bug--notfoundexception--error-handling)
10. [Cheat Sheet: Perintah Penting](#10-cheat-sheet-perintah-penting)
11. [Pola Umum yang Harus Dihafal](#11-pola-umum-yang-harus-dihafal)

---

## 1. Project Structure Map

```
prisma/schema.prisma          ← Definisi database (model & relasi)
src/
├── main.ts                   ← Entry point (bootstrap NestJS)
├── app.module.ts             ← Root module (import semua module)
├── config/app.ts             ← Config dari .env
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   ← @CurrentUser() untuk extract user dari JWT
│   │   └── public.decorator.ts         ← @Public() untuk bypass auth
│   ├── dto/
│   │   ├── response.dto.ts             ← ResponseDto<T> interface + PaginationMeta
│   │   └── pagination-query.dto.ts     ← PaginationQueryDto (search, page, limit)
│   └── pipes/
│       └── validation.pipe.ts          ← Global validation pipe
├── modules/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts           ← Wrapper PrismaClient
│   ├── api/                            ← REST API endpoints
│   │   ├── auth/                       ← Auth module (login, register, refresh, me)
│   │   ├── categories/                 ← CRUD categories
│   │   └── products/                   ← CRUD products
│   └── web/                            ← Server-side rendered pages
│       ├── auth/                       ← Login & Register page
│       ├── categories/                 ← Categories pages
│       └── products/                   ← Products pages
├── views/                              ← Handlebars templates (.hbs)
│   ├── pages/                          ← Halaman lengkap
│   └── partials/                       ← Partial (navbar)
├── public/js/                          ← Frontend JavaScript
└── helpers/hbs.ts                      ← Handlebars helpers
```

### Pattern: Satu fitur terdiri dari ini semua

```
src/modules/api/products/              ← API module
├── api-products.module.ts             ← Module definition (imports, controllers, providers)
├── products.controller.ts             ← Routes + HTTP handlers
├── products.service.ts                ← Business logic
├── dto/
│   ├── create-product.dto.ts          ← Validation create
│   └── update-product.dto.ts          ← Validation update
└── types/
    └── product.types.ts               ← TypeScript interfaces

src/modules/web/products/              ← Web module (halaman)
├── web-products.module.ts
└── products.controller.ts             ← Routes that render .hbs views

src/views/pages/products/              ← Template files
├── index.hbs                          ← List page
├── form.hbs                           ← Create/Edit form
└── show.hbs                           ← Detail page

src/public/js/products.js              ← Frontend JavaScript
```

---

## 2. Flow Data dari Request ke Response

```
Browser → Route → Controller → Service → Prisma → Database
                                                ↓
Browser ← HTML/JSON ← Controller ← Service ← Prisma
```

### Flow API (JSON):
```
Request:  GET /api/v1/products?page=1&limit=10
          Header: Authorization: Bearer <token>

Auth:     JwtAuthGuard → extract JWT → validate → attach user ke request
          @CurrentUser() → ambil user.id

Controller:  @Get() → @Query() PaginationQueryDto → panggil service
Service:     @Inject() prisma → PrismaService.product.findMany({...})
Response:    { message, data: ProductResource[], meta: { page, limit, total, total_pages } }
```

### Flow Web Page:
```
Request:  GET /products
          (middleware.js redirect ke /login kalo ga punya token)

Controller:  @Get() @Render('pages/products/index') → return { title }
View:        index.hbs → render HTML (Tailwind + JS)
Frontend JS: products.js → DOMContentLoaded → Auth.redirectIfGuest() → Auth.updateNavbar()
             → API.getProducts() → renderTable() → renderPagination()
```

---

## 3. Case Study 1: Menambah Tabel Baru (Prisma)

**Skenario: Disuruh nambah tabel `Supplier` dengan field: id, user_id, name, phone, address.**

### Langkah 1: Edit Prisma Schema

**File: `prisma/schema.prisma`**

Tambahkan model:

```prisma
model Supplier {
  id         String   @id @default(uuid()) @db.Uuid
  user_id    String   @db.Uuid
  name       String   @db.VarChar(200)
  phone      String?  @db.VarChar(20)
  address    String?  @db.Text
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user       User     @relation(fields: [user_id], references: [id])
}
```

Relasi di model `User` (tambahkan di model User yang sudah ada):

```prisma
model User {
  // ... field existing ...
  suppliers  Supplier[]   // tambahkan ini
}
```

### Langkah 2: Generate Prisma Client

```bash
npm run db:generate
# atau: npx prisma generate
```

Ini akan regenerate file di `src/generated/prisma/`.

### Langkah 3: Buat Migration

```bash
npm run db:migrate
# atau: npx prisma migrate dev --name add_suppliers_table
```

> **⚠️ Catatan**: Kalau live coding interview, biasanya cukup langkah 1-2 aja (ga perlu migration betulan). Pastiin `prisma generate` jalan.

---

## 4. Case Study 2: Membuat API Module Lengkap

**Skenario: Disuruh bikin CRUD API untuk `Supplier` (setelah tabelnya sudah ada).**

### Langkah 1: Buat Types (`src/modules/api/suppliers/types/supplier.types.ts`)

```typescript
export interface SupplierResource {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### Langkah 2: Buat DTO (`src/modules/api/suppliers/dto/create-supplier.dto.ts`)

```typescript
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
```

### Langkah 3: Buat Service (`src/modules/api/suppliers/suppliers.service.ts`)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import type { PaginationMeta } from '../../../common/dto/response.dto';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import type { SupplierResource } from './types/supplier.types';

function toResource(supplier: Prisma.SupplierGetPayload<Record<string, never>>): SupplierResource {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    address: supplier.address,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
  };
}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<ResponseDto<SupplierResource[]>> {
    const { search, page = 1, limit = 10 } = query;

    const where: Prisma.SupplierWhereInput = {
      user_id: userId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page, limit, total,
      total_pages: Math.ceil(total / limit),
    };

    return { message: 'Suppliers retrieved successfully', data: items.map(toResource), meta };
  }

  async findOne(userId: string, id: string): Promise<ResponseDto<SupplierResource>> {
    const supplier = await this.findOrThrow(userId, id);
    return { message: 'Supplier retrieved successfully', data: toResource(supplier) };
  }

  async create(userId: string, dto: CreateSupplierDto): Promise<ResponseDto<SupplierResource>> {
    const supplier = await this.prisma.supplier.create({
      data: { user_id: userId, name: dto.name, phone: dto.phone, address: dto.address },
    });
    return { message: 'Supplier created successfully', data: toResource(supplier) };
  }

  async update(userId: string, id: string, dto: UpdateSupplierDto): Promise<ResponseDto<SupplierResource>> {
    await this.findOrThrow(userId, id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { name: dto.name, phone: dto.phone, address: dto.address },
    });
    return { message: 'Supplier updated successfully', data: toResource(supplier) };
  }

  async remove(userId: string, id: string): Promise<ResponseDto<null>> {
    await this.findOrThrow(userId, id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully', data: null };
  }

  private async findOrThrow(userId: string, id: string) {
    const item = await this.prisma.supplier.findFirst({ where: { id, user_id: userId } });
    if (!item) throw new NotFoundException('Supplier not found');
    return item;
  }
}
```

### Langkah 4: Buat Controller (`src/modules/api/suppliers/suppliers.controller.ts`)

```typescript
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import type { ResponseDto } from '../../../common/dto/response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import type { SupplierResource } from './types/supplier.types';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<ResponseDto<SupplierResource[]>> {
    return this.suppliersService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<SupplierResource>> {
    return this.suppliersService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupplierDto,
  ): Promise<ResponseDto<SupplierResource>> {
    return this.suppliersService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<ResponseDto<SupplierResource>> {
    return this.suppliersService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<null>> {
    return this.suppliersService.remove(user.id, id);
  }
}
```

> **PENTING**: Controller pattern-nya SAMA PERSIS untuk semua module. Cuma ganti nama service, tipe data, dan path route.

### Langkah 5: Buat Module (`src/modules/api/suppliers/api-suppliers.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { ApiAuthModule } from '../auth/api-auth.module';

@Module({
  imports: [ApiAuthModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class ApiSuppliersModule {}
```

### Langkah 6: Import Module di AppModule

**File: `src/app.module.ts`**

```typescript
import { ApiSuppliersModule } from './modules/api/suppliers/api-suppliers.module';

@Module({
  imports: [
    // ... existing imports ...
    ApiSuppliersModule,    // <-- tambahkan ini
  ],
})
```

---

## 5. Case Study 3: Membuat Web Module (Halaman + View)

**Skenario: Setelah API Supplier jadi, disuruh bikin halaman webnya.**

### Langkah 1: Buat Web Controller (`src/modules/web/suppliers/suppliers.controller.ts`)

```typescript
import { Controller, Get, Param, Render } from '@nestjs/common';

@Controller('/suppliers')
export class SuppliersController {
  @Get()
  @Render('pages/suppliers/index')
  index() {
    return { title: 'Suppliers' };
  }

  @Get('/create')
  @Render('pages/suppliers/form')
  create() {
    return { title: 'Create Supplier', isEdit: false };
  }

  @Get('/:id/edit')
  @Render('pages/suppliers/form')
  edit(@Param('id') id: string) {
    return { title: 'Edit Supplier', isEdit: true, id };
  }

  @Get('/:id')
  @Render('pages/suppliers/index')
  show() {
    return { title: 'Suppliers' };
  }
}
```

> **PENTING**: Web controller ini CUMA return object buat template. Data dari API di-fetch oleh JavaScript di frontend.

### Langkah 2: Buat Web Module (`src/modules/web/suppliers/web-suppliers.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';

@Module({
  controllers: [SuppliersController],
})
export class WebSuppliersModule {}
```

### Langkah 3: Register di AppModule

```typescript
import { WebSuppliersModule } from './modules/web/suppliers/web-suppliers.module';

@Module({
  imports: [
    // ... existing ...
    WebSuppliersModule,
  ],
})
```

### Langkah 4: Buat View List (`src/views/pages/suppliers/index.hbs`)

Bisa copy dari [categories/index.hbs](src/views/pages/categories/index.hbs), ubah:
- Title, breadcrumb
- JS file references
- Table headers
- tbody `id`, script variable names

### Langkah 5: Buat View Form (`src/views/pages/suppliers/form.hbs`)

Copy dari [categories/form.hbs](src/views/pages/categories/form.hbs), sesuaikan field-nya.

---

## 6. Case Study 4: Menambah Fitur di Frontend JS

**Skenario: Bikin halaman Supplier yang bisa search, list, pagination.**

### Pattern: IIFE (Immediately Invoked Function Expression)

Semua JS file di `src/public/js/` pake pattern yang SAMA:

```javascript
var Suppliers = (function () {
  'use strict';

  var PER_PAGE = 10;
  var currentPage = 1;
  var currentSearch = '';
  var tableBody, paginationEl, searchInput;

  function init() {
    if (Auth.redirectIfGuest()) return;   // ← WAJIB: redirect kalau belum login
    Auth.updateNavbar();                   // ← WAJIB: update navbar user info

    searchInput = document.getElementById('search-input');
    var searchBtn = document.getElementById('search-btn');
    tableBody = document.getElementById('suppliers-tbody');
    paginationEl = document.getElementById('pagination');

    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadSuppliers();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
      }
    });

    loadSuppliers();
  }

  async function loadSuppliers() {
    try {
      var res = await API.apiFetch('/suppliers', {
        // Kalau ada parameter query:
        // headers: { ... } — tapi default Content-Type + Authorization sudah otomatis
      });
      // Atau kalau butuh query string manual:
      // var qs = new URLSearchParams();
      // if (currentSearch) qs.set('search', currentSearch);
      // qs.set('page', currentPage);
      // qs.set('limit', PER_PAGE);
      // var res = await API.apiFetch('/suppliers?' + qs.toString());

      renderTable(res.data, tableBody);
      renderPagination(res.meta, paginationEl);
    } catch (err) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-12 text-center text-sm text-red-500">' +
        'Failed to load suppliers.</td></tr>';
    }
  }

  function renderTable(data, tbody) {
    // Kalau kosong
    if (!data || data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">No suppliers found.</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(function (item) {
        return (
          '<tr class="hover:bg-gray-50">' +
          '<td class="px-6 py-4 text-sm font-medium text-gray-900">' +
          escapeHtml(item.name) +
          '</td>' +
          '<td class="px-6 py-4 text-sm text-gray-500">' +
          escapeHtml(item.phone || '-') +
          '</td>' +
          '<td class="px-6 py-4 text-right">' +
          '<a href="/suppliers/' + item.id + '/edit" class="edit-btn">Edit</a>' +
          '<button onclick="Suppliers.confirmDelete(\'' + item.id + '\')" class="delete-btn">Delete</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderPagination(meta, el) {
    // Copy SAMA PERSIS dari categories.js/products.js
    if (!meta || meta.total_pages <= 1) {
      el.innerHTML = '';
      return;
    }
    var page = meta.page;
    var total_pages = meta.total_pages;
    var prevDisabled = page <= 1;
    var nextDisabled = page >= total_pages;

    el.innerHTML =
      '<div class="flex items-center justify-center gap-2 mt-6">' +
      '<button class="px-3 py-1.5 text-sm rounded-md border ' +
      (prevDisabled ? 'border-gray-200 text-gray-400 cursor-not-allowed" disabled' : 'border-gray-300 text-gray-700 hover:bg-gray-50"') +
      ' onclick="Suppliers.goToPage(' + (page - 1) + ')">Previous</button>' +
      '<span class="text-sm text-gray-600">Page ' + page + ' of ' + total_pages + '</span>' +
      '<button class="px-3 py-1.5 text-sm rounded-md border ' +
      (nextDisabled ? 'border-gray-200 text-gray-400 cursor-not-allowed" disabled' : 'border-gray-300 text-gray-700 hover:bg-gray-50"') +
      ' onclick="Suppliers.goToPage(' + (page + 1) + ')">Next</button>' +
      '</div>';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Auto-init saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    goToPage: function (page) {
      currentPage = page;
      loadSuppliers();
    },
    confirmDelete: async function (id) {
      if (!confirm('Are you sure?')) return;
      try {
        await API.apiFetch('/suppliers/' + id, { method: 'DELETE' });
        location.reload();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    },
  };
})();
```

### Cara nambah method di objek `API` (`src/public/js/api.js`)

Di bagian `return { ... }`, tambah method baru:

```javascript
getSuppliers: (params = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  const query = qs.toString();
  return apiFetch(`/suppliers${query ? '?' + query : ''}`);
},
getSupplier: (id) => apiFetch(`/suppliers/${id}`),
createSupplier: (data) =>
  apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
updateSupplier: (id, data) =>
  apiFetch(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
deleteSupplier: (id) => apiFetch(`/suppliers/${id}`, { method: 'DELETE' }),
```

---

## 7. Case Study 5: Menambah Field ke Tabel Existing

**Skenario: Tabel Product perlu nambah field `description` (text) dan `stock` (integer).**

### Langkah 1: Update Prisma Schema

```prisma
model Product {
  // ... existing fields ...
  description String?  @db.Text          // new
  stock       Int?                        // new, default null
}
```

### Langkah 2: Generate & Migrate

```bash
npx prisma generate
npx prisma migrate dev --name add_product_fields
```

### Langkah 3: Update Types (`src/modules/api/products/types/product.types.ts`)

```typescript
export interface ProductResource {
  // ... existing ...
  description: string | null;
  stock: number | null;
}
```

### Langkah 4: Update DTO (`create-product.dto.ts` dan `update-product.dto.ts`)

```typescript
export class CreateProductDto {
  // ... existing fields ...

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
```

### Langkah 5: Update Service — fungsi `toResource()`

Tambah mapping field baru di `toResource()`:

```typescript
function toResource(product): ProductResource {
  return {
    // ... existing ...
    description: product.description,
    stock: product.stock,
  };
}
```

---

## 8. Case Study 6: Menambah Endpoint API Baru di Module Existing

**Skenario: Nambah endpoint `GET /api/v1/products/:id/stats` untuk statistik produk.**

### Langkah: Tambah method di Controller & Service

Di controller:

```typescript
@Get(':id/stats')
async getStats(
  @CurrentUser() user: AuthenticatedUser,
  @Param('id') id: string,
): Promise<ResponseDto<{ total_views: number }>> {
  return this.productsService.getStats(user.id, id);
}
```

Di service:

```typescript
async getStats(userId: string, id: string): Promise<ResponseDto<{ total_views: number }>> {
  await this.findProductOrThrow(userId, id);
  // Logic statistik...
  return { message: 'Stats retrieved', data: { total_views: 0 } };
}
```

**⚠️ PERHATIKAN URUTAN ROUTE**: NestJS membaca route secara deklaratif. Route tetap (seperti `count`) harus didefinisikan SEBELUM route parameter (`:id`). Urutan yang benar:

```typescript
@Get()           // GET /api/v1/products
@Get('count')    // GET /api/v1/products/count    ← SEBELUM :id
@Get(':id')      // GET /api/v1/products/:id      ← SETELAH count
@Get(':id/stats') // GET /api/v1/products/:id/stats
```

---

## 9. Case Study 7: Memperbaiki Bug — NotFoundException & Error Handling

### Pattern Error Handling di Service

```typescript
// Cari entity → throw NotFoundException kalau ga ketemu
private async findOrThrow(userId: string, id: string) {
  const item = await this.prisma.product.findFirst({
    where: { id, user_id: userId },
  });

  if (!item) {
    throw new NotFoundException('Product not found');
  }

  return item;
}
```

PENTING: `findFirst({ where: { id, user_id: userId } })` — gunakan `findFirst`, **bukan `findUnique`**, karena kita filter by `userId` juga.

### Error umum yang mungkin disuruh fix:

1. **"Product not found" padahal ada** → Cek `where` clause, mungkin typo `user_id` vs `userId`
2. **Duplicate entry error** → Cek pake `findUnique({ where: { user_id_slug: {...} } })`
3. **Foreign key constraint** → Hapus dulu relasi child sebelum parent
4. **Validation error 400** → Cek decorator di DTO (class-validator)

---

## 10. Cheat Sheet: Perintah Penting

```bash
# Development
npm run start:dev              # Jalankan server dengan hot-reload
npm run start                  # Jalankan tanpa watch

# Build
npm run build                  # Build production

# Database
npx prisma generate            # Generate Prisma client setelah edit schema
npx prisma migrate dev         # Buat migration + apply ke DB
npx prisma migrate dev --name <nama>  # Migration dengan nama
npx prisma migrate deploy      # Apply migration di production
npx prisma studio              # Buka GUI database di browser
npx prisma format              # Format schema.prisma
npx prisma validate            # Validasi schema

# Testing
npm test                       # Unit test
npm run test:e2e               # E2E test
```

### NestJS CLI Commands

Gunakan `npx nest` atau `nest` (kalau udah install global).

#### Generate Module

```bash
# npx nest g module <path>
npx nest g module modules/api/suppliers/api-suppliers
# → Hasil: src/modules/api/suppliers/api-suppliers.module.ts
# → Otomatis terdaftar di app.module.ts
```

#### Generate Controller (tanpa test file)

```bash
npx nest g controller modules/api/suppliers/suppliers --no-spec
# → Hasil: src/modules/api/suppliers/suppliers.controller.ts
```

#### Generate Service (tanpa test file)

```bash
npx nest g service modules/api/suppliers/suppliers --no-spec
# → Hasil: src/modules/api/suppliers/suppliers.service.ts
```

#### Generate Lengkap Sekaligus

```bash
# Module dulu
npx nest g module modules/api/suppliers/api-suppliers
# Lalu controller + service di dalam folder module yang sama
npx nest g controller modules/api/suppliers/suppliers --no-spec
npx nest g service modules/api/suppliers/suppliers --no-spec
```

#### Generate Class / DTO

```bash
# npx nest g class <path> --no-spec
npx nest g class modules/api/suppliers/dto/create-supplier --no-spec
# → Hasil: src/modules/api/suppliers/dto/create-supplier.ts
# ⚠️ Hati-hati: Nest CLI generate class sebagai file .ts biasa (bukan class-validator),
#    jadi decorator @IsString() dll harus ditambah manual.
```

#### Nest CLI Flags Penting

| Flag | Fungsi |
|------|--------|
| `--no-spec` | Skip generate test file (biar ga terlanjur bikin test yg ga kepake) |
| `--flat` | Generate tanpa subfolder (semua di folder yg sama) |
| `--dry-run` | Pura-pura generate (tampilkan file apa aja yg bakal dibuat) |

Contoh dry-run:

```bash
npx nest g module modules/api/suppliers/api-suppliers --dry-run
# → Nampilin preview file yang bakal digenerate tanpa beneran buat
```

#### Alternative: Manual Copy-Paste (Lebih Cepat di Live Code)

Di live coding lebih aman copy dari module existing (misal categories ke suppliers) terus search-replace nama. Nest CLI terkadang generate struktur folder yang beda dari konvensi proyek ini. Tapi kalau interviewer minta pake CLI, perintah di atas udah cukup.

---

## 11. Pola Umum yang Harus Dihafal

### A. Struktur File Baru

Setiap entity baru = 6 file minimal:

| File | Lokasi | Tujuan |
|------|--------|--------|
| Prisma model | `prisma/schema.prisma` | Tabel database |
| Types | `src/modules/api/X/types/x.types.ts` | Interface TypeScript |
| DTO | `src/modules/api/X/dto/` | Validation class |
| Service | `src/modules/api/X/x.service.ts` | Business logic + Prisma |
| Controller | `src/modules/api/X/x.controller.ts` | HTTP handler |
| Module | `src/modules/api/X/api-x.module.ts` | Module definition |
| + AppModule | `src/app.module.ts` | Import module |

Kalau perlu halaman web, tambah:

| File | Lokasi | Tujuan |
|------|--------|--------|
| Web Controller | `src/modules/web/X/x.controller.ts` | Render halaman |
| Web Module | `src/modules/web/X/web-x.module.ts` | Module definition |
| View .hbs | `src/views/pages/X/*.hbs` | Template HTML |
| JS file | `src/public/js/x.js` | Frontend logic |

### B. Template Code untuk Service (CRUD Standard)

```typescript
@Injectable()
export class XxxService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: PaginationQueryDto) {
    const where = { user_id: userId, ...search logic };
    const [items, total] = await Promise.all([
      this.prisma.xxx.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
      this.prisma.xxx.count({ where }),
    ]);
    return { message: '...', data: items.map(toResource), meta };
  }

  async findOne(userId: string, id: string) {
    const item = await this.findOrThrow(userId, id);
    return { message: '...', data: toResource(item) };
  }

  async create(userId: string, dto: CreateXxxDto) {
    const item = await this.prisma.xxx.create({
      data: { user_id: userId, ...dto fields },
    });
    return { message: '...', data: toResource(item) };
  }

  async update(userId: string, id: string, dto: UpdateXxxDto) {
    await this.findOrThrow(userId, id);
    const item = await this.prisma.xxx.update({ where: { id }, data: { ...dto fields } });
    return { message: '...', data: toResource(item) };
  }

  async remove(userId: string, id: string) {
    await this.findOrThrow(userId, id);
    await this.prisma.xxx.delete({ where: { id } });
    return { message: '...', data: null };
  }

  private async findOrThrow(userId: string, id: string) {
    const item = await this.prisma.xxx.findFirst({ where: { id, user_id: userId } });
    if (!item) throw new NotFoundException('Xxx not found');
    return item;
  }
}
```

### C. Import Path Rules

```
src/modules/api/products/products.service.ts → import PrismaService from '../../prisma/prisma.service'
src/modules/api/products/products.controller.ts → import decorators from '../../../common/decorators/'
src/modules/web/products/products.controller.ts → pathnya lebih pendek
```

Gunakan path relatif dari file ke file target. Contoh:
- `products.controller.ts` (di `modules/api/products/`) ke `current-user.decorator.ts` (di `common/decorators/`) = `../../../common/decorators/current-user.decorator`

### D. @UseGuards(JwtAuthGuard)
- Controller API selalu pake decorator ini di atas class
- Kecuali endpoint login/register yang pake `@Public()`
- Web controller TIDAK pake guard (auth cek di frontend JS via `Auth.redirectIfGuest()`)

### E. Response Format (API)

```json
{
  "message": "Suppliers retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

### F. Quick Checklist Kalau Disuruh "Buat Fitur Baru"

1. [ ] Prisma schema — model + relasi
2. [ ] `npx prisma generate`
3. [ ] Types — interface resource
4. [ ] DTO — create + update
5. [ ] Service — CRUD methods
6. [ ] Controller — routes + handler
7. [ ] Module — imports + providers
8. [ ] AppModule — import module baru
9. [ ] Web controller — halaman routing
10. [ ] Web module
11. [ ] .hbs view — list & form
12. [ ] JS file — frontend logic
13. [ ] Method di API object — kalau perlu fetch dari frontend

---

## 12. Case Study 8: Google Sign-In dengan Passport

**Skenario: Nambah fitur login pake Google (OAuth 2.0).**

### Flow Google Sign-In

```
[Google OAuth Consent Screen]
         ↓ (redirect dengan authorization code)
Browser → API Gateway → GoogleStrategy.validate() → tukar code dgn access_token
         → fetch user info dari Google API
         → cari/create User di DB
         → generate JWT tokens
         → redirect ke frontend dengan token
```

### Langkah 1: Install Package

```bash
npm install passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

### Langkah 2: Update Prisma Schema

File: `prisma/schema.prisma`

```prisma
model User {
  // ... field existing ...
  google_id   String?   @unique @db.VarChar(255)   // NEW: ID dari Google
  avatar_url  String?   @db.VarChar(500)           // NEW: foto profil
  // ... relasi existing ...
}
```

```bash
npx prisma generate
npx prisma migrate dev --name add_google_auth
```

### Langkah 3: Update Config

File: `src/config/app.ts`

```typescript
export default () => ({
  // ... existing config ...
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
  },
});
```

File: `.env` dan `.env.example`

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
```

### Langkah 4: Update Types

File: `src/modules/api/auth/types/auth.types.ts`

```typescript
// Tambahkan interface ini
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// Update AuthUserResource — tambah field
export interface AuthUserResource {
  // ... existing ...
  avatar_url: string | null;  // NEW
}
```

### Langkah 5: Buat Google Strategy

File: `src/modules/api/auth/strategy/google.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { GoogleProfile, AuthenticatedUser } from '../types/auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientId')!,
      clientSecret: configService.get<string>('google.clientSecret')!,
      callbackURL: configService.get<string>('google.callbackUrl')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value: string }>;
      displayName?: string;
      photos?: Array<{ value: string }>;
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    const googleProfile: GoogleProfile = {
      id,
      email: emails?.[0]?.value ?? '',
      name: displayName ?? '',
      picture: photos?.[0]?.value ?? '',
    };

    done(null, googleProfile);
  }
}
```

### Langkah 6: Update AuthService — tambah method `googleLogin`

File: `src/modules/api/auth/auth.service.ts`

```typescript
// Di constructor, inject ConfigService
// (sudah ada, cukup tambah method ini)

async googleLogin(
  googleProfile: GoogleProfile,
): Promise<ResponseDto<AuthTokenResource>> {
  // Cari user berdasarkan google_id
  let user = await this.prisma.user.findUnique({
    where: { google_id: googleProfile.id },
  });

  if (!user) {
    // Cari user berdasarkan email (kalau udah daftar pake email)
    user = await this.prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (user) {
      // Link akun Google ke user existing
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          google_id: googleProfile.id,
          avatar_url: googleProfile.picture,
        },
      });
    } else {
      // Buat user baru
      user = await this.prisma.user.create({
        data: {
          name: googleProfile.name,
          email: googleProfile.email,
          google_id: googleProfile.id,
          avatar_url: googleProfile.picture,
          // Iseng dulu — user harus ganti password nanti
          password: await bcrypt.hash(
            crypto.randomUUID(),
            AuthService.BCRYPT_SALT_ROUNDS,
          ),
        },
      });
    }
  }

  return {
    message: 'Google login successful',
    data: this.buildTokenResponse(user),
  };
}

// Update buildTokenResponse kalau user punya avatar_url
private buildTokenResponse(user): AuthTokenResource {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,   // tambahkan ini
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    access_token: this.jwtService.sign(payload),
    refresh_token: this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    }),
  };
}
```

Jangan lupa import di bagian atas:

```typescript
import * as crypto from 'node:crypto';
import { GoogleProfile } from './types/auth.types';
```

### Langkah 7: Update AuthController — tambah endpoint Google

File: `src/modules/api/auth/auth.controller.ts`

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import type { ResponseDto } from '../../../common/dto/response.dto';
import type {
  AuthTokenResource,
  AuthUserResource,
  AuthenticatedUser,
  GoogleProfile,
} from './types/auth.types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ... existing endpoints ...

  // 🔥 TAMBAHKAN INI:

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // redirect ke Google consent screen (digaransi oleh Passport)
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @CurrentUser() googleProfile: GoogleProfile,
    @Res() res: Response,
  ) {
    const result = await this.authService.googleLogin(googleProfile);

    // Redirect ke frontend dengan token di URL fragment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/auth/callback#access_token=${result.data.access_token}&refresh_token=${result.data.refresh_token}`,
    );
  }
}
```

> **CATATAN**: `@CurrentUser()` di endpoint google ini bakal nge-return `GoogleProfile`, bukan `AuthenticatedUser` biasa. Pastikan `CurrentUser` decorator narik dari `request.user` tanpa asumsi shape.

> **⚠️ MASALAH**: Decorator `@CurrentUser()` yang existing return type `AuthenticatedUser`, tapi di Google flow `request.user` isinya `GoogleProfile`. Solusinya:
> 1. Buat endpoint terpisah tanpa `@CurrentUser` → pake `@Req() req`
> 2. Atau buat custom parameter decorator baru

Alternative (lebih aman) — pake `@Req()` langsung:

```typescript
@Public()
@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req: any, @Res() res: Response) {
  const result = await this.authService.googleLogin(req.user);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return res.redirect(
    `${frontendUrl}/auth/callback#access_token=${result.data.access_token}&refresh_token=${result.data.refresh_token}`,
  );
}
```

### Langkah 8: Update ApiAuthModule — daftarin GoogleStrategy

File: `src/modules/api/auth/api-auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { GoogleStrategy } from './strategy/google.strategy';      // NEW

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),           // ← default tetap jwt
    JwtModule.registerAsync({...}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],           // ← tambah GoogleStrategy
  exports: [AuthService],
})
export class ApiAuthModule {}
```

### Langkah 9: Frontend — Google Login Button

File: `src/views/pages/auth/login.hbs` — tambah button Google sebelum form:

```html
<div class="mt-6">
  <a href="/api/v1/auth/google"
     class="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    Sign in with Google
  </a>
</div>

<div class="relative mt-6">
  <div class="absolute inset-0 flex items-center">
    <div class="w-full border-t border-gray-200"></div>
  </div>
  <div class="relative flex justify-center text-sm">
    <span class="bg-white px-2 text-gray-500">Or continue with</span>
  </div>
</div>
```

### Langkah 10: Frontend — Handle Callback Redirect

Bikin halaman callback handler atau handle di `auth.js`:

```javascript
// Di src/public/js/auth.js — tambah method
function handleGoogleCallback() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#access_token=')) return;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken) {
    API.setTokens({ access_token: accessToken, refresh_token: refreshToken });
    window.location.href = '/dashboard';
  }
}

// Panggil pas page load
handleGoogleCallback();
```

Atau bikin halaman `/auth/callback`:

```html
<!-- src/views/pages/auth/callback.hbs -->
<!DOCTYPE html>
<script src="/js/api.js"></script>
<script>
(function() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken) {
    API.setTokens({ access_token: accessToken, refresh_token: refreshToken });
    window.location.href = '/dashboard';
  } else {
    window.location.href = '/login?error=google_auth_failed';
  }
})();
</script>
```

Tambahkan route di web controller (misal di `WebAuthModule`):

```typescript
// src/modules/web/auth/auth-page.controller.ts
import { Controller, Get, Render, Res } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';

@Public()
@Controller()
export class AuthPageController {
  // ... existing routes ...

  @Get('/auth/callback')
  @Render('pages/auth/callback')
  callback() {
    return {};
  }
}
```

### Summary: File yang Berubah untuk Google Sign-In

| File | Action |
|------|--------|
| `package.json` | Install `passport-google-oauth20` |
| `prisma/schema.prisma` | Tambah field `google_id`, `avatar_url` |
| `.env` / `.env.example` | Tambah `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| `src/config/app.ts` | Tambah config `google` |
| `src/modules/api/auth/types/auth.types.ts` | Tambah `GoogleProfile`, update `AuthUserResource` |
| `src/modules/api/auth/strategy/google.strategy.ts` | **NEW** — Google OAuth strategy |
| `src/modules/api/auth/auth.service.ts` | Tambah method `googleLogin()` |
| `src/modules/api/auth/auth.controller.ts` | Tambah endpoint `GET /google` dan `GET /google/callback` |
| `src/modules/api/auth/api-auth.module.ts` | Daftarin `GoogleStrategy` di `providers`, update `PassportModule` |
| `src/views/pages/auth/login.hbs` | Tambah button "Sign in with Google" |
| `src/views/pages/auth/callback.hbs` | **NEW** — callback handler page |
| `src/modules/web/auth/auth-page.controller.ts` | Tambah route `/auth/callback` |

### Passive Google Login (No Redirect — Pakai Popup / Token dari Frontend)

Kalau disuruh pake alur "frontend dapet Google token dari Google SDK, tinggal kirim ke backend":

```typescript
// Controller
@Public()
@Post('google/token')
@HttpCode(200)
async googleToken(
  @Body() dto: GoogleTokenDto,
): Promise<ResponseDto<AuthTokenResource>> {
  return this.authService.googleLoginWithToken(dto.id_token);
}
```

```typescript
// DTO
export class GoogleTokenDto {
  @IsString()
  @IsNotEmpty()
  id_token!: string;
}
```

```typescript
// Service — tambah method
async googleLoginWithToken(
  idToken: string,
): Promise<ResponseDto<AuthTokenResource>> {
  // Verifikasi token Google
  const ticket = await this.verifyGoogleToken(idToken);
  const payload = ticket.getPayload();

  const googleProfile: GoogleProfile = {
    id: payload.sub,
    email: payload.email!,
    name: payload.name!,
    picture: payload.picture!,
  };

  return this.googleLogin(googleProfile);
}

private async verifyGoogleToken(idToken: string) {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket;
}
```

> Butuh install: `npm install google-auth-library`

--- 

## 13. Google Sign-In — Quick Checklist

- [ ] Install `passport-google-oauth20` + types
- [ ] Add `google_id` + `avatar_url` ke model User di Prisma
- [ ] `npx prisma generate && npx prisma migrate dev`
- [ ] Tambah `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` di `.env` + config
- [ ] Buat `GoogleProfile` type
- [ ] Buat `google.strategy.ts` (extends PassportStrategy)
- [ ] Tambah `googleLogin()` di AuthService (find or create user)
- [ ] Tambah endpoint `GET /api/v1/auth/google` dan `/google/callback` di controller
- [ ] Daftarin `GoogleStrategy` di providers module
- [ ] Update `PassportModule.register({ defaultStrategy: 'jwt' })`
- [ ] Tambah tombol Google di login.hbs
- [ ] Handle callback redirect ke dashboard

---

**Good luck for your interview! Yang penting paham flow-nya, bukan hafal detail kodenya. Ingat:**
- **Service** = business logic + Prisma
- **Controller** = HTTP routing + auth guard
- **DTO** = input validation
- **Types** = response shape
- **Module** = wiring semuanya
- **AppModule** = daftarin module baru
