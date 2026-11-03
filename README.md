# Tandem • Life's better in sync.

> A warm, collaborative shared group workspace designed for couples, families, roommates, and small teams. Tandem combines long-horizon lead-time planning, contextual micro-notes, and a proactive action-needed radar to keep shared goals moving forward without falling through the cracks.

---

## ✨ Overview

Most to-do lists only tell you when a task is due, leaving you scrambling when a complex task requires advance preparation. **Tandem** solves this by introducing **lead-time planning**: calculating not just the final deadline, but the exact preparation window required to get started (whether days, weeks, months, or years in advance).

Coupled with customizable shared groups, social micro-notes with `@mentions`, multi-channel push and email notifications, and an **Action-Needed Radar**, Tandem keeps everyone in sync effortlessly.

---

## 🚀 Key Features

### 👥 Collaborative Shared Groups
- **Group Workspaces**: Create dedicated spaces for household chores, travel planning, couples' goals, sports teams, clubs, or roommates.
- **Custom Theming**: Pick from curated pastel themes (*Lilac Purple*, *Warm Coral*, *Soft Sky*, *Mint Emerald*, *Blush Rose*, *Honey Gold*, etc.) and custom iconography.
- **Dynamic Styling**: The application dynamically adapts its accent theme and styling to match the active group or your personal profile color.
- **Member Management**: Invite friends, designate roles (**Owner** vs. **Member**), transfer ownership, or manage permissions.

### ⏳ Long-Horizon Planning & Smart Lead Times
- **Preparation Windows**: Assign a deadline along with a lead time (e.g., 5 days, 3 weeks, 2 months, 1 year). Tandem automatically calculates your preparation start date.
- **Natural Time Units**: Define lead times using natural units (days, weeks, months, years) without manual day-counting.
- **Countdown Badges**: See at a glance whether you are ahead of time, within your prep window, or overdue.

### 🎯 Action-Needed Radar
- **Proactive Dashboard Alert**: Automatically surfaces tasks that have entered their active preparation window or are within 14 days of their deadline without recent activity.
- **Zero Stalled Tasks**: Prevents important obligations (such as passport renewals, doctor checkups, or venue deposits) from being overlooked.

### 🏷️ Domain-Specific Task Categories
- **Smart Presets & Tips**: Select from purpose-built categories with tailored reminders and one-click lead-time presets:
  - 🛍️ **Shopping & Gifts**: Shipping buffers, order processing, and return windows.
  - ✈️ **Travel & Trips**: 6-month passport validity checks, booking windows, packing buffers.
  - 📄 **Documents & Admin**: Notarization, gov processing delays, and appointment wait times.
  - 🩺 **Health & Appointments**: Specialist waitlists, prescription refill buffers, and fasting prep.
  - 🎉 **Events & Celebrations**: Venue deposits, catering headcounts, and RSVP cutoffs.
  - ⚽ **Team & Sports**: Registration deadlines, uniform deliveries, and roster locks.
  - 🏡 **Home & Repairs**: Contractor scheduling, parts ordering, and seasonal maintenance.

### 📊 Multiple Workflow Views
- **Wall View (Cards)**: High-context visual cards showing category pills, countdown badges, assignee avatars, and the latest discussion snippet.
- **List View**: Dense, table-style layout optimized for quick scanning, bulk review, and swift completion toggling.
- **Calendar View**: Visual month calendar showing task deadlines, prep windows, and scheduling over time.

### 💬 Contextual Micro-Notes & @Mentions
- **Task Threads**: Keep conversation, updates, and tracking links attached directly to each task.
- **@Mentions**: Tag collaborators (e.g., `@alex`) to trigger instant alerts.
- **Smart Filtering**: Filter tasks by "Tagged with me" or by specific team members.

### 🤝 Friends & Privacy Controls
- **Social Graph**: Discover friends by username or display name, and send/accept connection requests.
- **Privacy Settings**: Choose between Public and Private profiles (private accounts require an accepted friendship before being invited to shared groups).

