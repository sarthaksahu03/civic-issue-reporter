# Civic Issue Reporter Backend

## Prerequisites
- Node.js 18+
- Supabase project (https://supabase.com)

## 1. Supabase Setup
1. Create a new project on Supabase.
2. Go to SQL Editor and run the contents of `supabase.schema.sql` to create the `users` and `grievances` tables.
3. Get your Supabase project URL and API keys (anon and service role) from Project Settings > API.
4. (Optional) Set up RLS (Row Level Security) and policies for your tables for production.

## 2. Backend Setup
1. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   PORT=4000
   ```
2. Install dependencies:
   ```
   cd backend
   npm install express cors dotenv @supabase/supabase-js
   ```
3. Start the server:
   ```
   node index.js
   ```
   > **Note:** This backend now uses ES module syntax (`import`/`export`). All local imports must include the `.js` extension.

## 3. API Endpoints
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `POST /api/grievances` — Submit new grievance
- `GET /api/grievances` — List grievances (filters: userId, status, category)
- `PATCH /api/grievances/:id/status` — Update grievance status (admin only)
- `GET /api/user/:id` — Get user profile
- `PATCH /api/user/:id` — Update user settings

## Notes
- For admin-only routes, check the user's `role` field (e.g., 'admin') in your app logic or via Supabase JWT claims.
- This backend is stateless; all authentication and authorization is handled via Supabase Auth and RLS.
