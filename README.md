Pesu Marketplace
The Trusted Campus Exchange for PES University
A high-performance, secure, and exclusive peer-to-peer commerce platform that transforms how students buy, sell, and trade essentials within the campus ecosystem.

Table of Contents
Overview

The Problem

Core Features

Technology Stack

Architecture

Getting Started

Security & Authentication

Project Structure

Roadmap

Contributing

License

Overview
Pesu Marketplace is a modern, real-time trading platform designed exclusively for students at PES University. The application provides a centralized, secure hub for exchanging academic resources, electronics, and lifestyle gear. By leveraging a strict custom Email OTP authentication flow, it ensures a 100% verified student user base, eliminating the risks associated with public marketplaces.

Built for scale and speed, the platform runs on Next.js and React Native, utilizing Supabase for real-time data synchronization and edge-network deployment via Vercel for instant load times.

The Problem
Campus commerce is traditionally fragmented across informal WhatsApp groups, physical bulletin boards, or public platforms (like OLX or Facebook Marketplace) that pose several barriers for students:

Barrier	Description
Trust & Safety	Public platforms expose students to external scammers and unreliable strangers.
Discoverability	WhatsApp group messages disappear rapidly; finding specific textbooks or gear requires constant monitoring.
Friction	Coordinating meetups and verifying the identity of a buyer/seller on anonymous platforms is time-consuming.
Relevance	Broad marketplaces are cluttered with non-student-focused items, making it hard to find campus-specific essentials.
Pesu Marketplace addresses all four barriers by creating a walled-garden ecosystem restricted strictly to the university cohort.

Core Features
1. Zero-Friction Passwordless Auth

Utilizes a custom Google SMTP relay integrated with Supabase GoTrue to deliver highly reliable One-Time Passwords (OTPs) directly to student inboxes. No passwords to remember, no unauthorized external access.

2. Real-Time "Liquid Glass" UI

A highly responsive, cross-platform interface featuring a modern "Liquid Glass" design system. Product listings, image uploads, and inventory states update dynamically without requiring page refreshes, powered by Supabase real-time subscriptions.

3. P2P Direct Connectivity

Eliminates the middleman. Buyers can instantly view listing details and connect directly with sellers on campus. The platform handles the cataloging and discovery, leaving the transaction logistics to the students.

Technology Stack
Category	Technology	Notes
Frontend Framework	React / Next.js	Server-Side Rendering (SSR) for optimal SEO and initial load speeds.
Mobile Capability	React Native	Shared architectural logic for future iOS/Android native deployment.
Backend / BaaS	Supabase	PostgreSQL database, Auth, and Storage all in one managed service.
Styling	Tailwind CSS	Utility-first CSS framework enforcing the custom design system.
Deployment	Vercel	Edge network hosting for sub-second latency globally.
Mail Transport	Custom SMTP (Brevo/Gmail)	Ensures high deliverability of OTPs circumventing strict campus spam filters.
Architecture
Pesu Marketplace utilizes a serverless, decoupled architecture. The frontend communicates directly with the Supabase PostgreSQL database via securely defined Row Level Security (RLS) policies.

Plaintext
┌──────────────────────────────────────────────────────┐
│                  User's Device (Web/Mobile)          │
│                                                      │
│   Next.js / React Native Client                      │
│   ┌──────────────────┐   ┌──────────────────┐        │
│   │  Auth Flow       │   │  Market Dashboard│        │
│   │  (OTP via Email) │   │  (Real-time UI)  │        │
│   └────────┬─────────┘   └────────┬─────────┘        │
│            │                      │                  │
│   ┌────────┴──────────────────────┴──────────────┐   │
│   │               Supabase BaaS                  │   │
│   │  GoTrue Auth    |  PostgreSQL Database       │   │
│   │  Edge Functions |  Storage (Images)          │   │
│   └────────┬─────────────────────────────────────┘   │
│            │                                         │
│   ┌────────┴─────────┐                               │
│   │ Custom Gmail SMTP│  ← Delivers OTP securely      │
│   └──────────────────┘                               │
└──────────────────────────────────────────────────────┘
Getting Started
Prerequisites

Node.js v18 or higher

npm, yarn, or pnpm

A Supabase project with Authentication and Database enabled

Installation

Bash
# Clone the repository
git clone https://github.com/[your-username]/pesu-marketplace.git
cd pesu-marketplace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
Populate .env.local with your Supabase keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
Start the Development Server

Bash
npm run dev
The application will be available at http://localhost:3000.

Security & Authentication
Trust is the foundation of Pesu Marketplace.

Row Level Security (RLS): Database reads and writes are strictly governed by Postgres RLS policies. Users can only edit or delete their own product listings.

OTP Fallback: The custom SMTP configuration ensures that even if strict domain filtering is applied, students will receive their login credentials reliably.

Project Structure
Plaintext
pesu-marketplace/
├── public/                # Static assets and icons
├── src/
│   ├── app/               # Next.js App Router (Pages & Layouts)
│   ├── components/        # Reusable UI (ProductCards, AuthForms)
│   ├── lib/               # Utility functions and Supabase client config
│   ├── styles/            # Global CSS and Tailwind directives
│   └── types/             # TypeScript definitions for DB schemas
├── .env.local             # Local environment secrets (ignored by git)
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Theme and design system config
└── package.json
Roadmap
Phase 1 — Launch & Polish (0–3 Months)

[x] Core OTP Authentication flow

[x] Basic product listing and image upload

[ ] Advanced filtering by category (Textbooks, Electronics, etc.)

[ ] Implement "Save to Wishlist" functionality

Phase 2 — Scale & Native (3–9 Months)

[ ] Full React Native deployment to iOS App Store and Google Play

[ ] In-app chat functionality utilizing Supabase Realtime

[ ] Push notifications for new messages and saved item price drops

Phase 3 — Ecosystem (9–12 Months)

[ ] Automated textbook ISBN scanning using device cameras

[ ] Integration with university calendar for high-demand periods (e.g., end-of-semester textbook sales)

Contributing
Contributions from the PES University community are highly encouraged to make this the best tool for our campus.

Fork the repository and create a feature branch from main.

Ensure any new database tables include corresponding Row Level Security (RLS) policies.

Submit a Pull Request detailing the feature or bug fix.

License
This project is licensed under the MIT License. See the LICENSE file for full details
