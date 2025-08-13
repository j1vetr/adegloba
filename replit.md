# Overview

This is a production-ready SaaS web application for selling Starlink data packages to maritime vessels. The platform features a modern, futuristic dark theme with glassmorphism design elements and smooth animations. Built with a full-stack TypeScript architecture, it provides ship selection, data plan management, secure checkout with PayPal integration, and comprehensive admin controls.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## Card-Only Payment System Implementation (August 13, 2025)
- Removed PayPal payment option entirely, focusing on card-only payments
- Created CardPaymentButton component with gold/amber gradient styling (#FFC107→#FFB300)
- Redesigned payment button: black text, no brand icons, enhanced futuristic theme
- Added sophisticated hover effects: scale transform, glow, shine animation
- Implemented proper focus states with ring indicators for accessibility
- Enhanced security messaging with animated indicators and trust signals
- Maintained order success routing (/order-success) for payment completion
- Full responsive design with improved mobile experience
- All UI follows dark futuristic AdeGloba theme with Turkish localization

## Enhanced Credit Card Payment UI with Slide-Over Drawer (August 13, 2025)
- Redesigned checkout payment buttons: compact PayPal button and yellow credit card button
- Created futuristic credit card payment drawer with slide-over design from right side
- Full responsive layout: desktop two-column, mobile single-column with no overflow
- Comprehensive credit card form: card details, billing address, contact information
- Turkish localization: all labels, placeholders, error messages, and validation in Turkish
- Card brand detection and auto-formatting for card numbers, expiry dates, phone numbers
- Professional styling: dark theme, neon-blue accents, glassmorphism effects, card brand icons
- Enhanced PayPal button: authentic branding, compact "PayPal ile Ödeme" label
- Credit card button: yellow gradient, card brand icons (Visa, MC, Amex, Maestro), "Kredi Kartı ile Ödeme"
- Sticky footer with total amount and secure payment messaging

## Complete System Logging Infrastructure Implementation (August 13, 2025)
- Implemented comprehensive system logs functionality with full database schema
- Created systemLogs table with categories, actions, admin tracking, and detailed event logging
- Added system logging to all critical admin actions: user deletion, admin login/logout, ship operations
- Built complete system logs admin page with filtering by category, action, search, and pagination
- Features: expandable log details, IP tracking, user agent logging, real-time updates every 5 seconds
- Turkish UI integration with proper AdminLayout sidebar navigation under "Sistem → Sistem Logları"
- Database table successfully created and all logging endpoints working with proper authentication
- Successfully tested: admin login logging and user deletion logging with full details preservation

## Automatic Log Cleanup System Implementation (August 13, 2025)
- Implemented automated log cleanup service that deletes entries older than 7 days
- Created LogCleanupService with scheduled cleanup every 6 hours and immediate startup cleanup
- Added manual cleanup endpoint: POST /api/admin/logs/cleanup for admin-triggered cleanup
- Service automatically starts on server initialization and runs silently in background
- Successful testing: deleted 2 old test logs (8+ days old), preserved recent logs
- Self-logging: cleanup actions are tracked in system logs for audit purposes
- Zero-maintenance operation: ensures system only retains last 7 days of logs automatically

## Package-Based Credential Management System Implementation (August 12, 2025)
- Redesigned database schema from ship-based to package-based credential management
- Updated credentialPools table to reference planId instead of shipId with proper foreign keys
- Created orderCredentials table for tracking credential delivery per order unit
- Implemented comprehensive credential-to-package assignment system with 1:1 delivery ratio
- Built new integrated admin pages: CredentialPoolsNew.tsx and ShipPackagesNew.tsx
- Added full AdminLayout integration with sidebar, topbar, breadcrumbs for consistency
- Features: package-specific credential import, bulk management, statistics dashboards
- Updated storage layer with new methods: getCredentialsForPlan, deliverCredentialsForOrder
- Comprehensive API endpoints for package-credential operations and order fulfillment

## Complete Credential Pool Page Redesign (August 12, 2025)
- Redesigned Credential Pool page with full AdminLayout integration (sidebar, topbar, breadcrumbs)
- Implemented textarea-based credential import system replacing CSV upload
- Added comprehensive searchable and paginated credential table with filters
- Features: username search, status filters (assigned/available), bulk actions, responsive design
- Enhanced UI with dark futuristic maritime theme and glassmorphism effects
- Included credential stats dashboard showing available/assigned/total counts
- Added bulk delete functionality with checkbox selection system
- Implemented proper admin permissions and mobile-responsive design
- Format: each line as "username,password" with validation and error reporting

## Comprehensive Settings Management System (August 12, 2025)
- Implemented complete Settings (Ayarlar) page with 5 categorized sections
- Database schema with settings table (key, value, category, timestamps)
- Advanced form controls: masked password fields with show/hide toggle, dropdown selectors, switches, text areas
- Two-column responsive layout with labels on left, inputs on right (desktop) / single column (mobile)
- Immediate save functionality with visual feedback (spinning icons, success checkmarks)
- Default settings initialization on server startup for all categories
- Perfect visual consistency with admin panel's dark futuristic theme and glassmorphism effects
- Categories: Genel Ayarlar, Ödeme Ayarları, Destek Ayarları, Captive Portal Ayarları, RADIUS Ayarları

## Complete UI Rebranding to "AdeGloba Starlink System" (August 12, 2025)
- Updated all page titles and headers across the application
- Converted all labels to Turkish throughout the interface
- Added private system messaging for AdeGloba customers
- Landing page: Complete rebrand with Turkish content
- Authentication pages: Turkish labels (Giriş, Kayıt, form fields)
- Dashboard: "AdeGloba Starlink System - Kontrol Paneli" with Turkish sections
- Admin Panel: "AdeGloba Starlink System - Yönetim Paneli" with Turkish interface
- Data packages page: Turkish branding and descriptions
- Mobile responsive design maintained across all pages

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom futuristic dark theme variables and glassmorphism effects
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL (configured for Neon Database)
- **Authentication**: Replit Auth integration with OpenID Connect and session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with proper error handling and logging middleware

## Database Design
- **Primary Database**: PostgreSQL via Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - Users (integrated with Replit Auth)
  - Ships (vessel management with slug-based routing)
  - Plans (data packages with pricing in USD)
  - Ship-Plans relationship (many-to-many)
  - Orders and Order Items (shopping cart and purchase history)
  - Coupons (discount system with validation rules)
  - Settings (application configuration)
  - Sessions (mandatory for Replit Auth)

## Service Layer Architecture
- **OrderService**: Handles order creation, validation, and processing logic
- **CouponService**: Manages coupon validation, application, and usage tracking
- **ExpiryService**: Processes order expiration with Istanbul timezone calculations
- **Storage Interface**: Abstraction layer for all database operations

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC flow
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Role System**: Admin and user roles with route protection
- **API Security**: Session-based authentication for API endpoints

## Payment Integration
- **Provider**: PayPal Server SDK with sandbox/production environment switching
- **Flow**: Order creation → PayPal checkout → payment capture → order fulfillment
- **Currency**: All transactions processed in USD
- **Validation**: Server-side order validation before payment processing

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Replit Platform**: Development environment with built-in authentication system
- **Replit Auth**: OAuth/OIDC authentication provider with user management

## Payment Services
- **PayPal**: Payment processing via PayPal Server SDK with order creation and capture APIs

## UI and Design
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icons via CDN for maritime/satellite themes
- **Google Fonts**: Inter font family for modern typography

## Development Tools
- **Vite**: Build tool with development server and HMR
- **TypeScript**: Static typing across frontend and backend
- **ESBuild**: Backend bundling for production deployment
- **PostCSS**: CSS processing with Tailwind CSS integration

## Validation and Forms
- **Zod**: Schema validation for forms and API data
- **React Hook Form**: Form state management with validation integration

## Communication
- **WhatsApp Business**: Customer support integration via WhatsApp Web API