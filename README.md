# Diskominfo Intern Attendance System

A comprehensive intern attendance management system with real-time tracking, geolocation verification, and face recognition capabilities. Built with modern web technologies to streamline attendance tracking for internship programs across multiple agencies and institutions.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.4.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

### Additional Technologies

- **Authentication**: Better Auth v1.4.19
- **File Uploads**: UploadThing v7.7.4
- **Internationalization**: next-intl v4.8.3
- **State Management**: React Hooks
- **Styling**: TailwindCSS with Radix UI components
- **Testing**: Playwright v1.58.2

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Key Features](#key-features)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

Make sure you have installed:
- **Node.js** version 18.x or higher
- **npm** or **pnpm** or **yarn**
- **PostgreSQL** 15+ (or use Docker Compose)
- **Docker** (optional, for running PostgreSQL via Docker Compose)
- **Cloudinary** account (for image uploads)
- **OpenAI** API key (for AI-powered grading)

### Installation Steps

1️⃣ **Clone Repository**
```bash
git clone https://github.com/kominfo/diskominfo-intern-attendance.git
cd diskominfo-intern-attendance
```

2️⃣ **Install Dependencies**
```bash
npm install
```

3️⃣ **Setup Environment Variables**

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Then edit `.env` and configure

4️⃣ **Setup Database with Docker (Optional)**

If you don't have PostgreSQL installed locally:
```bash
docker compose up -d
```

5️⃣ **Run Database Migrations**
```bash
npx prisma migrate dev
```

6️⃣ **Generate prisma client**
```bash
npx prisma generate
```

7️⃣ **Seed the Database**
```bash
npx prisma db seed
```
This creates or updates the superadmin account from the values in your `.env` file.

8️⃣ **Start Development Server**
```bash
npm run dev
```

Server will be available at: **http://localhost:3000**

## Development

### Running in Development Mode

```bash
npm run dev
```

Server will run at: **http://localhost:3000**

The application will auto-reload as you make changes.

### Database Management

View and manage your database with Prisma Studio:
```bash
npx prisma studio
```

Prisma Studio will open at: **http://localhost:5555**

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test:api` | Run API tests with Playwright |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |

### Environment-Specific Configuration

**Development (`.env`)**:
- `NODE_ENV=development`
- `BETTER_AUTH_URL=http://localhost:3000/api/auth`
- Enable detailed logging for debugging

**Production**:
- `NODE_ENV=production`
- `BETTER_AUTH_URL=https://yourdomain.com/api/auth`
- Disable development-only features

## Project Structure

```text
diskominfo-intern-attendance/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── api/
│   │   ├── agencies/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── agency-accesses/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── agency-areas/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── agency-holidays/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── agency-rules/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── agency-schedules/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts
│   │   ├── institutes/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── interns/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── users/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   └── [locale]/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── auth/
│       │   ├── layout.tsx
│       │   ├── sign-in/
│       │   │   └── page.tsx
│       │   └── sign-up/
│       │       └── page.tsx
│       ├── dashboard/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── admin/
│       │   │   ├── page.tsx
│       │   │   └── agencies/
│       │   │       ├── page.tsx
│       │   │       ├── components/
│       │   │       │   └── agency-card.tsx
│       │   │       └── [agencyId]/
│       │   │           ├── page.tsx
│       │   │           └── components/
│       │   │               ├── agency-access-editor.tsx
│       │   │               ├── area-editor.tsx
│       │   │               ├── area-map.tsx
│       │   │               ├── require-check-out-switch.tsx
│       │   │               ├── require-face-verification-switch.tsx
│       │   │               ├── require-within-area-switch.tsx
│       │   │               ├── rule-editor.tsx
│       │   │               ├── schedule-editor-holiday-dialog.tsx
│       │   │               ├── schedule-editor-holidays-tab.tsx
│       │   │               ├── schedule-editor-weekly-tab.tsx
│       │   │               └── schedule-editor.tsx
│       │   ├── intern/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   └── superadmin/
│       │       ├── page.tsx
│       │       ├── agencies/
│       │       │   └── page.tsx
│       │       ├── institutions/
│       │       │   └── page.tsx
│       │       ├── users/
│       │       │   └── page.tsx
│       │       └── components/
│       │           ├── add-agency-dialog.tsx
│       │           ├── add-institution-dialog.tsx
│       │           ├── agencies-table.tsx
│       │           ├── delete-agency-dialog.tsx
│       │           ├── delete-institution-dialog.tsx
│       │           ├── delete-user-dialog.tsx
│       │           ├── edit-agency-dialog.tsx
│       │           ├── edit-institution-dialog.tsx
│       │           ├── edit-user-dialog.tsx
│       │           ├── institutions-table.tsx
│       │           └── users-table.tsx
│       └── user/
│           └── [userId]/
│               ├── layout.tsx
│               ├── page.tsx
│               └── components/
│                   ├── intern-card.tsx
│                   ├── intern-create-dialog.tsx
│                   └── intern-edit-dialog.tsx
├── components/
│   ├── custom/
│   │   ├── custom-sidebar.tsx
│   │   ├── delete-account-button.tsx
│   │   ├── editable-number-input.tsx
│   │   ├── landing-navbar.tsx
│   │   ├── logout-button.tsx
│   │   ├── navbar-intern.tsx
│   │   ├── navbar.tsx
│   │   └── scroll-to-top-button.tsx
│   ├── reui/
│   │   ├── badge.tsx
│   │   └── data-grid/
│   │       ├── data-grid-column-filter.tsx
│   │       ├── data-grid-column-header.tsx
│   │       ├── data-grid-column-visibility.tsx
│   │       ├── data-grid-pagination.tsx
│   │       ├── data-grid-scroll-area.tsx
│   │       ├── data-grid-table-dnd-rows.tsx
│   │       ├── data-grid-table-dnd.tsx
│   │       ├── data-grid-table-virtual.tsx
│   │       ├── data-grid-table.tsx
│   │       └── data-grid.tsx
│   └── ui/
│       ├── alert-dialog.tsx
│       ├── avatar.tsx
│       ├── button-group.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input-group.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── map.tsx
│       ├── place-autocomplete.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── spinner.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── hooks/
│   ├── use-copy-to-clipboard.ts
│   └── use-mobile.ts
├── i18n/
│   ├── navigation.ts
│   ├── request.ts
│   └── routing.ts
├── lib/
│   ├── agency-holidays.ts
│   ├── auth-client.ts
│   ├── auth.ts
│   ├── dal.ts
│   ├── utils.ts
│   ├── generated/
│   │   └── prisma/
│   │       ├── browser.ts
│   │       ├── client.ts
│   │       ├── commonInputTypes.ts
│   │       ├── enums.ts
│   │       ├── models.ts
│   │       ├── internal/
│   │       │   ├── class.ts
│   │       │   ├── prismaNamespace.ts
│   │       │   └── prismaNamespaceBrowser.ts
│   │       └── models/
│   │           ├── Account.ts
│   │           ├── Agency.ts
│   │           ├── AgencyAccess.ts
│   │           ├── AgencyArea.ts
│   │           ├── AgencyHoliday.ts
│   │           ├── AgencyRule.ts
│   │           ├── AgencySchedule.ts
│   │           ├── Attendance.ts
│   │           ├── FaceDescriptor.ts
│   │           ├── Institution.ts
│   │           ├── Intern.ts
│   │           ├── Session.ts
│   │           ├── User.ts
│   │           └── Verification.ts
│   └── schemas/
│       ├── agency-access.ts
│       ├── agency-holiday.ts
│       ├── agency-rule.ts
│       ├── agency-schedule.ts
│       ├── agency.ts
│       ├── institution.ts
│       ├── intern.ts
│       └── user.ts
├── messages/
│   ├── en.json
│   └── id.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260518104529_init/
│       │   └── migration.sql
│       ├── 20260518150338_add_user_role/
│       │   └── migration.sql
│       ├── 20260520015626_update_agency_schedule/
│       │   └── migration.sql
│       └── 20260520050916_add_multiple_holiday/
│           └── migration.sql
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── intern-logo.jpeg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .env.example
├── .env.local
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Register a new user |
| POST | `/api/auth/sign-in` | Sign in with credentials |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/session` | Get current session |

### Users Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List users (paginated, searchable) | (ADMIN only intern user within their agency access), SUPERADMIN |
| POST | `/api/users` | Create new user directly on table without sign-up | SUPERADMIN |
| GET | `/api/users/[id]` | Get users details | (INTERN only self), (ADMIN only self or users in their agency), SUPERADMIN |
| PATCH | `/api/users/[id]` | Update user data | (INTERN only self and cant update role), (ADMIN only self and cant update role), SUPERADMIN |
| DELETE | `/api/users/[id]` | Delete user | (INTERN only self), (ADMIN only self), SUPERADMIN |

### Institutions Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/institutes` | List institutions (paginated, searchable) | (INTERN get id & name only), ADMIN, SUPERADMIN |
| POST | `/api/institutes` | Create new institution | SUPERADMIN |
| GET | `/api/institutes/[id]` | Get institution details | ADMIN, SUPERADMIN |
| PATCH | `/api/institutes/[id]` | Update institution | SUPERADMIN |
| DELETE | `/api/institutes/[id]` | Delete institution | SUPERADMIN |

### Agencies Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agencies` | List agencies (paginated, searchable) | (INTERN get id & name only), (ADMIN only if within agency access), SUPERADMIN |
| POST | `/api/agencies` | Create new agency | SUPERADMIN |
| GET | `/api/agencies/[id]` | Get agency details | (ADMIN only if within agency access), SUPERADMIN |
| PATCH | `/api/agencies/[id]` | Update agency | (ADMIN only if within agency access), SUPERADMIN |
| DELETE | `/api/agencies/[id]` | Delete agency | SUPERADMIN |

### Agency Accesses Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agency-accesses` | List admins assigned to agencies (paginated, searchable) | (ADMIN only their agency), SUPERADMIN |
| POST | `/api/agency-accesses` | Assign an admin to an agency | SUPERADMIN |
| GET | `/api/agency-accesses/[id]` | Get specific access record | (ADMIN only their agency), SUPERADMIN |
| DELETE | `/api/agency-accesses/[id]` | Revoke agency access | SUPERADMIN |

### Agency Schedules Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agency-schedules` | List schedules (paginated, searchable) | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| POST | `/api/agency-schedules` | Create a new time slot | (ADMIN only their agency), SUPERADMIN |
| GET | `/api/agency-schedules/[id]` | Get specific schedule | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| PATCH | `/api/agency-schedules/[id]` | Update schedule | (ADMIN only their agency), SUPERADMIN |
| DELETE | `/api/agency-schedules/[id]` | Delete a schedule slot | (ADMIN only their agency), SUPERADMIN |

### Agency Holidays Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agency-holidays` | List holidays (paginated, searchable) | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| POST | `/api/agency-holidays` | Create holiday | (ADMIN only their agency), SUPERADMIN |
| GET | `/api/agency-holidays/[id]` | Get specific holiday | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| PATCH | `/api/agency-holidays/[id]` | Update holiday | (ADMIN only their agency), SUPERADMIN |
| DELETE | `/api/agency-holidays/[id]` | Delete holiday | (ADMIN only their agency), SUPERADMIN |

### Agency Area Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agency-areas/[agencyId]` | Get the single geofence area for an agency | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| POST | `/api/agency-areas/[agencyId]` | Create geofence boundary for the agency | (ADMIN only their agency), SUPERADMIN |
| PATCH | `/api/agency-areas/[agencyId]` | Update area/GeoJSON for the agency | (ADMIN only their agency), SUPERADMIN |
| DELETE | `/api/agency-areas/[agencyId]` | Delete boundary for the agency | (ADMIN only their agency), SUPERADMIN |

### Agency Rules Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/agency-rules/[agencyId]` | Get the attendance rules for an agency | (INTERN only their agency), (ADMIN only their agency), SUPERADMIN |
| POST | `/api/agency-rules/[agencyId]` | Create agency rules for the agency | (ADMIN only their agency), SUPERADMIN |
| PATCH | `/api/agency-rules/[agencyId]` | Update rules/tolerance for the agency | (ADMIN only their agency), SUPERADMIN |
| DELETE | `/api/agency-rules/[agencyId]` | Delete rules for the agency | (ADMIN only their agency), SUPERADMIN |

### Interns Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/interns` | List interns (paginated, searchable) | (INTERN only if same agencies or institues), (ADMIN only intern in their agency access), SUPERADMIN |
| POST | `/api/interns` | Create new intern | INTERN, (ADMIN only intern in their agency access), SUPERADMIN |
| GET | `/api/interns/[id]` | Get intern details | (INTERN only if same agencies or institues), (ADMIN only intern in their agency access), SUPERADMIN |
| PATCH | `/api/interns/[id]` | Update intern | (INTERN only self), (ADMIN only intern in their agency access), SUPERADMIN |
| DELETE | `/api/interns/[id]` | Delete intern | (INTERN only self), (ADMIN only intern in their agency access), SUPERADMIN |

### Face Descriptor Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/face-descriptors` | List of face descriptors (paginated) | (INTERN only self), (ADMIN only users in their agency), SUPERADMIN |
| POST | `/api/face-descriptors` | Register a new face descriptor | (INTERN only self), (ADMIN only users in their agency), SUPERADMIN |
| GET | `/api/face-descriptors/[id]` | Get specific descriptor details | (INTERN only self), (ADMIN only users in their agency), SUPERADMIN |
| DELETE | `/api/face-descriptors/[id]` | Delete a face descriptor | (INTERN only self), (ADMIN only users in their agency), SUPERADMIN |

### Attendance Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/attendances` | List attendance records (paginated) | (INTERN only their own attendance), (ADMIN only attendance in their agency access), SUPERADMIN |
| POST | `/api/attendances` | Create new attendance record | (INTERN if agency rules, agency holiday and schedule are met, if status is sick or excused bypass agency rules), (ADMIN only attendance in their agency access), SUPERADMIN |
| GET | `/api/attendances/[id]` | Get attendance details | (INTERN only their own attendance), (ADMIN only attendance in their agency access), SUPERADMIN |
| PATCH | `/api/attendances/[id]` | Update attendance | (ADMIN only attendance in their agency access), SUPERADMIN |
| DELETE | `/api/attendances/[id]` | Delete attendance | (ADMIN only attendance in their agency access), SUPERADMIN |


## Key Features

- **Real-time Attendance Tracking**: Check-in and check-out system with timestamp recording
- **Geolocation Verification**: Verify attendance within designated agency areas using GPS coordinates
- **Face Recognition**: Optional face verification using face-api.js for enhanced security
- **Multi-Agency Management**: Support for multiple agencies with independent schedules and rules
- **Flexible Work Schedules**: Configure different work schedules per day of week per agency
- **Attendance Rules**: Customizable attendance policies including late tolerance and verification requirements
- **Institution Integration**: Support for multiple educational institutions
- **Multi-language Support**: Built-in internationalization (English & Indonesian)
- **Responsive Design**: Mobile-friendly interface for on-the-go attendance tracking


## Configuration

### Environment Variables

See `.env.example` for the complete configuration template. Below are the key environment variables:

| Variable | Description | Example |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_NAME` | Application display name | `"Diskominfo Attendance"` |
| `NODE_ENV` | Environment mode | `"development"` or `"production"` |
| `DATABASE_URL` | PostgreSQL database connection string (supports Neon) | `postgresql://user:pass@host:5432/db?schema=public` |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth authentication | Auto-generated or custom string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image storage | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From Cloudinary dashboard |

### TypeScript Configuration

The project uses strict TypeScript with explicit type declarations. Key configurations in `tsconfig.json`:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX: React Server Components compatible
- Path aliases configured for cleaner imports

### Database Configuration

Prisma is configured with:
- Provider: PostgreSQL
- Client output: `./lib/generated/prisma`
- Adapter: Native PostgreSQL driver via `@prisma/adapter-pg`
- Preview features: Interactive transactions, client extensions

## Testing

### Running API Tests

```bash
npm run test:api
```

### Running E2E Tests

```bash
npm run test:e2e
```

Run tests with UI for better debugging:
```bash
npm run test:e2e:ui
```

Test files are located in `/tests` directory and cover:
- Authentication flows (sign up, sign in)
- Intern and agency management
- Attendance check-in/check-out
- Geolocation verification
- Face recognition workflows
- Multi-language UI interactions

### Writing Tests

Use Playwright for E2E testing. Example test:
```typescript
import { test, expect } from '@playwright/test';

test('intern can check in', async ({ page }) => {
  await page.goto('/en/dashboard');
  await page.click('button:has-text("Check In")');
  await expect(page).toHaveURL(/attendance/);
});
```

## Deployment

### Build for Production

```bash
npm run build
```

This command will automatically:
1. Deploy pending Prisma migrations
2. Generate Prisma Client
3. Build the Next.js application for production

### Start Production Server

```bash
npm start
```

Server will run in production mode at: **http://localhost:3000**

### Deploy to Cloud Platforms

Recommended platforms for deployment:
- **Vercel** (Native Next.js support, recommended)
- **Railway**
- **Render**
- **AWS App Runner**
- **Azure App Service**
- **DigitalOcean App Platform**

**Important:** Make sure all environment variables are set on your deployment platform before deploying.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Playwright Testing](https://playwright.dev)
- [next-intl (i18n)](https://next-intl.dev/docs)
- [face-api.js (Face Recognition)](https://github.com/justadudewhohacks/face-api.js)
- [Leaflet (Geolocation/Maps)](https://leafletjs.com)

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## Support

For issues, questions, or feedback, please open an issue in the repository or contact the development team.

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
