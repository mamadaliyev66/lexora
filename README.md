# Lexora Legal Academy

Lexora is a production-style React frontend for legal education and source-transparent research. It combines a student dashboard, structured course reading, a legal-document library, cross-catalog search, assessments, bookmarks, collections, progress analytics, case-based learning, a legal dictionary, an authoritative source directory, and a complete local administration workspace.

The repository intentionally contains **no example students, courses, laws, cases, terms, quiz questions, notifications, progress, bookmarks, or collections**. Legal content JSON files are empty. The source directory contains only real external database metadata and links.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
npm run preview
```

The generated static site is written to `dist/`. `public/_redirects` preserves React Router routes on compatible static hosts.

## Features

- Responsive landing page, application shell, desktop sidebar, mobile drawer and mobile bottom navigation
- Local demo registration, sign-in, sign-out, onboarding, recovery and verification integration screens
- Dashboard with data-derived progress, study activity, recent views and quick actions
- Course catalog filters, expandable curriculum, lesson navigation, rich lesson blocks and completion state
- Legal-library search and filters, source/status labels, original-source links and long-form document reading
- Search across courses, lessons, legal documents, cases, terms and quizzes, plus `Ctrl/Cmd + K` command search
- Multiple-choice, true/false and scenario assessment runner with explanations, score history and retry
- Persistent bookmarks, personal collections, recent views, course progress, quiz history and preferences
- Case-law learning with explicit sourced/hypothetical classification
- Legal dictionary with alphabetical navigation and expandable academic definitions
- International-law navigation and a curated directory of authoritative/research sources
- Student profile, progress analytics, notifications, theme settings and catalog import/export
- Role-gated administration center with operational metrics, account roles and suspension, per-user learning totals, activity feed, catalog CRUD, JSON import, automated source/structure checks, audit history and password-free backups
- Light, dark and system themes, keyboard focus states, semantic structure and reduced-motion support
- Friendly loading, error, no-result, empty and missing-record states
- Lazy-loaded route groups and a minimal dependency footprint

## Architecture

```text
src/
  components/       Shared interface, navigation and protected-route components
  context/          Authentication, theme and personal-data providers
  data/             Empty legal-content JSON plus the external source directory
  hooks/            Reusable browser-storage hook
  i18n/             Locale boundary for future translation catalogs
  pages/            Public, dashboard, learning, research, assessment, student and administration routes
  services/         Auth, catalog, search, progress, bookmarks and storage abstractions
  styles/           Design system and responsive application CSS
db/
  schema.sql        Future PostgreSQL-compatible backend schema concept
