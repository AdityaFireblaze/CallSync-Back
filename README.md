# CallSync Backend

Express + MongoDB backend for CallSync mobile app.

Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

Endpoints

- POST `/api/auth/login` — body `{ phoneNumber, code }` returns JWT
- POST `/api/admin/create-employee` — admin (ADMIN_KEY) creates employee
- PATCH `/api/admin/activate/:id` — admin activates employee
- POST `/api/upload` — protected, multipart/form-data field `audio`
- GET `/files/:id` — protected streaming endpoint

Notes

- Admin routes require `x-admin-key` header or `Authorization: Bearer <ADMIN_KEY>` matching `.env`.
- Audio files are stored in MongoDB GridFS bucket `recordings`.
