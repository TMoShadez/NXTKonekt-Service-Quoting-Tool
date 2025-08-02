# NXTKonekt Site Assessment Tool

## Overview
NXTKonekt is a full-stack web application for managing Fixed Wireless Access (FWA) installation assessments and generating quotes. It allows sales executives to conduct site assessments, upload supporting documents, and automatically create professional quotes with pricing calculations. The project aims to streamline the sales and assessment process for FWA installations, providing a comprehensive tool for efficient client engagement and quote delivery.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a modern full-stack architecture. The **Frontend** is a React SPA with TypeScript, built with Vite, using shadcn/ui on Radix UI, Tailwind CSS, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for forms. The **Backend** is an Express.js server with TypeScript, utilizing PostgreSQL via Neon with Drizzle ORM, Passport.js for Replit Auth (OpenID Connect), Express sessions, Multer for file uploads, and PDFKit for quote generation.

The **Database Schema** includes entities for Users, Sessions, Organizations, Assessments, Quotes, and UploadedFiles. File uploads are stored locally with metadata in the database, with validation for type and size.

**Data Flow** involves user authentication via Replit Auth, organization setup, creation of site assessments with step-by-step data collection (sales info, customer details, technical assessment, file uploads), automated pricing calculation, and PDF quote generation. All data persists in PostgreSQL.

**Recent Updates (August 2025)**:
- Fixed admin dashboard quote management to display actual data instead of "N/A" values
- Implemented comprehensive quote details modal with full assessment information matching partner dashboard
- Created `/api/admin/quotes/:id/details` endpoint for detailed quote data retrieval
- Enhanced role-based access control throughout the application
- Removed Assessment Management section from admin interface as requested
- Replicated complete quote details card from partner dashboard to admin dashboard with full visibility into:
  - Sales executive and customer information
  - Comprehensive pricing breakdowns
  - Infrastructure requirements and site characteristics
  - Environmental factors and service-specific details
- Fixed PDF download functionality in admin dashboard by properly extracting filenames from stored paths
- Ensured consistent PDF serving through `/api/files/pdf/` endpoint with proper filename extraction
- Restored original Statement of Work content for contractual compliance
- Optimized PDF formatting for Fixed Wireless Assessments to fit within 4 pages maximum
- Maintained proper font sizes for readability (headers: 12pt, content: 9pt, details: 8pt)
- Preserved all contractual language and detailed process descriptions in SOW sections
- Each SOW type starts on a new page for proper organization and formatting
- Balanced space efficiency with professional presentation and legal requirements

## Role-Based Access Control
Comprehensive role-based access control implemented throughout the application:

- **System Administrators**: Full access to admin dashboard, partner management, user role management
- **Administrators**: Access to admin dashboard and partner management functions  
- **Partners**: Access to assessment creation, quote generation, and personal dashboard
- **Sales Executives**: Enhanced partner access with additional sales-specific features

**Admin Dashboard Features**:
- Partner Management: Approve/reject partner applications and manage partner status
- User Role Management: Modify user roles and system admin privileges
- HubSpot Integration: Monitor API connectivity and sync status
- Analytics: System metrics, partner conversion rates, and usage statistics
- Quote Management: System-wide quote oversight with detailed modal views displaying complete assessment data
- Quote Details: Comprehensive quote information including customer details, assessment data, and cost breakdowns

**Access Protection**:
- Frontend routing protects admin routes based on user role
- Backend middleware validates admin access for all admin endpoints
- Role indicators displayed in user interface headers
- Proper authentication flow with role-based redirects

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