# Doctor Portal — PCT-HIMS Front End

A complete, working front end for the **doctor's side** of your Hospital
Information Management System, built with **Next.js + React** (the "front
end" part of your MERN stack) and **Tailwind CSS** for styling.

This guide assumes you have **never done this before**. Every step is
spelled out. Read it top to bottom the first time.

---

## 1. What you're actually building (in plain English)

Think of your hospital app like a restaurant:

- **Frontend (this project)** = the dining room. It's what the doctor sees
  and clicks on — buttons, tables, forms. It has no idea how to cook food;
  it just displays things nicely and takes orders.
- **Backend (Node.js + Express, not in this project)** = the kitchen. It
  receives orders ("give me today's appointments"), does the real work
  (checks the database), and sends back a plate of food (data).
- **Database (MongoDB)** = the pantry, where all the ingredients (patient
  records, appointments, prescriptions) are stored.

Right now, this project is a dining room with a **fake kitchen** — a file
called `data/mockData.js` pretends to be your backend so you can build and
see the whole app working *today*, before your real Express + MongoDB
backend exists. Section 8 shows exactly how to swap the fake kitchen for
the real one later.

---

## 2. Prerequisites — what to install first

You need three things on your computer before touching any code.

| Tool | What it is | Why you need it |
|---|---|---|
| **Node.js** (v18 or newer) | Lets JavaScript run outside a browser | Runs the dev server, installs packages |
| **npm** | Comes bundled with Node.js | Downloads the libraries this project uses |
| **VS Code** | A code editor | Where you'll read/write the code |

### Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the button that says "Recommended for
   most users").
3. Run the installer, click Next through all the defaults.
4. Check it worked — open a terminal (see below) and type:
   ```
   node -v
   npm -v
   ```
   You should see version numbers like `v20.11.0` and `10.2.4`. If you see
   an error instead, restart your computer and try again.

### Install VS Code
1. Go to https://code.visualstudio.com
2. Download and install it for your operating system.
3. Optional but recommended extensions (open VS Code → click the square
   icon on the left sidebar → search and install):
   - **ES7+ React/Redux/React-Native snippets**
   - **Tailwind CSS IntelliSense**
   - **Prettier - Code formatter**

### What is "a terminal"?
It's a text box where you type commands instead of clicking.
- **VS Code has one built in**: open VS Code, then menu bar →
  `Terminal → New Terminal`. A panel opens at the bottom. That's where
  every command in this guide gets typed.

---

## 3. What's inside this project

```
doctor-portal/
├── components/           Reusable UI pieces (Sidebar, Topbar, cards, tables)
│   ├── Sidebar.js
│   ├── Topbar.js
│   ├── Layout.js
│   ├── StatCard.js
│   ├── StatusBadge.js
│   ├── AppointmentTable.js
│   ├── DoctorAvailability.js
│   └── DepartmentLoad.js
├── pages/                 Every file here = one URL/page (Next.js routing)
│   ├── _app.js             Wraps every page (loads global CSS)
│   ├── index.js             "/" → redirects to /dashboard
│   ├── login.js             "/login"
│   ├── dashboard.js         "/dashboard"
│   ├── appointments.js      "/appointments"  (OPD queue)
│   ├── consultation.js      "/consultation"  (notes + prescription form)
│   ├── lab-orders.js        "/lab-orders"    (starter page)
│   ├── prescriptions.js     "/prescriptions" (starter page)
│   └── patients/
│       ├── index.js → (see patients.js)      "/patients"
│       └── [id].js          "/patients/p001" (dynamic page per patient)
├── data/
│   └── mockData.js         Fake backend data — replace with real API calls later
├── styles/
│   └── globals.css         Tailwind setup + base styles
├── public/
│   └── images/              Put logos/photos here (see Section 7)
├── tailwind.config.js      Color palette, fonts, design tokens
├── postcss.config.js
├── next.config.js
└── package.json            List of libraries this project depends on
```

**Why Next.js instead of plain React?** In plain React, you'd have to
manually configure routing (which URL shows which screen) with a library
like React Router. Next.js does this automatically: **the file name
becomes the URL**. Create `pages/billing.js` and `/billing` just works —
no extra setup. That's the whole reason we used it.

---

## 4. Running it on your computer (step-by-step)

1. **Get the project onto your machine.** If you downloaded a `.zip`,
   unzip it. You'll get a folder called `doctor-portal`.

2. **Open it in VS Code.**
   `File → Open Folder...` → select `doctor-portal`.

3. **Open the terminal** (`Terminal → New Terminal`) and make sure you're
   inside the project folder — the terminal prompt should show
   `doctor-portal` in the path. If not, type:
   ```
   cd path/to/doctor-portal
   ```

4. **Install the libraries the project needs.** This reads
   `package.json` and downloads everything listed there (React, Next.js,
   Tailwind, icons) into a folder called `node_modules`.
   ```
   npm install
   ```
   This takes 1–3 minutes and only needs to be done once (or again if you
   change `package.json`).

5. **Start the development server.**
   ```
   npm run dev
   ```
   You'll see something like:
   ```
   ▲ Next.js 14.2.5
   - Local:  http://localhost:3000
   ```

6. **Open your browser** and go to `http://localhost:3000`. You should
   land on the Doctor Dashboard, styled just like the reference
   screenshots — sidebar on the left, stat cards, appointment queue.

7. **To stop the server:** click into the terminal and press `Ctrl + C`.

### Try editing something right now
With `npm run dev` still running, open `pages/dashboard.js`, change the
text `"Doctor Dashboard"` to `"My Dashboard"`, save the file (`Ctrl+S`).
Your browser tab updates **instantly** without you refreshing — this is
called Hot Reload. This is how you'll build everything: edit → save →
look at the browser.

---

## 5. A tour of the pages you already have

| Page | URL | What it shows |
|---|---|---|
| Dashboard | `/dashboard` | KPI cards, "my queue today", department load, doctor availability |
| OPD / Appointments | `/appointments` | Full appointment queue with status filters (matches your screenshot) |
| Patients | `/patients` | Searchable grid of patient cards |
| Patient detail | `/patients/p001` | Vitals, visit history, prescriptions for one patient |
| Consultation | `/consultation?patient=NAME` | Clinical notes, diagnosis, prescription form |
| Login | `/login` | Simple sign-in screen |

Click "Start Consult" on any appointment row and it takes you straight
into the Consultation page for that patient — this is real Next.js
routing, using the `Link` component and a URL query parameter.

---

## 6. How the pieces fit together (React basics, gently explained)

- **Component** = a reusable chunk of UI, written as a JavaScript
  function that returns HTML-like syntax called JSX. Example:
  `components/StatCard.js` takes a `label`, `value`, and `icon`, and
  draws one little card. You reuse it 4 times on the dashboard with
  different data — instead of copy-pasting the same HTML 4 times.

- **Props** = the inputs you pass into a component, like arguments to a
  function: `<StatCard label="Total Today" value={12} icon="Users" />`.

- **State** (`useState`) = a component's own memory that can change while
  the user interacts with it. Example: in `consultation.js`,
  `const [notes, setNotes] = useState("")` remembers what the doctor has
  typed into the notes box. Every time they type, `setNotes` updates it
  and the screen redraws.

- **Pages vs components**: a **page** is a full screen tied to a URL. A
  **component** is a smaller reusable piece that pages are built from.
  Dashboard (page) is made of StatCard, AppointmentTable, DoctorAvailability
  (components).

You don't need to memorize this — just know these words when you see them
in the code comments.

---

## 7. Adding your own images and assets

1. Put image files (logo, hospital photo, doctor avatar) inside
   `public/images/`. Example: `public/images/hospital-logo.png`.
2. Reference them in code with a path starting at `/images/...` (no
   `public` in the path — Next.js serves that folder automatically):
   ```jsx
   <img src="/images/hospital-logo.png" alt="Hospital logo" className="h-8" />
   ```
3. For icons (the little symbols in the sidebar, stat cards, buttons),
   this project already uses the **lucide-react** icon library — hundreds
   of clean, consistent icons as React components:
   ```jsx
   import { Stethoscope } from "lucide-react";
   <Stethoscope size={18} className="text-primary" />
   ```
   Browse available icons at https://lucide.dev/icons — search for what
   you need, then import it by that exact name.
4. For a doctor's photo avatar instead of initials, replace the initials
   `<div>` in `Sidebar.js` / `Topbar.js` with an `<img>` tag pointing at
   `/images/doctor-photo.jpg`.

---

## 8. Connecting to a real backend later

Right now every page imports fake data from `data/mockData.js`. When your
Express + MongoDB backend is ready and running (say, at
`http://localhost:5000`), replace the import with a real network request.

**Before (fake data):**
```jsx
import { appointments } from "../data/mockData";
```

**After (real API call), using Next.js's `getServerSideProps`:**
```jsx
export async function getServerSideProps() {
  const res = await fetch("http://localhost:5000/api/appointments");
  const appointments = await res.json();
  return { props: { appointments } };
}

export default function Appointments({ appointments }) {
  // rest of the component stays exactly the same
}
```

Because every component already expects data in the same shape as
`mockData.js`, you mostly just need to make sure your Express API returns
JSON shaped the same way (same field names: `patient`, `time`, `status`,
etc.) — the UI won't need to change.

For actions that change data — saving a consultation, starting an
appointment — call `fetch` with `method: "POST"` inside the relevant
button's click handler, e.g. in `consultation.js`'s `handleSave` function.

For authentication (real doctor login), your Express backend would verify
the email/password and return a token (JWT). Store that token and send it
in an `Authorization` header on every future request. That's a slightly
bigger topic — happy to build that out in detail once your backend exists.

---

## 9. Testing the front end locally

Since this is a UI project, "testing" mostly means **clicking through it
like a doctor would** and checking nothing looks or behaves wrong:

1. `npm run dev`, open `http://localhost:3000`.
2. Resize your browser window (or open Chrome DevTools with `F12` →
   toggle device toolbar) to check it looks fine on a phone-sized screen
   too — this project is responsive.
3. Click every sidebar link — confirm the right page loads.
4. On Appointments, click each status filter chip (Waiting, In Consult,
   etc.) — confirm the table filters correctly.
5. Click "Start Consult" on a row — confirm it opens Consultation with the
   right patient name in the subtitle.
6. On Consultation, type in the notes box, add/remove a medicine row,
   click "Save Consultation" — confirm the green confirmation message
   appears.
7. Go to Patients, search a name, click a patient card — confirm the
   detail page shows that patient's vitals and history.

When you're ready to add real automated tests (recommended once the app
grows), the standard tools are **Jest** + **React Testing Library** for
component tests, and **Playwright** or **Cypress** for full click-through
tests — ask and I'll set those up too.

---

## 10. Building for production (when you're ready to deploy)

```
npm run build
npm run start
```
`build` compiles an optimized version; `start` runs that optimized
version (this is what you'd deploy to a real server, not `npm run dev`,
which is only for development). Common free/cheap hosting for a Next.js
front end: **Vercel** (made by the Next.js team — easiest option),
Netlify, or your own server alongside your Express backend.

---

## Quick command reference

```bash
npm install       # one-time: download all dependencies
npm run dev        # start local development server (localhost:3000)
npm run build       # build an optimized production version
npm run start        # run the production build
```

---

## Where to go next

- Wire up real login (Section 8's note on JWT).
- Add a `billing.js` and `ipd.js` page the same way `appointments.js` was
  built, using the sidebar groups already sketched out in
  `components/Sidebar.js`.
- Add role-based views (Admin, Receptionist, Pharmacist) as separate
  Next.js route groups once the doctor side feels solid.

If anything in this project errors out, copy the exact error message from
the terminal — that's the fastest way to debug it.
