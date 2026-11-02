# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are families, teams, partners, roommates, and close circles (e.g., "Miller Family", "CB Soccer Team", household roommates) managing shared logistics, team events, trip planning, recurring admin, and long-horizon goals (such as passport renewals, tournament registrations, or upcoming events months/years away).

## Product Purpose

Tandem transforms shared to-do lists from rigid corporate spreadsheets into an approachable, ambient, social-style task wall. It ensures long-term tasks and multi-week projects are not forgotten until the day before they are due, by proactively calculating when work must begin and alerting group members when items remain untouched.

## Positioning

Unlike conventional project management tools (Asana, Jira, Linear) that cater to workplace sprints, or standard checklist apps (Apple Reminders, Google Keep) that lack collaborative conversational context and lead-time estimation, Tandem blends:
1. **The Casual Social Wall**: Shared group feeds with rich expandable cards, inline notes, and `@mentions`.
2. **Proactive Lead-Time Engine**: Dynamic reminder thresholds based on effort duration ($\text{Reminder} = \text{Deadline} - \text{Lead Time}$).
3. **Untouched Radar**: Ambient highlighting of tasks whose start window is ticking down without recorded activity.

## Operating Context

- Used in shared living spaces, teams, and social circles, on mobile web and desktop browsers, often checked casually during morning routines or team planning sessions.
- Multi-group organization (e.g. Miller Family, CB Soccer Team, Home & Errands, Book Club).
- Low friction, open visibility: any member in a group can view, post, expand, and comment on tasks.

## Capabilities and Constraints

- **Multi-Group Architecture**: Color-coded isolated or aggregated groups.
- **Task Categorization & Lead-Time Reminders**: Domain-aware categorization (Shopping & Gifts, Travel & Trips, Documents & Admin, Health & Care, Events & Celebrations, Team & Sports, Home & Maintenance, Finances) with contextual reminder prompts (e.g. shipping time, processing cutoffs, expiration dates) and one-click checklist injection.
- **Task Wall Feed**: Chronological and priority card feed with inline quick-add bar.
- **Expandable Task Detail**: Slide-out modal containing full context, checklists, timeline slider, and comment feed.
- **Smart Lead-Time & Reminders**: User sets estimated time needed with flexible duration units (days, weeks, months, years); the system proactively calculates when work must begin ($\text{Reminder} = \text{Deadline} - \text{Lead Time}$).
- **Untouched & Coming Up Radar**: Surfaces upcoming tasks with active reminder windows that are still in `todo` status or have stale activity.
- **Lightweight Social Notes & @Mentions**: Contextual notes with author attribution and `@mentions` (`@alex`, `@partner`).
- **Multi-View Modes**: Social Wall Feed, List Dashboard, and Monthly Calendar View.
- **Technical Stack**: Next.js 16 (App Router, Turbopack), Tailwind CSS v4, Neon Serverless Postgres (`@neondatabase/serverless`).

## Brand Commitments

- **Name**: Tandem.
- **Tagline**: Life's better in sync.
- **Aesthetic**: Colorful minimalist. Pastel color accents per group (Lavender for family, Peach/Orange for sports/activities, Sky Azure for travel, Emerald for finance) on a clean, high-contrast, distraction-free neutral canvas.
- **Tone**: Warm, encouraging, calm, collaborative, and clutter-free.

## Evidence on Hand

- Fully functional Next.js 16 web application running with Neon Serverless Postgres.
- Seeded test cases: "Renew passport for upcoming travels (Aug 2028, 42d lead time)", "Get Mom birthday gift (July 2027, 14d lead time)", "Annual vehicle inspection (urgent upcoming)".
- End-to-end verified API routes for spaces/groups, tasks, and task notes.

## Product Principles

1. **Ambient, Not Alarming**: Surface upcoming priorities proactively through calm color cues and lead-time windows rather than stressful notification spam.
2. **Context Lives with the Task**: Keep notes, links, and discussions directly inside the expandable task card so partners never lose track of decisions.
3. **Zero Friction Collaboration**: Everything is visible and editable across the group; no complex role hierarchies or approval workflows.
4. **Colorful Clarity**: Use color strictly to distinguish groups, urgency, and active work states—never gratuitous decoration.

