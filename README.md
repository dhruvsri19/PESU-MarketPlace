PESU Marketplace
A high-performance, student-only commerce platform designed specifically for the PES University community. PESU Marketplace provides a secure and intuitive environment for students to buy, sell, and trade essentials—ranging from academic resources and electronics to campus lifestyle gear.

🚀 Key Features
Student-Centric Security: Implements a robust Email OTP authentication system via Supabase and Gmail SMTP to ensure platform access is restricted to verified students.

Modern UX/UI: A sleek, responsive interface built with a "Liquid Glass" design aesthetic, optimized for a seamless experience on both desktop and mobile devices.

Real-Time Data: Leverages Supabase for live database updates and instant listing management.

Direct P2P Trading: Facilitates direct student-to-student transactions, eliminating intermediaries and simplifying campus trade.

🛠️ Tech Stack
Frontend: Next.js, React Native

Backend & Database: Supabase

Authentication: Supabase Auth with Gmail SMTP Relay

Deployment: Vercel

📦 Installation & Setup
Clone the repository:

Bash
git clone https://github.com/your-username/pesu-marketplace.git
Install dependencies:

Bash
npm install
Environment Variables: Create a .env.local file and add your Supabase credentials:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
Run the development server:

Bash
npm run dev
🛡️ Security Note
This project uses Custom SMTP settings to deliver OTPs directly from a dedicated university-specific Gmail account (pesumarketplace@gmail.com) to maintain high trust and deliverability within the student body.
