# MockX — Enterprise Mock Exam & Assessment Platform

Welcome to the **MockX** developer portal. MockX is a high-performance, secure, and highly scalable mock testing and examination software platform. Designed with advanced analytics, interactive AI-powered coaching (RAG/Gemini), real-time leaderboards, automated evaluation, and secure payment processing, MockX offers a complete, turn-key solution for competitive examinations (including specialized frameworks like the IMU-CET).

---

## 1. Project Description

MockX is built as a decoupled, multi-tier application comprising a robust **Express/Node.js REST API backend** and a responsive **Modern Web frontend**. 

### Core Features

*   **Adaptive Testing Engine**: Dynamically loads exams, records interactive test attempts, monitors elapsed durations, manages attempt states, and enforces testing constraints (e.g., limits, timeouts).
*   **AI-Enhanced Insights**: Features built-in integration with Google Gemini and RAG (Retrieval-Augmented Generation) chat systems, utilizing an on-demand knowledge base (`imucetKnowledge.base.js`) to provide candidates with deep conceptual feedback.
*   **Configurable Payments Ecosystem**: Built with modular payment gateways, dynamic toggle capabilities (`paymentToggle.js`), and manual management guides to scale monetization paths effortlessly.
*   **Result Normalization & Analytics Engine**: Converts raw answers into analytical reports, grades responses, flags performance bottlenecks, and pushes scores directly to real-time Leaderboards.
*   **Seeding & Migration Utilities**: Comprehensive tooling to populate test items, subjects, and complete mock configurations via structured configuration frameworks.

---

## 2. Codebase Directory Architecture

Below is an overview of the structural layout of the MockX repository. It highlights the logical separation between the server business logic, web clients, database schemas, and external helper utilities.

```directory
MockX/
├── backend/                             # Express REST API Server
│   ├── src/
│   │   ├── config/                      # Database, token, and exam configurations
│   │   │   ├── db.js                    # Database driver entrypoint (MongoDB)
│   │   │   ├── examConfig.js            # Global rules and limits for exam templates
│   │   │   └── token.js                 # JWT secret & expiry configurations
│   │   ├── controllers/                 # Express Request/Response orchestrators
│   │   │   ├── ai.controller.js         # Handles AI-assisted analysis and query inputs
│   │   │   ├── attempt.controller.js    # Registers test session initializations/updates
│   │   │   ├── auth.controller.js       # Admin & Student authentication lifecycles
│   │   │   ├── leaderboard.controller.js# Computes and displays absolute and relative rankings
│   │   │   ├── mock.controller.js       # CRUD operations for Mock templates
│   │   │   ├── payment.controller.js    # Monitors transaction callbacks and invoices
│   │   │   ├── question.controller.js   # Question bank administrative controller
│   │   │   ├── result.controller.js     # Calculates metrics, aggregates scoring metrics
│   │   │   └── test.controller.js       # Active test phase processing and evaluation logic
│   │   ├── middleware/                  # HTTP Request processing chain
│   │   │   ├── auth.middleware.js       # Enforces session token validity 
│   │   │   └── optionalAuth.middleware.js# Non-blocking context resolver for public routes
│   │   ├── models/                      # MongoDB Data Schemas (Mongoose)
│   │   │   ├── mock.model.js            # Exam profiles, rulesets, and pricing
│   │   │   ├── question.model.js        # Multi-choice format, options, keys, and tags
│   │   │   ├── result.model.js          # Calculated outcomes, score weights, subject metrics
│   │   │   ├── testAttempt.model.js     # State preservation for ongoing/unfinished tests
│   │   │   └── user.model.js            # User accounts, payment histories, privileges
│   │   ├── routes/                      # API Endpoint mappings
│   │   │   ├── ai.routes.js             # Route endpoints: AI evaluations, prompt channels
│   │   │   ├── auth.routes.js           # Route endpoints: Signup, login, status
│   │   │   ├── mock.routes.js           # Route endpoints: Mock templates management
│   │   │   ├── payment.routes.js        # Route endpoints: Checkouts, webhooks
│   │   │   ├── question.routes.js       # Route endpoints: Question bank queries
│   │   │   ├── result.routes.js         # Route endpoints: Analytics & score retrievals
│   │   │   └── test.routes.js           # Route endpoints: Active test submissions
│   │   ├── seed/                        # Base data & configuration seeds
│   │   │   ├── debug_ids.cjs            # Mock and Question ID references for consistency
│   │   │   ├── index.js                 # Orchestrates systematic seeding actions
│   │   │   └── mocks.config.js          # Predefined structural targets for test instances
│   │   ├── services/                    # Autonomous Domain Services
│   │   │   ├── aiAnalyzer.service.js    # Processes result objects into LLM prompt templates
│   │   │   ├── emailService.js          # Transactional mail delivery service
│   │   │   ├── gemini.service.js        # Google Gemini integration driver
│   │   │   ├── imucetKnowledge.base.js  # Curated contextual engine for semantic search (RAG)
│   │   │   └── ragChat.service.js       # Evaluates context-aware user inputs
│   │   └── utils/                       # Standalone utility modules
│   │       ├── normalizeResult.js       # Normalizes results data sets across variants
│   │       └── paymentToggle.js         # Runtime toggle mechanisms for checking paywalls
│   ├── scripts/
│   │   └── seedQuestions.js             # Parses raw questions into DB formats
│   ├── env.template                     # Template structure for backend environments
│   ├── package.json                     # Server runtime dependencies & execution scripts
│   ├── seedMocks.js                     # Root execution script for system Mock database seeding
│   └── work.js                          # Temporary utility execution buffer
├── frontend/                            # Client-Side Application Space
│   └── web/
│       ├── public/                      # Static client assets and offline fallbacks
│       │   ├── Nimu5.json               # Local dataset fallback mock
│       │   └── answers/                 # Solution key directories
│       ├── analysis/
│       │   └── analysisEngine.js        # Browser-side metric visualizer and parsing logic
│       ├── eslint.config.js             # Linter configurations
│       ├── index.html                   # Single-Page Application entry target
│       ├── package.json                 # Web tooling & component dependencies
│       └── postcss.config.cjs           # PostCSS compiler options for Tailwind CSS engine
├── DEPLOYMENT_GUIDE.md                  # Infrastructure and Cloud Deployment processes
├── MANAGE_PAYMENTS.md                   # Operator runbook for managing transactions
├── PRODUCTION_CHECKLIST.md              # Final safety, optimization, and security audits
└── SETUP_GUIDE.md                       # Comprehensive environment initialization manual
```

