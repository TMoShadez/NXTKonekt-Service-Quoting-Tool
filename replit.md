# NXT Konekt Site Assessment Tool

## Overview

NXT Konekt is a comprehensive full-stack web application designed for managing Fixed Wireless Access (FWA) installation assessments and quote generation. The system enables sales executives to conduct detailed site assessments, upload supporting documents and photos, and automatically generate professional quotes with pricing calculations.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React-based SPA with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Deployment**: Replit platform with autoscale deployment target

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom NXT Konekt brand colors
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon serverless with WebSocket support
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with OpenID Connect strategy
- **Session Management**: Express sessions with PostgreSQL store
- **File Handling**: Multer for multipart file uploads
- **PDF Generation**: PDFKit for quote document generation

### Database Schema
The application uses a PostgreSQL database with the following key entities:
- **Users**: Mandatory Replit Auth user storage
- **Sessions**: Mandatory session storage for Replit Auth
- **Organizations**: Sales organization information
- **Assessments**: Site assessment data and technical requirements
- **Quotes**: Generated quotes with pricing breakdown
- **UploadedFiles**: File metadata for photos and documents

### File Management
- **Upload Structure**: Organized into `uploads/photos` and `uploads/documents`
- **File Types**: Images for site photos, documents for supporting materials
- **Storage**: Local filesystem with database metadata tracking
- **Security**: File type validation and size limits

## Data Flow

1. **Authentication**: Users authenticate via Replit Auth (OpenID Connect)
2. **Organization Setup**: First-time users create their sales organization profile
3. **Assessment Creation**: Sales executives create new site assessments
4. **Step-by-Step Data Collection**:
   - Sales executive information
   - Customer contact details
   - Technical site assessment
   - File uploads (photos/documents)
   - Quote generation and review
5. **Pricing Calculation**: Automated pricing engine calculates costs based on assessment parameters
6. **PDF Generation**: Professional quotes generated as downloadable PDFs
7. **Data Persistence**: All assessment and quote data stored in PostgreSQL

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **react-hook-form**: Performant form library
- **zod**: Schema validation
- **passport**: Authentication middleware
- **multer**: File upload handling
- **pdfkit**: PDF document generation

### Development Dependencies
- **vite**: Frontend build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **tsx**: TypeScript execution for server development
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is configured for deployment on the Replit platform with:

- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite builds the frontend, esbuild bundles the server
- **Development**: `npm run dev` starts both frontend and backend with hot reload
- **Production**: `npm run start` serves the built application
- **Database**: Drizzle migrations handle schema changes
- **Port Configuration**: Server runs on port 5000, mapped to external port 80
- **Auto-scaling**: Configured for Replit's autoscale deployment target

The application requires environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for Replit Auth
- `ISSUER_URL`: OpenID Connect issuer URL (defaults to Replit)

## Changelog

Changelog:
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.