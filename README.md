
<p align="center">
	<img src="/frontend/public/icons/icon-192.png" width="96" alt="CivicEye Logo" />
</p>

<h1 align="center">CivicEye – Public Grievance Reporter</h1>

<p align="center">
	<b>A modern, transparent platform for reporting, tracking, and resolving civic issues in your city.</b>
</p>

<p align="center">
	<img alt="Vercel" src="https://img.shields.io/badge/Frontend-Vercel-blue?logo=vercel" />
	<img alt="Render" src="https://img.shields.io/badge/Backend-Render-46e3b7?logo=render" />
	<img alt="Supabase" src="https://img.shields.io/badge/Auth/DB-Supabase-3ecf8e?logo=supabase" />
	<img alt="PWA" src="https://img.shields.io/badge/PWA-Ready-5a0fc8?logo=pwa" />
	<img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>

---

## 🚀 Features

✅ User registration and login (email/password & Google OAuth)
✅ Report civic issues with media uploads (images/audio)
✅ Real-time notifications and status tracking
✅ Admin dashboard for managing, resolving, and rejecting grievances
✅ Admins upload proof images for resolved issues; users view these in a Gallery for transparency
✅ Justification required for rejected grievances, visible to users
✅ Clickable notifications that link directly to the relevant grievance
✅ FAQ page accessible from both header and footer
✅ Progressive Web App (PWA): installable on mobile, offline support
✅ Responsive, modern UI with Tailwind CSS

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Vite PWA
- **Backend:** Node.js, Express, Supabase (Auth, Database, Storage)
- **Deployment:** Vercel (frontend), Render (backend)
- **Other:** Leaflet (maps), dotenv, CORS

---

## 📝 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))

### 1. Supabase Setup

1. Create a new project on Supabase.
2. Run the SQL in `backend/supabase.schema.sql` to create required tables.
3. Get your Supabase project URL and API keys from Project Settings > API.
4. (Optional) Set up Row Level Security (RLS) and policies for production.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # Fill in your Supabase credentials
npm install
node index.js          # or npm run dev if you use nodemon
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env   # Fill in your API and Supabase keys
npm install
npm run dev            # For development
npm run build          # For production build
```

### 4. Deployment

- **Frontend:** Deploy `/frontend` to Vercel. Set environment variables in Vercel dashboard.
- **Backend:** Deploy `/backend` to Render. Set environment variables in Render dashboard.

---

## 🔑 Key Environment Variables

**Backend (.env):**
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
PORT=4000
SUPABASE_STORAGE_BUCKET=grievance-media
```

**Frontend (.env):**
```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RECAPTCHA_SITE_KEY=
```

---

## 📡 API Endpoints (Backend)

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `POST /api/auth/google` — Google OAuth login
- `POST /api/grievances` — Submit new grievance
- `GET /api/grievances` — List grievances
- `PATCH /api/grievances/:id/status` — Update grievance status (admin)
- `POST /api/grievances/:id/resolve` — Resolve with image upload (admin)
- `POST /api/grievances/:id/reject` — Reject with justification (admin)
- `GET /api/gallery` — Get all resolved-issue images
- `GET /api/user/:id` — Get user profile
- `PATCH /api/user/:id` — Update user settings

---

## 🗂️ Notable Pages

- **Dashboard:** User/admin dashboards for tracking and managing grievances
- **Gallery:** Public gallery of resolved-issue images for transparency
- **FAQ:** Frequently Asked Questions, accessible from header and footer

---

## 📱 PWA Support

- Installable on mobile devices
- Custom icons and manifest
- Offline support via service worker

---

## 📝 License

MIT