---

## 3. Architecture & Data Flow

```
┌──────────────┐         ┌───────────────┐         ┌─────────────────────────┐
│              │  HTTPS  │               │  Mongoose │                         │
│ Client SPA   │────────>│ Express API   │────────>│ MongoDB Database        │
│ (Vite/React) │<────────│ (App Instance)│<────────│ (Users, Mocks, Results) │
│              │   JSON  │               │         │                         │
└──────────────┘         └───────┬───────┘         └─────────────────────────┘
                                 │
                                 ├─────────────────> Google Gemini API
                                 │  (RAG / Vector Concept Lookup)
                                 │
                                 └─────────────────> Transaction Provider (Paywall)
```

1. **Authentication Flow**: Users register/log in via `/api/auth`. Safe JSON Web Tokens (JWT) are signed and returned to authorize subsequent private requests (stored either in HttpOnly cookies or Authorization headers).
2. **Taking an Exam**: 
   * When an exam begins, `/api/tests/start` constructs a new, unique state-tracked token inside the `testAttempt` collection.
   * Answers are continuously cached back to the server to prevent data loss in case of hardware or connection failures.
   * Upon completion, `/api/tests/submit` executes grading sequences against `questions`, standardizes raw data using `normalizeResult.js`, creates permanent records in `results`, and removes temporary tracking contexts.
3. **AI Concept Analysis**: The `ai.controller.js` parses the structural elements inside a user's graded `result` payload, requests localized insights from `imucetKnowledge.base.js`, and uses `gemini.service.js` to build a personalized performance improvement report.

---

## 4. Development Environment Configuration

To configure MockX locally, follow the guidelines below to set up your backend and frontend application spaces.

### Prerequisites

*   **Node.js**: v18.x or above installed.
*   **MongoDB**: A running local MongoDB community instance or a MongoDB Atlas cloud URI.
*   **Package Managers**: `npm` (packaged default) or `yarn`.

---

### Step 1: Configure Backend Environment Variables

Navigate to your `/backend` directory and create an `.env` file using the `env.template` model:

```bash
cd backend
cp env.template .env
```

Open the `.env` file and customize the following environment keys:

```ini
# Application Configurations
PORT=10000
NODE_ENV=development

# Database Configurations
MONGODB_URL=mongodb://localhost:27017/mockx

# Cryptographic Tokens
JWT_SECRET=your_jwt_strong_secret_key
JWT_EXPIRE=30d

# Transaction Gateways (Dynamic Configurations)
PAYMENT_GATEWAY_API_KEY=your_payment_provider_key
PAYMENT_MODE=sandbox # 'sandbox' or 'production'
BYPASS_PAYMENTS=true # Toggle to true for development/local testing

# AI Providers
GEMINI_API_KEY=your_google_gemini_api_key_here

# Transporter Mail Setup (Optional)
EMAIL_SERVICE=SendGrid
EMAIL_USERNAME=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@mockx.com
```

---

### Step 2: Install Backend Dependencies & Populate Seed Data

Run development installations and seed initial questions and mock exams to populate your MongoDB instance:

```bash
# Install packages
npm install

# Run migration to seed basic mock configurations
node seedMocks.js

# Load questions into the database
node src/scripts/seedQuestions.js
```

To run your API server in watch-mode:

```bash
npm run dev
# Server initiates on http://localhost:10000
```

---

### Step 3: Configure and Initialize Frontend

Open a new terminal session, navigate to `/frontend/web`, install the front-end toolchain dependencies, and launch the development environment:

```bash
cd frontend/web

# Install packages
npm install

# Run client-side environment in developer mode
npm run dev
```
*The build toolchain (Vite) will launch your local web client environment, typically exposing the server at `http://localhost:5173`.*

---

## 5. Operations & Developer Guides

To ensure success across non-development environments, please consult the operational manuals provided in the root directory:

*   **System Setup Details**: For advanced configurations or troubleshooting during initialization, refer to [SETUP_GUIDE.md](./SETUP_GUIDE.md).
*   **Payment Controls**: Learn how to toggle, test, or restrict transaction frameworks using [MANAGE_PAYMENTS.md](./MANAGE_PAYMENTS.md).
*   **Infrastructure Strategy**: For information on containers, cloud deployments, and configurations for continuous delivery, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
*   **Launch Verifications**: To verify security, database performance, and token validation parameters prior to launch, review the [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).