```

Pages consume data through services and context rather than importing a database implementation. The current catalog service merges empty build-time JSON arrays with an optional browser-imported dataset. It can later be replaced with REST, GraphQL, Supabase, Firebase, PostgreSQL or another backend without redesigning page components.

## Data import

Open **Settings → Legal data catalog → Import JSON**. The top-level object accepts these arrays:

```json
{
  "courses": [],
  "legalDocuments": [],
  "cases": [],
  "dictionary": [],
  "quizzes": []
}
```

Every record must have a unique string `id`. Unknown fields are preserved.

### Course fields

`id`, `title`, `category`, `description`, `difficulty`, `duration`, `language`, `author`, `updatedAt`, `objectives[]`, `relatedSources[]`, and `modules[]`. A module uses `id`, `title`, and `lessons[]`. A lesson uses `id`, `title`, `duration`, and `content[]`.

Lesson content blocks support:

- paragraph: `{ "type": "paragraph", "text": "…" }`
- heading: `{ "type": "heading", "id": "…", "text": "…" }`
- note: `{ "type": "note", "label": "…", "text": "…" }`
- definition: `{ "type": "definition", "term": "…", "text": "…" }`
- quote: `{ "type": "quote", "text": "…", "citation": "…" }`
- list: `{ "type": "list", "items": [] }`
- table: `{ "type": "table", "headers": [], "rows": [] }`

### Legal-document fields

`id`, `title`, `documentType`, `documentNumber`, `jurisdiction`, `category`, `source`, `status`, `publicationDate`, `adoptionDate`, `updatedAt`, `lastChecked`, `language`, `summary`, `citation`, `originalUrl`, and `sections[]`. Each section has `id`, `title`, and `articles[]`; an article has `id`, `number`, `title`, and `body`.

### Case fields

`id`, `title`, `court`, `date`, `legalArea`, `classification`, `source`, `originalUrl`, `summary`, `facts`, `legalIssue`, `arguments`, `decision`, `reasoning`, `takeaway`, and `outcome`. `classification` must be either `sourced` or `hypothetical`. Never present an invented decision as sourced.

### Dictionary fields

`id`, `term`, `simpleDefinition`, `legalDefinition`, `example`, and `relatedTerms[]`.

### Quiz fields

`id`, `title`, `description`, `category`, `duration`, and `questions[]`. Each question uses `id`, `type`, `prompt`, optional `scenario`, `options[]`, `correctAnswer`, `explanation`, and optional `reference` with `label` and `url`.

The importer validates only the top-level array shape so editorial pipelines can add fields without a frontend migration. A production ingestion service should apply strict schemas, provenance checks, review status, sanitization and audit logging.

## Authentication and security

`authService.js` is a deliberately isolated frontend demonstration layer. Accounts and plaintext demo passwords are stored in `localStorage`; this is **not secure production authentication**. Password recovery, email verification, multi-device sessions and authorization require a backend identity provider.

For production:

- hash passwords server-side or delegate identity to a trusted provider;
- issue secure, short-lived sessions in protected cookies;
- enforce authorization on every API operation;
- validate and sanitize imported content server-side;
- keep database credentials, private keys and service tokens out of the React bundle;
- add audit logs, rate limits, backup/restore and retention controls.

## Administration

The first account registered in a new browser installation becomes its administrator. Existing installations are migrated by promoting the earliest local account when no administrator role exists. Later registrations are student accounts by default. Administrators can open `/admin` directly or use **Admin control center** in the student sidebar.

The administration workspace includes:

- an overview of local accounts, catalog distribution, completed lessons, quiz attempts and editorial health;
- account creation, role assignment, suspension and deletion, with protections for the current and final administrator;
- create, edit and delete controls for courses, legal documents, cases, dictionary terms and quizzes;
- whole-catalog JSON import plus catalog-only and full local exports;
- automatic checks for missing learning structure, classifications, source authorities, original URLs, legal status and verification dates;
- account-level learning totals and a chronological view/assessment activity feed;
- a 500-event local administration audit history.

The panel monitors only accounts and activity stored by this browser installation. Roles and route protection are client-side convenience controls, not a server security boundary. Full backups exclude passwords, but they can contain personal learning data and should be handled accordingly.

## Progress and personal data

The browser stores completed lessons, started courses, study sessions, quiz attempts, bookmarks, collections, recent views, notifications, profile details and preferences per account under namespaced `lexora.*` keys. Derived student and administration statistics are calculated from those records; no decorative or fake metrics are generated.

Settings can clear imported catalog data separately from personal study data. Production synchronization should move these records behind authenticated service endpoints.

## Legal content and sourcing

The platform is educational and does not provide legal advice. Every externally sourced legal-document record should include its publisher/source, jurisdiction, original URL, last-checked date and known status. Platform explanations should remain distinguishable from original legislation. Use citations, metadata, summaries and official links where reproduction rights are unclear.

The built-in source directory links to official or established databases such as LEX.UZ, Regulation.gov.uz, SUD.UZ, EUR-Lex, the UN Treaty Collection, ICJ, HUDOC, WIPO Lex and NATLEX. Availability and content remain under each external publisher’s control.

## Backend migration

`db/schema.sql` defines users, profiles, courses, modules, lessons, legal documents, categories, sources, court cases, quizzes, questions, progress, quiz attempts, study sessions, bookmarks, favorites, recent views, collections, collection items and notifications, with keys, relationships, timestamps and status fields.

Replace service implementations one at a time:

1. Move authentication to a secure identity endpoint.
2. Replace `legalDataService` with reviewed catalog APIs.
3. Replace progress, bookmark and collection actions with user-scoped endpoints.
4. Add server-side search and content provenance.
5. Connect update notifications only after a reliable source-monitoring workflow exists.

## Deployment

The application is a static Vite SPA. Any host must serve `dist/index.html` for unknown paths so React Router can resolve client routes. Do not expose secrets through `VITE_*` variables; Vite embeds them in public JavaScript.
