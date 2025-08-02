# NXTKonekt Site Assessment Tool

## Overview
NXTKonekt is a full-stack web application for managing Fixed Wireless Access (FWA) installation assessments and generating quotes. It allows sales executives to conduct site assessments, upload supporting documents, and automatically create professional quotes with pricing calculations. The project aims to streamline the sales and assessment process for FWA installations, providing a comprehensive tool for efficient client engagement and quote delivery.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a modern full-stack architecture. The **Frontend** is a React SPA with TypeScript, built with Vite, using shadcn/ui on Radix UI, Tailwind CSS, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for forms. The **Backend** is an Express.js server with TypeScript, utilizing PostgreSQL via Neon with Drizzle ORM, Passport.js for Replit Auth (OpenID Connect), Express sessions, Multer for file uploads, and PDFKit for quote generation.

The **Database Schema** includes entities for Users, Sessions, Organizations, Assessments, Quotes, and UploadedFiles. File uploads are stored locally with metadata in the database, with validation for type and size.

**Data Flow** involves user authentication via Replit Auth, organization setup, creation of site assessments with step-by-step data collection (sales info, customer details, technical assessment, file uploads), automated pricing calculation, and PDF quote generation. All data persists in PostgreSQL.

## External Dependencies
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
- **vite**: Frontend build tool
- **typescript**: Type safety
- **tsx**: TypeScript execution
- **esbuild**: Fast JavaScript bundler
- **HubSpot API**: CRM integration for contact, deal, and ticket management.