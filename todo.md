# Wakala EMS - Project TODO

## Core Features
- [x] Database schema for clients, agents, documents, settings tables
- [x] App Shell with RTL Arabic interface
- [x] Login page with access code (BAREQ2030)
- [x] Dashboard with analytics and statistics
- [x] Client list page with search and filters
- [x] Add/Edit client form
- [x] Client details page
- [x] Financial calculations (Total = Area × Price × 1.20, Agent Revenue = Total × success_fee%)
- [x] Status management workflow
- [x] WhatsApp templates management in Settings
- [x] Settings page with master key protection (RAJ0579)
- [x] Auto-generated ref_code (RSAxxx format)

## Agent Management
- [x] Agent list in Settings
- [x] Add/Edit/Delete agents
- [ ] Hijri/Gregorian date picker for birth dates

## Documents Management
- [ ] Documents tab in client details
- [ ] Fixed document types (6 types)
- [ ] Dynamic "Other Documents" section
- [ ] File upload to S3 storage

## UI/UX Requirements
- [x] RTL support for Arabic interface
- [x] Responsive design (Mobile-first)
- [x] Professional color scheme
- [x] Status badges with colors
- [x] Data tables with sorting and filtering

## Export Features
- [x] Export clients to Excel

## Navigation Update (New Request)
- [x] Bottom navigation bar with icons (Home, Clients, Reports, Statistics, Map)
- [x] Update slide menu to include all navigation items
- [x] Add "RSA Apps" section in slide menu
- [x] Create Reports page
- [x] Create Statistics page
- [x] Create Map page
- [x] Create RSA Apps page

## Statistics Page Improvement (New Request)
- [x] Change statistics cards to graphical representation
- [x] Display cards in 2 columns layout
- [x] Optimize font and number sizes for better display

## Dashboard Page Improvement (New Request)
- [x] Update dashboard cards to 2 columns layout like Statistics page

## Dashboard Progress Bar Fix (New Request)
- [x] Remove 100% filled progress bar from total clients card
- [x] Keep progress bars only for percentage-based metrics

## Status List Update (New Request)
- [x] Update database schema with new status enum values
- [x] Update server routers with new status labels
- [x] Update Dashboard page with new statuses
- [x] Update Statistics page with new statuses
- [x] Update ClientList page with new statuses
- [x] Update ClientForm page with new statuses
- [x] Update ClientDetails page with new statuses
- [x] Update Reports page with new statuses
- [x] Migrate existing data to new status values

## Date System Refactor - Umm al-Qura Calendar (Critical Fix)
- [x] Install islamic-umalqura calendar library (@umalqura/core)
- [x] Create date conversion utilities using Umm al-Qura system
- [x] Create Dual-Calendar Date Picker component with Gregorian/Hijri toggle
- [x] Store all dates in Gregorian ISO 8601 format (UTC) in database
- [x] Update ClientForm to use new date picker
- [x] Update Settings/Agents form to use new date picker
- [x] Update all date display components to show correct Hijri dates
- [x] Add validation test: 1976-02-18 (Gregorian) = 1396-02-18 (Hijri)
- [x] Fix the 2-day drift issue in date conversion

## DualDatePicker Year Range Fix (Bug Fix)
- [x] Fix year range validation in DualDatePicker (Hijri years must be 1318-1500)
- [x] Add error handling for out-of-range dates

## Date System Complete Refactor (URGENT)
- [x] Fix Umm al-Qura conversion algorithm (verified: library works correctly)
- [x] Fix DatePicker CSS overflow issue
- [x] Remove dual-date display from table cells
- [x] Add Global Calendar Toggle in App Header
- [x] Show only ONE date format based on toggle

## DualDatePicker Wiring Fix (URGENT)
- [x] Fix DualDatePicker to use gregorianToHijri from dateUtils.ts
- [x] Remove internal conversion logic and use shared functions
- [x] Fix timezone shift issue in handleDaySelect (use local date instead of UTC)

## Date Save Issue Fix (Bug Report)
- [x] Fix date losing 1 day when saving to database
- [x] Check server-side date handling in routers.ts
- [x] Ensure date is stored correctly without timezone conversion

## Final App Refactoring (Comprehensive Update)

### Database & Schema Cleanup
- [x] DELETE completion_percentage from clients table (not in schema)
- [x] DELETE agency_type from clients table
- [x] ADD agency_date to clients table
- [x] Verify agents table has birth_date, national_id, mobile

### Dynamic Property Form (Polymorphic UI)
- [x] Add property_document_type field (Deed/Ihkam/Revivals/Other)
- [x] Option A (Deed): deed_number, deed_date, city, map_link
- [x] Option B (Ihkam): request_number, request_date, city, map_link
- [x] Option C (Revivals): description, city, map_link
- [x] Option D (Other): description, city, map_link
- [x] Implement dynamic form switching in ClientForm

### WhatsApp Template Fix
- [x] Add agent birth_date to WhatsApp message generator
- [x] Include Name, ID, DOB, Mobile in agent template

### Navigation & Modules
- [x] Rename "RSA Applications" to "Archive" (الأرشيف)
- [x] Update Map screen with interactive Google Maps
- [x] Show client pins based on location

### UI Refinements
- [x] Keep Area and Expected Price editable
- [x] Fix date display toggle (single date based on toggle)

## Extract Coordinates from Google Maps Links (New Feature)
- [x] Add latitude/longitude columns to clients table
- [x] Create extractCoordinates utility function
- [x] Auto-extract coordinates on client save/update
- [ ] Backfill existing data with coordinates (will happen on next save)
- [x] Update map to display markers from coordinates
- [x] Add visual feedback in form for coordinate extraction

## Bug Fixes
- [x] Fix Google Maps API loaded multiple times error on /map page
