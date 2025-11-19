# User Registration System

Short guide to set up, run, and access the project (frontend + backend).

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm (or yarn/pnpm)
- MongoDB instance/connection string

## Backend (NestJS)

1) Install deps
```bash
cd user-registration-be
npm install
```

2) Environment (.env in `user-registration-be`)
```env
MONGODB_URI=mongodb://localhost:27017/user-registration
JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173
PORT=4000
```

3) Run backend
```bash
npm run start:dev
```
API will run at `http://localhost:4000`.

## Frontend (React + Vite)

1) Install deps
```bash
cd user-registration-system-fe
npm install
```

2) Environment (.env in `user-registration-system-fe`)
```env
VITE_API_BASE_URL=http://localhost:4000
```

3) Run frontend
```bash
npm run dev
```
App will be available at `http://localhost:5173`.

## Access

- Public URL: `https://user-registration-system-fe.vercel.app/`
- Local development:
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:4000`

## App Pages

- Home (`/`): Guest view by default; shows user info when logged in
- Login (`/login`): Sign in; redirects to Home on success
- Sign Up (`/signup`): Create account; redirects to Home on success