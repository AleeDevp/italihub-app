<div align="center">

# 🇮🇹 ItaliHub

### The community hub for Iranians living in Italy

_Housing · Transportation · Currency Exchange · Marketplace · Services_

**🚧 This project is currently under development.**

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)

</div>

---

## What is ItaliHub?

Many Iranians live in Italy — students, families, workers, and newcomers. They all share common everyday needs: finding a place to stay, sending items between Iran and Italy, exchanging currency, buying second-hand goods, and finding personal services.

Right now, these needs are scattered across informal channels with no structure, no trust signals, and no easy way to search.

**ItaliHub** brings all of this into one organized, searchable platform — connecting the Iranian community in Italy in a clean, simple, and trustworthy way.

---

## ✨ Core Categories

| Category                 | Description                                         |
| ------------------------ | --------------------------------------------------- |
| 🏠 **Housing**           | Rentals, sublets, and room shares across Italy      |
| ✈️ **Transportation**    | Send or carry items between Iran and Italy          |
| 💱 **Currency Exchange** | Trusted peer-to-peer exchange (verified users only) |
| 🛍️ **Marketplace**       | Buy and sell second-hand goods                      |
| 🧰 **Services**          | Personal services from the community                |

---

## 👥 Who Can Use It?

ItaliHub is open to everyone — no sign-in needed to browse.

```
Visitor  →  Browse & search all ads, view contact info
   ↓
Registered  →  Complete your profile to unlock posting
   ↓
Profile Complete  →  Post ads, access your dashboard
   ↓
Verified  →  Verified badge + access to Currency Exchange ads
```

**Profile completion requires:**

1. First name, last name, and a unique username
2. Telegram handle (used as the contact method)
3. City of residence in Italy
4. Profile picture _(optional)_

---

## 🔍 How It Works

**Browsing is free and open.**
Anyone can search, filter by city, sort by price or date, and view ad details — including the poster's Telegram handle.

**Posting requires a completed profile.**
Once your profile is set up, you can post ads in any category. Each new ad goes through a quick moderation review before going live.

**Contact is simple.**
Each ad shows the poster's Telegram handle. One tap and you're talking directly — no middleman, no inbox.

---

## 🧩 Key Features

### 📋 Ads & Lifecycle

- Per-category forms with fields tailored to each type of ad
- All new ads start as **Pending** and are reviewed before publishing
- Edits and renewals also return an ad to Pending
- **Housing** and **Transportation** ads expire automatically based on dates
- **Marketplace**, **Services**, and **Currency Exchange** ads have no expiration

### 📊 Personal Dashboard

After completing your profile, you get access to a full personal dashboard:

| Tab                     | What you can do                                   |
| ----------------------- | ------------------------------------------------- |
| **Overview**            | See a snapshot of your ads and their stats        |
| **Ads Management**      | View, edit, renew, or delete your listings        |
| **Profile**             | Update your name, Telegram, city, and picture     |
| **Verification**        | Submit proof of residence for a Verified badge    |
| **Notifications**       | Get updates on ad approvals, rejections, and more |
| **Security & Settings** | Manage your email, password, connected accounts   |
| **Support & Help**      | FAQs and a contact form for the moderation team   |

### 🔒 Verification System

Users can apply for a **Verified** badge by submitting proof of residence (student card, rental contract, ID, etc.). Verified users gain access to Currency Exchange listings and display a trust badge on their profile.

> Changing your city of residence will revoke your verification — re-verification is required.

### 🛡️ Moderation & Reporting

- Every ad is reviewed by moderators before it goes live
- Users can report ads for scam, wrong category, offensive content, or duplicates
- Moderators also review verification requests and handle reported content

---

## 🛠️ Tech Stack

| Layer                  | Technology                                    |
| ---------------------- | --------------------------------------------- |
| **Framework**          | [Next.js 15](https://nextjs.org) (App Router) |
| **Language**           | TypeScript                                    |
| **Styling**            | Tailwind CSS v4 + shadcn/ui                   |
| **Database ORM**       | Prisma                                        |
| **Authentication**     | Better Auth (Email, Google, Facebook)         |
| **Data Fetching**      | TanStack Query v5                             |
| **Forms & Validation** | React Hook Form + Zod                         |
| **Image Storage**      | Cloudinary                                    |
| **Email**              | Resend + React Email                          |
| **Animations**         | Framer Motion                                 |
| **Maps**               | Leaflet / React Leaflet                       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database
- Cloudinary account (for image uploads)
- Resend account (for emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/italihub-app.git
cd italihub-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your database URL, auth secrets, Cloudinary keys, etc.

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
│   ├── (main)/       # Public-facing pages
│   ├── (auth)/       # Authentication pages
│   └── api/          # API routes
├── components/       # Shared UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities, auth config, helpers
├── types/            # TypeScript types
└── config/           # App-wide configuration
prisma/
└── schema.prisma     # Database schema
```

---

## 📄 License

This project is private and not open for public contribution at this time.

---

<div align="center">

Built with ❤️ for the Iranian community in Italy

</div>
