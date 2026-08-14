# TokTickIT (ตอกติ๊กกิต)

TokTickIT is an IT service desk web application supporting Account and Access, Hardware, Software, and Network requests.

## Prerequisites
- Node.js (v18+)
- PostgreSQL
- Git

## Project Setup

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure your DATABASE_URL inside server/.env
npx prisma generate