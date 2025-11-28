# Overview

This project is a production-ready SaaS web application designed for selling Starlink data packages to maritime vessels. It features a modern, futuristic dark theme with glassmorphism elements. The full-stack TypeScript application enables ship selection, data plan management, secure PayPal checkout, and comprehensive admin controls. The business vision is to provide a robust platform for maritime connectivity, leveraging Starlink technology, with ambitions to capture a significant market share in this niche.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite.
- **UI Framework**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with a custom futuristic dark theme and glassmorphism effects.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Futuristic dark theme, glassmorphism design, smooth animations, responsive design across all pages. All labels and content are in Turkish.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon Database).
- **Authentication**: Replit Auth integration with OpenID Connect and PostgreSQL-backed session management.
- **API Design**: RESTful endpoints with error handling and logging.
- **Technical Implementations**: Comprehensive system logging, automated log cleanup, package-based credential management, and robust settings management with various form controls. PCI DSS compliance measures (password policy, account lockout, session management, inactive account deactivation) are implemented for normal users.

## Database Design
- **Primary Database**: PostgreSQL via Neon serverless connection.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Tables**: Users, Ships, Plans, Ship-Plans, Orders, Order Items, Coupons, Settings, Sessions, System Logs (7-day retention), Email Logs, Credential Pools, User Segments, Error Logs, System Metrics.

## Service Layer Architecture
- **Core Services**: OrderService, CouponService, ExpiryService (handles order expiration with Istanbul timezone), and a Storage Interface for database operations.

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC.
- **Session Management**: Server-side, PostgreSQL-backed sessions.
- **Role System**: Admin and user roles with route protection.

## Payment Integration
- **Provider**: PayPal Server SDK.
- **Flow**: Order creation, PayPal checkout, payment capture, order fulfillment.
- **Currency**: USD.
- **Validation**: Server-side order validation.

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database.
- **Replit Platform**: Development environment.
- **Replit Auth**: OAuth/OIDC authentication provider.

## Payment Services
- **PayPal**: Payment processing via PayPal Server SDK.

## UI and Design
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **Font Awesome**: Additional icons (via CDN).
- **Google Fonts**: Inter font family.

## Development Tools
- **Vite**: Build tool.
- **TypeScript**: Static typing.
- **ESBuild**: Backend bundling.
- **PostCSS**: CSS processing.

## Validation and Forms
- **Zod**: Schema validation.
- **React Hook Form**: Form state management.

## Communication
- **WhatsApp Business**: Customer support integration (via WhatsApp Web API).