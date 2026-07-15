# Sillage

Sillage is a fragrance discovery and recommendation platform built with Next.js and Supabase.

## Features

- Fragrance catalog
- Brand pages
- Notes and accords relationships
- High-performance CSV import pipeline
- PostgreSQL database with Supabase
- Type-safe TypeScript backend

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- PostgreSQL

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

## Database

The project uses Supabase migrations located in:

```
supabase/migrations
```

## Import Pipeline

The project includes a high-performance CSV import pipeline capable of importing large fragrance datasets using:

- Batch processing
- Bulk upserts
- Cross-batch caching
- Idempotent imports

Run:

```bash
npm run import
```

## Status

🚧 Currently under active development.