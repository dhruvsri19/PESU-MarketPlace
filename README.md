<p align="center">
  <h1 align="center">🏪 PESU Marketplace</h1>
  <p align="center">
    <em>Campus commerce, reimagined — built by students, for students.</em>
  </p>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Vercel-Deployed-000?style=for-the-badge&logo=vercel" alt="Vercel" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview & The Problem

Public marketplaces (OLX, Facebook Marketplace) are filled with scammers, fake listings, and zero accountability. University students deserve a **trusted, closed-loop trading environment** where every participant is a verified peer.

**PESU Marketplace** solves this by restricting access exclusively to PES University students through institutional email verification. Every user is a real, identifiable student — making transactions safer and disputes resolvable through campus channels.

---

## ✨ Core Features

- **🔐 Passwordless OTP Authentication** — Students sign in with a one-time code sent to their `@pesu.pes.edu` or `@stu.pes.edu` email. No passwords to remember or leak.
- **⚡ Frictionless Onboarding** — Email-first login; profile details (name, SRN, campus, branch) are collected after first sign-in via a guided modal.
- **🛍️ Real-Time Product Listings** — Browse, post, and manage listings with live updates powered by Supabase Realtime.
- **📸 Image Uploads** — Direct-to-cloud image uploads via Supabase Storage with instant preview.
- **💎 Liquid Glass UI** — A modern, premium interface with glassmorphism, neon accents, and smooth Framer Motion animations.
- **🎓 Campus-Gated Access** — Only verified PES University email holders can access the platform — zero outsiders.

---

## 🛠️ Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4            |
| **Backend**  | Express.js, TypeScript, Zod (validation)                    |
| **Database** | Supabase (PostgreSQL), Row Level Security (RLS)             |
| **Auth**     | Supabase Auth (Email OTP) + Custom SMTP relay via Brevo     |
| **Storage**  | Supabase Storage (product images, avatars)                  |
| **UI/UX**    | Framer Motion, Lucide Icons, custom Glassmorphism system    |
| **Hosting**  | Vercel (frontend), Supabase (backend services)              |
| **Security** | Helmet, CORS, express-rate-limit, Supabase RLS              |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project with Email OTP auth enabled

### 1. Clone the Repository

```bash
git clone https://github.com/dhruvsri19/MarketPlace.git
cd MarketPlace
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (in a separate terminal)
cd ../server
npm install
```

### 3. Configure Environment Variables

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000/api
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Backend** — create `server/.env`:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=8000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Run the Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your PESU email.

---

## 🔒 Security Architecture

### Custom SMTP Relay (Brevo)

Supabase's default email sender has strict rate limits and often lands in spam. PESU Marketplace uses a **custom Gmail SMTP relay powered by [Brevo](https://www.brevo.com/)** configured in the Supabase dashboard under **Auth → SMTP Settings**. This ensures:

- OTP emails are delivered reliably to university inboxes.
- Emails originate from a trusted sender domain, reducing spam filtering.
- High deliverability with no rate-limit bottlenecks during peak usage.

### Row Level Security (RLS)

Every table in the Supabase PostgreSQL database has **Row Level Security** policies enabled:

- **Users** can only read and update their own profile data.
- **Product listings** are publicly readable but only editable/deletable by the owner.
- **Storage objects** (images) are scoped to the authenticated user who uploaded them.

> [!IMPORTANT]
> If you fork this project, ensure RLS is enabled on all tables. Disabling it exposes user data to every authenticated client.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. **Fork** the repository.
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit your changes**: `git commit -m "feat: add your feature"`
4. **Push to the branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request** against `main`.

Please keep PRs focused and descriptive. For large changes, open an issue first to discuss the approach.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ☕ at <strong>PES University</strong>
</p>
