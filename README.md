# HealthCare Support - Patient Management System

## Objective

We are building a digital ecosystem that connects healthcare transformation, streamline patient care and influence compassion into every interaction.

## Features

- 🏥 Modern hospital management interface
- 👥 Patient management system
- 📅 Appointment scheduling
- 📋 Medical records tracking
- 🔐 Role-based access control
- 🎨 Clean, professional UI with hospital theme

## User Types

**Super admin** - All access including profile creation for somebody else and manage it.

**Doctors** - View patient medical chart, edit patient medical chart

**Nurses** - View patient medical chart, edit patient medical chart

**Receptionist** - View patient medical chart, add/update/delete patient profiles, no access to edit patient medical chart

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn-inspired components
- **Icons**: Lucide React

## Design Theme

The application features a professional hospital management theme with:

- **Colors**: 
  - Primary: Medical blue (#1890ff)
  - Success: Health green (#52c41a)
  - Warning: Attention yellow (#faad14)
  - Danger: Critical red (#f5222d)
  - Neutral: Professional grays

- **Typography**:
  - Sans-serif: Inter for body text
  - Display: Poppins for headings
  - Clean, readable fonts optimized for medical data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database features) - **Optional for demo mode**

### Installation

1. Clone the repository:
```bash
git clone https://github.com/josiebhai/hc-support.git
cd hc-support
```

2. Install dependencies:
```bash
npm install
```

3. **Choose your mode:**

   **Option A: Demo Mode (No Supabase required)**
   
   The application includes a demo mode for testing the user management interface without setting up Supabase.
   
   Demo credentials:
   - Super Admin: `admin@healthcare.com` (any password)
   - Doctor: `doctor@healthcare.com` (any password)
   - Nurse: `nurse@healthcare.com` (any password)
   - Receptionist: `receptionist@healthcare.com` (any password)

   Simply run:
   ```bash
   npm run dev
   ```

   **Option B: Full Supabase Integration**
   
   For production use with real database:
   
   a. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   b. Configure your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   c. Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md) to configure your database

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
hc-support/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── badge.tsx
│   │   └── Layout.tsx    # Main layout component
│   ├── lib/
│   │   ├── supabase.ts   # Supabase client configuration
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env.example          # Environment variables template
└── package.json
```

## Supabase Integration

The application is pre-configured to work with Supabase. To enable full database features:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your credentials
4. The app will automatically connect to your Supabase instance

## Contributing

This is a private project. For any issues or suggestions, please contact the project maintainers.

## License

Private - All rights reserved