### 🔔 Multi-Channel Notifications
- **Web Push (W3C / VAPID)**: Native browser and mobile push notifications requiring zero third-party app installations.
- **Email Delivery (Resend API)**: Automated, branded email notifications with fallback to simulated dev mode.
- **Granular Triggers**: Customize notifications for mentions, prep window start, upcoming due dates, task completion, and group invites.
- **Quiet Hours**: Schedule quiet windows to pause notifications during evenings or sleep.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions & Route Handlers)
- **UI & Components**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Typography**: [Lato](https://fonts.google.com/specimen/Lato) (UI font) & [Grand Hotel](https://fonts.google.com/specimen/Grand+Hotel) (Brand display font) via `next/font`
- **Database**: Serverless PostgreSQL via [Neon](https://neon.tech/) (`@neondatabase/serverless`)
- **Authentication**: Custom session-based authentication with secure HTTP-only cookies and `bcryptjs` password hashing
- **Notifications**:
  - Web Push via [`web-push`](https://github.com/web-push-libs/web-push) with VAPID keys
  - Email delivery via [Resend REST API](https://resend.com/)

---

## 📁 Project Structure

```text
shared-todo-list/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Login, register, logout, session verification
│   │   │   ├── friends/         # Friend requests and social directory
│   │   │   ├── notifications/   # Settings, test triggers, push subscriptions & logs
│   │   │   ├── spaces/          # Group CRUD, members, ownership transfer
│   │   │   ├── tasks/           # Task CRUD, notes, lead times, status updates
│   │   │   └── users/           # User search and discovery
│   │   ├── globals.css          # Design system root variables and custom styles
│   │   ├── layout.tsx           # Root layout with Lato & Grand Hotel font injection
│   │   └── page.tsx             # Main application orchestrator & view controller
│   ├── components/
│   │   ├── AuthModal.tsx        # Sign-in & sign-up modal
│   │   ├── CalendarView.tsx     # Month-based interactive calendar view
│   │   ├── CreateSpaceModal.tsx # Group creation dialog with color/icon picker
│   │   ├── CreateTaskModal.tsx  # Task creation with category & lead-time presets
│   │   ├── FriendsModal.tsx     # Friends list, requests, and search
│   │   ├── GroupSettingsModal.tsx # Group renaming, color palette, member management
│   │   ├── Header.tsx           # Global header with search, notifications, & user menu
│   │   ├── ListView.tsx         # Dense table list view
│   │   ├── NotificationDropdown.tsx # In-app notification center & logs
│   │   ├── NotificationSettingsTab.tsx # Push/Email settings, quiet hours
│   │   ├── Sidebar.tsx          # Desktop sidebar navigation with groups & filters
│   │   ├── TaskCard.tsx         # Wall view task card with interactive badges
│   │   ├── TaskDetailModal.tsx  # Detailed task modal with notes & mentions
│   │   ├── UntouchedRadar.tsx   # Action-needed radar widget
│   │   ├── UserSettingsModal.tsx# Profile, color selection, security, & alerts
│   │   └── WelcomeView.tsx      # Landing page for unauthenticated visitors
│   ├── lib/
│   │   ├── auth.ts              # Password hashing & cookie session helpers
│   │   ├── categories.ts        # Category definitions, reminder prompts & presets
│   │   ├── colors.ts            # Avatar & group color tokens, status calculations
│   │   ├── db.ts                # Neon database client connection
│   │   ├── delivery.ts          # Resend email & Web Push delivery engine
│   │   ├── notifications.ts     # Dispatcher logic & preference checking
│   │   └── time.ts              # Lead-time calculation and unit converters
│   └── types/
│       └── index.ts             # TypeScript interfaces for users, tasks, groups, etc.
├── scripts/
│   ├── init-db.mjs              # Full database table creation and demo seeding
│   ├── migrate.mjs              # Standard database migration runner
│   └── verify-*.mjs             # E2E validation scripts for auth, spaces, and alerts
├── DESIGN.md                    # Core design system tokens and component rules
└── package.json
```

---

## 🚦 Getting Started

### 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Database**: A PostgreSQL instance (such as a free [Neon](https://neon.tech) serverless database)

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/shared-todo-list.git
cd shared-todo-list
npm install
```

### 3. Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# Email Delivery via Resend (Optional - simulated mode used if omitted)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="Tandem <notifications@yourdomain.com>"

# Web Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

> **Tip:** You can generate a fresh set of VAPID keys for Web Push by running:
> ```bash
> npx web-push generate-vapid-keys
> ```

### 4. Database Setup & Migrations

Initialize the schema and seed the database:

```bash
npm run db:migrate
# or run the initial database setup script:
node scripts/init-db.mjs
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Design Philosophy

Tandem is built following a strict design system documented in [`DESIGN.md`](./DESIGN.md):
- **Warm & Tactile**: Uses soft canvas backgrounds (`#F4F3F5`) with crisp, high-contrast dark ink typography (`#171923`) instead of cold monochrome greys or neon gradients.
- **Harmonious Accents**: Subtle chromatic pastel accents (`Lilac Purple`, `Warm Coral`, `Mint Emerald`, `Soft Sky`) clearly communicate urgency, category, and space identity.
- **Friendly Geometry**: Consistent 4px modular spacing scale, smooth border radii (`12px` to `24px`), and pill-shaped badges.

---

## 🧪 Testing & Verification

The project includes test scripts for verifying database models, authentication, groups, and notification delivery:

```bash
# Verify end-to-end user auth flow
node scripts/verify-auth.mjs

# Verify groups and friendships
node scripts/verify-friends-and-spaces.mjs

# Verify notifications dispatch and delivery
node scripts/verify-notifications.mjs

# Verify full E2E flow
node scripts/verify-e2e.mjs
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
