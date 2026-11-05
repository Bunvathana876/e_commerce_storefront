# Blue Panda Storefront 🐼🛍️

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand_5-443e38?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-28%2F28%20Passing-success?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Blue Panda Storefront** is a modern, high-performance customer-facing e-commerce application. Engineered with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, it delivers a seamless, lightning-fast shopping experience backed by robust session isolation, server-validated checkout security, and a responsive mobile-first UI.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Security Highlights](#-architecture--security-highlights)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration (.env)](#configuration-env)
  - [Running Development Server](#running-development-server)
  - [Building for Production](#building-for-production)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Docker Deployment](#-docker-deployment)
- [Related Services](#-related-services)
- [License](#-license)

---

## ✨ Key Features

### 🛍️ Product Catalog & Discovery
- **Rich Homepage**: Hero promotional banners, featured product grids, category cards, and curated deal sections.
- **Advanced Filtering & Sorting**: Multi-criteria filtering by category, price range, minimum rating, and in-stock status, with dynamic sorting (price asc/desc, highest rated, newest).
- **Instant Search Dialog**: Fast, interactive search modal (`Cmd+K` / click trigger) with real-time query suggestions.
- **Quick View Modal**: Interactive product preview overlay allowing customers to inspect details, select variants, and add to cart without navigating away.
- **Category & Deals Pages**: Dedicated browsing pages for categories and discounted promotions.

### 🛒 Shopping Cart & Wishlist
- **Slide-out Cart Drawer**: Non-intrusive flyout cart for immediate checkout preparation and quantity adjustments.
- **Full Cart Page (`/cart`)**: Detailed line-item breakdown, free shipping qualification progress bar, promo coupon redemption, and price summaries.
- **Wishlist & Favorites**: Save favorite items with one click, synced to local storage for guests and synced to the backend API for logged-in accounts.
- **Guest-to-User State Merging**: Persistent cart storage through Zustand that securely syncs to the server upon user authentication.

### 💳 Checkout & Order Processing
- **Streamlined Checkout Flow (`/checkout`)**: Multi-step checkout with delivery address selection, order summary, and shipping calculations.
- **Flexible Payment Methods**: Support for Cash on Delivery (COD) and digital/card demo options.
- **Order Tracking (`/orders`)**: Real-time order history, tracking stages (Pending, Processing, Delivered, Cancelled), and itemized order inspection.

### 👤 Customer Account & Authentication
- **Authentication**: Dedicated customer sign-in and registration pages with secure token handling.
- **Customer Account (`/account`)**: Profile management, default delivery address configuration, and session controls.
- **Smart Navigation**: Role-aware redirect guards that keep customers on the storefront while directing admin/seller users to their respective portals.

---

## 🔒 Architecture & Security Highlights

| Security Feature | Implementation Details |
| :--- | :--- |
| **Session Isolation & Cache Purge** | Strict boundary enforcement (`session-isolation.test.ts`). Logging out purges private memory caches and local session stores immediately, preventing sensitive customer data leaks on shared devices. |
| **Server-Validated Coupons** | Coupon codes are re-validated exclusively against the backend during checkout (`checkout-security.ts`), eliminating client-side price tampering. |
| **Idempotent Checkout** | Debounced in-flight submission tracking prevents accidental duplicate orders or double-billing on rapid clicks. |
| **Open-Redirect Protection** | Strict URL validation rejects protocol-relative (`//`, `/\`) and untrusted domains on post-login redirects. |
| **Portal Boundary Separation** | Clean separation of session storage keys between the Storefront customer app and the internal Management/Seller portal. |

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **UI Library** | [React 19](https://react.dev/) with `babel-plugin-react-compiler` |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) with LocalStorage Persistence |
| **Icons** | [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/) |
| **Testing** | Native Node.js Test Runner (`node:test`) with custom ES module resolver |
| **Linting** | [ESLint 9](https://eslint.org/) (`eslint-config-next`) |
| **Containerization** | [Docker](https://www.docker.com/) (Node 20 Alpine) |

---

## 📁 Project Structure

```text
storefront/
├── public/                       # Static public assets (images, logos, robots.txt)
│   └── images/
│       └── logo_panda_blue.png   # Blue Panda brand wordmark & icon
├── src/
│   ├── app/                      # Next.js App Router structure
│   │   ├── (auth)/               # Customer authentication group
│   │   │   ├── login/            # Customer Sign In
│   │   │   └── register/         # Customer Sign Up
│   │   ├── (store)/              # Core storefront layout and views
│   │   │   ├── account/          # Customer profile & addresses
│   │   │   ├── cart/             # Dedicated shopping cart page
│   │   │   ├── categories/       # Category directory
│   │   │   ├── checkout/         # Multi-step checkout & payment
│   │   │   ├── deals/            # Promotional offers
│   │   │   ├── orders/           # Customer order tracking
│   │   │   ├── product/[id]/     # Dynamic product detail page
│   │   │   ├── shop/             # Catalog browsing with filters
│   │   │   ├── stores/           # Store & vendor directory
│   │   │   ├── wishlist/         # Customer saved items
│   │   │   ├── layout.tsx        # Storefront navigation & layout wrapper
│   │   │   └── page.tsx          # Storefront homepage
│   │   ├── globals.css           # Tailwind v4 styles & theme variables
│   │   └── layout.tsx            # Root HTML & body layout
│   ├── components/
│   │   └── store/                # Reusable storefront UI components
│   │       ├── CartDrawer.tsx           # Slide-out cart
│   │       ├── CategoryCard.tsx         # Category display tile
│   │       ├── FilterToolbar.tsx        # Catalog filters & sort options
│   │       ├── ProductCard.tsx          # Product card with price/badges
│   │       ├── ProductGrid.tsx          # Responsive product grid
│   │       ├── ProductSkeleton.tsx      # Loading state skeletons
│   │       ├── PromoHero.tsx            # Hero promo banner
│   │       ├── QuickViewDialog.tsx      # Instant product quick-view modal
│   │       ├── SearchCommandDialog.tsx  # Search modal (Cmd+K)
│   │       ├── StoreNavbar.tsx          # Store navigation & status header
│   │       ├── StoreFooter.tsx          # Comprehensive footer
│   │       └── ToastViewport.tsx        # Interactive notification toasts
│   └── lib/                      # Core business logic & utilities
│       ├── __tests__/            # Unit, integration, & security test suites
│       ├── api.ts                # REST API client & endpoints
│       ├── auth.ts               # Storefront session, token & user helpers
│       ├── checkout-security.ts  # Coupon, payment & checkout validation
│       ├── store.ts              # Zustand store (cart, wishlist, toasts)
│       ├── store-catalog.ts      # Image resolver & price calculations
│       └── utils.ts              # Styling helpers (clsx, twMerge)
├── .env.example                  # Environment configuration template
├── Dockerfile                    # Production/development Docker configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration for Tailwind v4
└── tsconfig.json                 # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher (or `pnpm` / `yarn`)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bluepanda-storefront.git
   cd bluepanda-storefront
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

### Configuration (.env)

Create a local environment file by copying the template:

```bash
cp .env.example .env.local
```

Configure the environment variables according to your local setup:

```env
# URL for the Blue Panda REST API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# URL for the Blue Panda Admin & Seller Management Portal
NEXT_PUBLIC_MANAGEMENT_URL=http://localhost:3001
```

### Running Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the storefront.

### Building for Production

Create an optimized production build:

```bash
npm run build
npm start
```

---

## 🧪 Testing & Quality Assurance

The codebase includes comprehensive unit, integration, and security test suites executed via the native Node.js test runner with a TypeScript resolver.

To run all test suites:

```bash
npm test
```

### Test Coverage Highlights

- **Session Isolation (`session-isolation.test.ts`)**: Confirms customer private data is wiped upon logout and prevents cross-user session cache collisions.
- **Checkout & Payment Security (`checkout-security.test.ts`)**: Verifies duplicate submission guards, backend coupon validation, and unverified payment safeguards.
- **Discovery & Catalog Filters (`homepage-filters.test.mjs`)**: Verifies category, price calculation, rating, and stock filters.
- **Routing & Redirection Guard (`storefront-routing.test.mjs`)**: Verifies safe open-redirect prevention and role separation.

To run code linting:

```bash
npm run lint
```

---

## 🐳 Docker Deployment

You can build and containerize the storefront using the provided `Dockerfile`:

1. **Build the Docker Image:**
   ```bash
   docker build -t bluepanda-storefront .
   ```

2. **Run the Container:**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_API_URL=http://localhost:8000/api \
     -e NEXT_PUBLIC_MANAGEMENT_URL=http://localhost:3001 \
     bluepanda-storefront
   ```

Access the containerized app at `http://localhost:3000`.

---

## 🔗 Related Services

The storefront is part of the Blue Panda E-Commerce ecosystem:
- **Backend API (`/backend`)**: FastAPI/Python REST service handling authentication, product catalog, orders, and database operations.
- **Management Portal (`/management`)**: Next.js dashboard for administrators and sellers to manage products, categories, coupons, and orders.
- **Mobile Client (`/mobile-app`)**: Flutter mobile application for iOS and Android.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
