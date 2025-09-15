# Rural Schools Automated Attendance System

## Overview

This is a full-stack automated attendance management system designed specifically for rural schools. The application provides multiple attendance tracking methods including facial recognition, RFID card scanning, and manual entry. It features role-based access control for administrators and teachers, offline capabilities through PWA support, and comprehensive reporting tools. The system is built to work reliably in areas with limited internet connectivity while providing modern attendance management features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Support**: Service Worker implementation for offline functionality and app-like experience
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Management**: Express-session with configurable storage backends
- **File Uploads**: Multer middleware for handling student photos and documents
- **API Structure**: RESTful endpoints organized by resource (students, attendance, reports, teachers)

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL) for cloud deployment
- **Offline Storage**: IndexedDB and LocalStorage for PWA offline data synchronization
- **Schema Design**: Normalized database structure with separate tables for users, students, attendance records, and classes
- **Migrations**: Drizzle Kit for database schema migrations and version control

### Authentication and Authorization
- **Authentication Method**: JWT-based login with session management
- **User Roles**: Two-tier system with Admin (Headmaster) and Teacher roles
- **Session Security**: HTTP-only cookies with configurable expiration and CSRF protection
- **Password Security**: Scrypt-based password hashing with salt for secure storage
- **Route Protection**: Client-side route guards and server-side middleware for access control

### Attendance System Features
- **Multiple Tracking Methods**: 
  - Facial Recognition using browser camera APIs with face detection libraries
  - RFID card scanning for contactless attendance
  - Manual attendance marking with bulk operations
- **Real-time Processing**: Live camera feed processing for facial recognition
- **Offline Support**: Local storage of attendance data with background sync when online
- **Validation**: Cross-reference student enrollment and class schedules before marking attendance

### Progressive Web App (PWA) Features
- **Offline Functionality**: Service Worker caching for app shell and critical resources
- **Background Sync**: Queue attendance data for upload when connection is restored
- **App Installation**: Web app manifest for home screen installation on mobile devices
- **Responsive Design**: Mobile-first design that works across all device sizes
- **Performance**: Code splitting and lazy loading for optimal performance on slow networks

## External Dependencies

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management
- **Connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Frontend Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: SVG icon library for consistent iconography
- **React Hook Form**: Performant form library with validation
- **TanStack Query**: Server state management and caching

### Authentication and Security
- **Passport.js**: Authentication middleware with multiple strategy support
- **Express Session**: Session management for user authentication
- **Crypto Module**: Node.js built-in module for password hashing and security

### File Handling and Media
- **Multer**: Express middleware for multipart/form-data file uploads
- **Web APIs**: Camera API and MediaDevices for facial recognition features

### Development and Build Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Static type checking for both frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### PWA and Offline Support
- **Service Worker**: Browser API for offline caching and background sync
- **IndexedDB**: Browser database for offline data storage
- **Web App Manifest**: PWA configuration for app installation

### Potential Future Integrations
- **Face-api.js**: JavaScript facial recognition library for browser-based face detection
- **SMS Gateway**: Third-party service for sending attendance notifications to parents
- **PDF Generation**: Library for generating attendance reports and certificates
- **Email Service**: SMTP integration for automated notifications and reports