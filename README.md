# Vermont Off-Market Property Finder

A data-driven platform for identifying off-market real estate investment opportunities in Vermont's Northeast Kingdom (Caledonia, Orleans, and Essex Counties).

## Overview

This MVP helps investors, brokers, builders, and developers find properties that are not currently listed but show objective public-record signals suggesting the owner may be receptive to an approach.

## Features

### Database Schema

- **Parcels**: Property details including location, acreage, assessed values, year built, and coordinates
- **Owners**: Owner information with mailing addresses, ownership type classification, and absentee flags
- **Transfers**: Sale history with ownership duration calculations
- **Constraints**: Environmental and regulatory flags (floodplain, wetlands, Current Use, etc.)
- **Scores**: Multi-dimensional scoring for investment potential

### Scoring Model

#### Sale Likelihood Score (0-100)

Objective signals only:
- Ownership tenure (20, 30, 40+ years)
- Out-of-state mailing address
- Warm state bonus (FL, AZ, NC, SC)
- Trust, estate, LLC, or corporate ownership

#### Investment Potential Scores (0-100)

- **Flip Score**: Low building-to-land ratio, older structures, proximity to strong markets
- **Rental Score**: Multi-family properties, job center proximity, lower acquisition cost
- **Development Score**: Acreage, road frontage, minimal constraints, village proximity

#### Overall Opportunity Score

Weighted combination:
- 40% sale likelihood
- 30% investment upside
- 20% strategy fit
- -10% legal complexity

### Search & Filtering

- County and town filters
- Minimum acreage
- Out-of-state owner flag
- Ownership tenure (20/30/40+ years)
- Owner type (individual, trust, estate, LLC, corporation)
- Strategy scores (development, rental, flip)
- Constraint exclusions (floodplain, wetlands)
- Current Use enrollment filter

### AI Explanations

The AI layer explains the data without inventing scores. Each property can generate a detailed explanation covering:
- Why it ranks highly based on objective signals
- Suitable investment strategies
- Required due diligence steps
- Notable considerations and risks

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: SQLite with Prisma ORM
- **Scoring**: Custom TypeScript algorithms

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Database Setup

The database is already initialized. To reset and reseed:

```bash
npm run seed
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Data Sources

This MVP uses sample data structured for:
- Vermont Grand List (2025)
- Vermont GIS parcel data
- Vermont property transfer records (back to 1986)
- Floodplain, wetlands, and conservation layer data

## Product Roadmap

### Phase 1: MVP (Current)
- ✅ Database schema
- ✅ Scoring algorithms
- ✅ Search interface
- ✅ Property cards with details
- ✅ AI explanations

### Phase 2: First Paid Product
- Monthly reports:
  - Top 25 ownership-transition candidates
  - Top 25 development candidates  
  - Top 25 rental candidates
  - Top 25 flip candidates
  - Town-by-town watchlist

### Phase 3: Real Data Integration
- Vermont Grand List API integration
- GIS parcel data pipeline
- Transfer history automation
- Constraint layer imports

### Phase 4: Expanded Features
- Map visualization
- Custom saved searches
- Email alerts for new matches
- Comp analysis tools
- Export to CSV/PDF

## Pricing Strategy (Future)

- $49/month: PDF report
- $149/month: Spreadsheet with filters
- $499/month: Custom county/town lead lists with API access

## Legal & Compliance

This tool is for informational purposes only. All data must be independently verified. Users are responsible for:
- Title examination
- Zoning and land use verification
- Environmental due diligence
- Current Use penalty calculations
- Access and frontage confirmation
- Wastewater feasibility

## Contributing

This is a closed MVP. Data contributions and accuracy improvements are welcome via pull request.

## License

Proprietary - All Rights Reserved
