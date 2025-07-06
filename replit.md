# NXTKonekt Site Assessment Tool

## Overview

NXTKonekt is a comprehensive full-stack web application designed for managing Fixed Wireless Access (FWA) installation assessments and quote generation. The system enables sales executives to conduct detailed site assessments, upload supporting documents and photos, and automatically generate professional quotes with pricing calculations.

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
- **Styling**: Tailwind CSS with custom NXTKonekt brand colors
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
- June 15, 2025. Initial setup with full assessment workflow
- June 15, 2025. Fixed database foreign key constraints for organization handling
- June 15, 2025. Resolved date validation errors in customer information step
- June 15, 2025. Added 48-hour SLA disclaimer for installation date selection
- June 15, 2025. Updated branding to "NXTKonekt" (one word) and added astronaut logo to landing page
- June 15, 2025. Added NXTKonekt astronaut logo to PDF quote templates for consistent branding
- June 15, 2025. Updated dashboard to use NXTKonekt horizontal logo and pricing to $190/hr with included services
- June 15, 2025. Completed multi-service assessment system with customer information collection and PDF quote generation for Fleet Tracking and Fleet Camera services
- June 15, 2025. Updated pricing engine with service-specific calculations: Fleet Tracker OBD installation includes up to 3 vehicles, Fleet Camera pricing per vehicle at $190/hr
- June 19, 2025. Fixed character input issues in Fleet Tracking and Fleet Camera forms by correcting number and date input parsing
- June 19, 2025. Reordered Fixed Wireless assessment form sections: Infrastructure Requirements first, Site Characteristics second, Environmental Factors last
- June 19, 2025. Added network signal assessment fields to Infrastructure Requirements: Network Signal dropdown (4G/5G) and Signal Strength dropdown (5/4/3 bars)
- June 19, 2025. Enhanced Infrastructure Requirements with additional assessment questions: connection usage (Primary/Failover), router location (In Rack/Server Room/Other), antenna cable requirement, device connection assistance with conditional messaging for device limits
- June 19, 2025. Implemented advanced conditional logic for Fixed Wireless assessments: 3-bars signal strength triggers antenna recommendations and additional questions, server room selection shows router mounting options, failover connections display dual WAN support questions
- June 19, 2025. Reorganized Infrastructure Requirements question order: connection usage and router location moved to top, removed duplicate antenna cable question, added conditional ceiling assessment (height/type) to Site Characteristics when internal antenna selected
- June 19, 2025. Added router specification questions to Site Characteristics: router make dropdown with 11 manufacturer options and router model text field with 20-character limit as final section questions
- June 19, 2025. Enhanced antenna assessment with cable footage question (10-250 ft range) and streamlined Infrastructure Requirements by removing power, ethernet, ceiling mount, and outdoor coverage checkboxes
- June 22, 2025. Updated pricing engine with new rate structure: Fixed Wireless base 0/2/1 hours (survey/install/config), device count logic for 1 included + failover adjustments, cable pricing at $7/ft, configuration now billable at $190/hr
- June 22, 2025. Implemented configuration pricing logic: Failover with 1 device = $0, Failover with >1 devices = billable hours. Primary with <5 devices = $0, Primary with >=5 devices = billable hours
- June 22, 2025. Updated quote summary page to match PDF format with hours, rates, and hardware line items displayed in 4-column table layout
- June 22, 2025. Added "Number of Routers to be installed" required field to Site Characteristics section with router count multiplier logic for installation hours when >1 router specified
- June 22, 2025. Fixed Fleet Tracking and Fleet Camera form input issues by implementing debounced state updates that save on blur instead of every keystroke, preventing cursor jumping and character deletion
- June 23, 2025. Implemented data isolation between service types to prevent cross-contamination: Fleet Tracking and Fleet Camera forms now maintain independent datasets, customer information properly transfers to PDFs, and quotes are service-specific without Fixed Wireless data bleeding through
- June 23, 2025. Completely resolved Fleet form input issues: implemented proper debounced state management with onBlur API saves, fixed cursor jumping in text fields, eliminated character deletion during typing, and ensured all form inputs (text, number, select, checkbox, textarea) work smoothly across both Fleet Tracking and Fleet Camera forms
- June 23, 2025. Enhanced Fleet Camera form with advanced features: added useFormInput custom hook for robust input handling, implemented Carrier Sim dropdown (T-Mobile, Verizon, AT&T, Wholesale), added dynamic vehicle details collection (Year/Make/Model) that scales with vehicle count, replaced Video Quality with Tracking Partner dropdown (Zenduit, Spireon, Geotab, TrackCam, Fleethoster, AirIQ, Other), replaced Storage with Model text field, and replaced Recording Mode with Protective Wiring Harness Yes/No dropdown
- July 5, 2025. Simplified pricing logic across all service types: reduced to +1 additional hour of labor for all quotes regardless of device count or complexity, updated cable pricing from $7/ft to $14.50/ft for Fixed Wireless installations
- July 5, 2025. Implemented router-based pricing for Fixed Wireless: installation hours now calculated as (router count × 2 hours) + 1 labor hold hour, added dedicated "Labor hold for possible overage, returned if unused in final billing" line item with proper database schema and display integration
- July 5, 2025. Updated pricing to 1 base hour for all services: Fixed Wireless (router count × 1 hour), Fleet Tracking (1 hour), Fleet Camera (1 hour), all with +1 labor hold hour, ensured Labor Hold service item displays in both web interface and PDF quotes
- July 5, 2025. Completely redesigned PDF quote generator for compact 1-2 page layout: reduced margins, smaller fonts, compressed sections, added debug logging for Labor Hold line, renamed to "Labor Hold - Overage Reserve" for clarity
- July 5, 2025. Fixed critical Fleet form input issues: completely rewrote Fleet Tracking and Fleet Camera forms with simplified state management using onBlur saves instead of real-time updates, eliminated useFormInput hook conflicts, resolved TypeScript errors, and implemented local state management to prevent digit deletion and cursor jumping during data entry
- July 5, 2025. Enhanced Fleet Tracking form with comprehensive field updates: changed "Site Address" to "Billing Address", added Transportation/Logistics, Finance, Construction to Industry Type, renamed "Fleet Size" to "Number of Vehicles for Installation", added "Total Number of Vehicles in Fleet", replaced Coverage Area with dynamic Year/Make/Model vehicle details, renamed "Primary Service Location" to "Installation Site Address", added Tracker Type dropdown (Vehicle/Asset/Slap & Track), removed Asset Tracker from Installation Type, added IoT Tracking Partner dropdown (GeoTab, Zenduit, Spireon, etc.), added Carrier Sim dropdown (T-Mobile, Verizon, AT&T, Wholesale), removed feature checkboxes and Reporting Frequency field
- July 5, 2025. Implemented dynamic vehicle detail collection: Fleet Tracking form now creates the same number of Year/Make/Model sets as specified in "Number of Vehicles for Installation" field, with vehicle details preserved when count changes and helpful visual indicators
- July 5, 2025. Updated Fleet Tracking pricing logic for OBD Port Installation efficiency: 1 base hour covers up to 3 vehicles for OBD installations (1-3 vehicles = 1 hour, 4-6 vehicles = 2 hours), other installation types remain 1 hour per vehicle, maintains +1 labor hold hour for all installations
- July 6, 2025. Added comprehensive Fleet Tracker Equipment Installation Statement of Work to both web quote display and PDF generation: includes detailed 4-step installation process (Pre-Installation Check, Device Installation, Cable Management, Functionality Verification), estimated 20-minute per vehicle timeframe, and complete scope of work documentation for OBD-II port installations
- July 6, 2025. Optimized PDF layout for readability and space efficiency: fixed text overlapping issues by adjusting line spacing from 10-12pt to 12-18pt, improved table row spacing, properly separated information sections, and ensured all PDFs fit within 3 pages maximum while maintaining clear readability
- July 6, 2025. Redesigned Fleet Camera "Camera Features Required" section to "Camera Solution Detail": replaced checkboxes with Camera Solution Type dropdown (Driver Facing, Front Facing, Driver/Front Combo, Rear Facing, Trailer, Aux/Multi camera system), added Number of Cameras numeric field, changed Recording Mode to "Removal of existing solution needed?" Yes/No dropdown, updated Audio Recording to "Existing Camera Solution" with 15 provider options (GeoTab, Zenduit, Fleethoster, Verizon Connect, Samsara, Lytx, Motive, Azuga, Teletrac, Tenna, AirIQ, Smart Witness, GPS Insight, Linxup, Other), added conditional "Other Solution Details" text field, implemented conditional logic to show existing solution fields only when removal is needed
- July 6, 2025. Updated Fleet Camera pricing calculation: base pricing of 1 hour per vehicle includes 1 camera per vehicle, additional cameras beyond 1 per vehicle add 0.5 hours each (e.g., 3 vehicles with 5 cameras = 4 hours total), added database schema fields for cameraSolutionType, numberOfCameras, removalNeeded, existingCameraSolution, and otherSolutionDetails
- July 6, 2025. Fixed Fleet Camera removal costs display: added removalHours and removalCost fields to quotes database schema, updated quote creation and data retrieval to include removal costs, fixed storage query to properly retrieve all quote fields for PDF generation, updated labor hold title to "Labor Hold, Final bill Return" in both web interface and PDF quotes, confirmed "Existing System Removal" line item appears correctly in both web quotes and PDF downloads when removal is needed
- July 6, 2025. Added comprehensive Fleet Camera Statement of Work to both web quote display and PDF generation: includes detailed installation procedures (Pre-Installation Check, Dashcam Installation, External Camera Installation, Fleet Tracker Installation), functionality verification steps, post-installation cleanup, and estimated time per vehicle with component variations, statement appears only on Fleet Camera quotes with optimized PDF spacing to prevent text overlapping while maintaining single-page format
- July 6, 2025. Implemented quote deletion functionality: added deleteQuote method to storage interface, created DELETE /api/quotes/:id endpoint with ownership verification, added delete quote mutation to dashboard with error handling and confirmation dialog, users can now delete old quotes using red trash icon in actions column with confirmation prompt
- July 6, 2025. Added conditional Statement of Work for Fixed Wireless assessments: displays when connection usage is "primary" AND signal strength is "3-bars" (triggering lowSignalAntennaCable question) AND antenna cable is selected "yes", includes comprehensive installation procedures for coaxial cable work, router configuration, and testing, appears in both web quote display and PDF generation with proper formatting
- July 6, 2025. Optimized Fixed Wireless Statement of Work PDF formatting: improved line spacing and readability with condensed bullet points, organized into 4 clear sections (Preparation, Cable Installation, Termination, Configuration), reduced font sizes for better space utilization while maintaining excellent readability, ensures single-page format with proper spacing between sections
- July 6, 2025. Fixed PDF text overlapping issues in Fixed Wireless Statement of Work: significantly increased line spacing from 10-12pt to 14-20pt between sections and bullet points, added lineGap property for multiline text, expanded major section spacing to 20-25pt, enhanced bullet point separation to 14pt for clear readability without text overlap

## User Preferences

Preferred communication style: Simple, everyday language.