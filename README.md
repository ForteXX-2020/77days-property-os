# 77Days Property OS MVP

Next.js App Router, TypeScript, Tailwind CSS, and Supabase JS client MVP for a property portfolio dashboard.

## Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Pages

- `/dashboard`
- `/property-summary`

## Supabase views

- `portfolio_kpi_view`
- `property_summary_view`
- `alerts_view`

The MVP intentionally does not include auth, OCR, uploads, exports, payments, tenant login, or property management company login.
