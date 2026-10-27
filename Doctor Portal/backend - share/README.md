# Doctor Portal — Backend

Express + MongoDB (Mongoose) API for the Next.js doctor-portal frontend. Built to match
the exact data shapes already used in `data/mockData.js`, so wiring the frontend up is
mostly "replace the import with a fetch call."

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm run seed                # populates the DB with data matching mockData.js
npm run dev                 # starts on http://localhost:5000
```

You need a MongoDB instance running — either local (`mongod`) or a free
[Atlas](https://www.mongodb.com/atlas) cluster, with the connection string in `MONGO_URI`.

**Login credentials after seeding:** any doctor email from `seed/seed.js`
(e.g. `priya.sharma@pcthims.com`) with password `password123`.

## 2. Project structure

```
backend/
  config/db.js            mongoose connection
  models/                 Doctor, Patient, Appointment, Consultation, Prescription, LabOrder
  middleware/              auth (JWT), asyncHandler, centralized error handler
  controllers/             one file per resource, all the business logic
  routes/                  thin Express routers, wired to controllers
  seed/seed.js             loads data equivalent to data/mockData.js
  server.js                app entry point
```

## 3. API reference

All routes are prefixed `/api`. Everything except `/auth/login` requires
`Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, doctor }` |
| GET | `/auth/me` | current doctor profile (`currentDoctor` in mockData) |
| GET | `/dashboard/stats?doctorId=all` | KPI row (defaults to logged-in doctor) |
| GET | `/dashboard/department-load` | DepartmentLoad chart data |
| GET | `/doctors` | DoctorAvailability panel |
| GET | `/doctors/:id` | one doctor |
| GET | `/appointments?status=&doctorId=&date=` | AppointmentTable rows |
| POST | `/appointments` | book an appointment |
| PATCH | `/appointments/:id/status` | move through the queue |
| GET | `/patients?search=` | Patients grid |
| GET | `/patients/:id` | vitals + history + prescriptions, shaped like `mockData.patients[]` |
| POST | `/patients` | register a patient |
| PATCH | `/patients/:id/vitals` | update vitals |
| POST | `/consultations` | save a consultation (see §5 below — this is the important one) |
| GET | `/consultations/:patientId` | raw consultation history |
| GET | `/lab-orders?status=&doctorId=` | lab orders list |
| POST | `/lab-orders` | order a test |
| PATCH | `/lab-orders/:id/status` | update result status |
| GET | `/prescriptions?doctorId=&patientId=` | Prescriptions page |

## 4. Wiring up the frontend

The frontend currently imports static data:

```js
import { appointments } from "../data/mockData";
```

Swap that for a fetch, e.g. in `dashboard.js`:

```js
useEffect(() => {
  fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json())
    .then((data) => setAppointments(data.appointments));
}, []);
```

To avoid CORS/`NEXT_PUBLIC_API_URL` boilerplate, add a rewrite to
`next.config.js` so the frontend can call `/api/...` directly and Next proxies
it to the backend:

```js
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:5000/api/:path*" }];
  },
};
```

For auth, `login.js`'s `handleSubmit` should `POST /api/auth/login`, store the
returned `token` (localStorage is simplest to start; an httpOnly cookie is
better for production), and attach it as `Authorization: Bearer <token>` on
every subsequent request.

## 5. The trickiest part: saving a consultation

`consultation.js` submits notes, a diagnosis, and a dynamic list of
medications in one form. Saving that touches **five** collections:
`Consultation`, `Prescription` (one per medicine), optionally `LabOrder`, the
`Appointment` (→ `Completed`), and the `Doctor` (→ `Available` again).

If any one of those writes fails partway through, you get corrupted state —
e.g. a diagnosis saved with no prescriptions, or a doctor permanently stuck
"In Consult". `controllers/consultationController.js` handles this with a
**MongoDB session transaction** (`session.withTransaction`), so all five
writes commit together or none of them do.

The catch: transactions only work if MongoDB is running as a **replica set**
— a bare standalone local `mongod` will throw `Transaction numbers are only
allowed on a replica set member`. Two ways around that for local dev:

- Run `mongod --replSet rs0` and call `rs.initiate()` once in the mongo
  shell — real transactions, matches production.
- Or fall back to sequential writes with manual compensating deletes on
  failure (weaker guarantee, but works on a standalone instance). There's a
  comment at the bottom of `consultationController.js` sketching this
  fallback if you go that route — Atlas clusters support transactions
  natively, so you likely won't need it once you deploy.

## 6. Things intentionally left simple

- `avgConsultMins` on `Doctor` is a static seeded field, not computed from
  real consultation durations — fine for a student/demo project, but you'd
  want a rolling average from `Consultation.durationMins` in a real system.
- No role-based access beyond "is a logged-in doctor" — there's only one
  role in the seed data.
- No file uploads (lab result attachments, etc.) — `LabOrder.resultSummary`
  is plain text.
