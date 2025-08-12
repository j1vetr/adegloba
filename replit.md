# Overview

This is a production-ready SaaS web application for selling Starlink data packages to maritime vessels. The platform features a modern, futuristic dark theme with glassmorphism design elements and smooth animations. Built with a full-stack TypeScript architecture, it provides ship selection, data plan management, secure checkout with PayPal integration, and comprehensive admin controls.

# User Preferences

Preferred communication style: Simple, everyday language.

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