# ZuhraGraph - Digital Art Commission Management

ZuhraGraph is a complete backend platform for managing digital art commissions for a single artist. Built using Next.js (App Router), Prisma, PostgreSQL, Midtrans, and Cloudinary.

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Auth.js (NextAuth) with JWT
- **Payments:** Midtrans API
- **Storage:** Cloudinary
- **Architecture:** Clean Architecture with strong OOP principles

## Setup and Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example `.env` file and fill in your details:
```bash
cp .env.example .env
```
Ensure you have a PostgreSQL database running and update `DATABASE_URL`.

### 3. Database Setup (Prisma)
Since this project uses Prisma 7, the connection URL is configured in `prisma.config.ts`. Set `DATABASE_URL` in your `.env`.

To run migrations and apply the schema:
```bash
npx prisma db push
```
*(Or use `npx prisma migrate dev` if you prefer migration history)*

### 4. Seed Database
Seed the database with default Admin, Buyer, Packages, and Queue settings:
```bash
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```

## Architecture

The project strictly follows **Clean Architecture** and **Dependency Injection**:
- `src/domain`: Business rules, OOP Entities (User, Order, Payment), and Interfaces (PaymentGateway).
- `src/application`: Use Cases and Services (OrderService).
- `src/infrastructure`: External integrations (MidtransPaymentGateway, CloudinaryStorageService, Prisma Repositories).
- `src/presentation`: Controllers processing HTTP Requests via Next.js Route Handlers.

For a detailed breakdown of Object-Oriented Programming (OOP) requirements, refer to `OOP_REPORT.md`.
