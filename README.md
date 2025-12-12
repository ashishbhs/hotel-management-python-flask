# Hotel Management System - Python Flask

A professional hotel management application built with Python Flask and modern web technologies.

## Features

- Guest management with profiles and booking history
- Room inventory with availability tracking
- Booking system with conflict detection
- Real-time dashboard with statistics
- Responsive design for all devices

## Technology Stack

- **Backend**: Python Flask (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, JavaScript
- **Deployment**: Vercel
- **Validation**: Marshmallow

## Quick Start

### Prerequisites

- Python 3.9+
- Supabase account
- Vercel account

### Installation

1. Clone the repository

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   ```bash
   copy .env.example .env
   # Add your Supabase credentials to .env
   ```

6. Set up database:
   - Use the SQL schema from the original project's `scripts/setup-db.sql`
   - Run it in your Supabase SQL editor

### Local Development

For local testing, you can use Flask's development server:

```bash
# Install Flask development dependencies
pip install flask

# Create a simple dev server (app.py)
# Then run:
python app.py
```

Or use Vercel CLI for local testing:

```bash
npm install -g vercel
vercel dev
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key (optional)

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Connect your repository to Vercel:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

4. Deploy:
   ```bash
   vercel --prod
   ```

### Manual Deployment

```bash
vercel --prod
```

## API Endpoints

- `GET /api/guests` - List all guests
- `POST /api/guests` - Create new guest
- `DELETE /api/guests?id=<id>` - Delete guest
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms?id=<id>` - Update room
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings?id=<id>&action=checkin` - Check in guest
- `PUT /api/bookings?id=<id>&action=checkout` - Check out guest
- `DELETE /api/bookings?id=<id>` - Cancel booking

## Project Structure

```
hotel-management-python-flask/
├── api/
│   ├── __init__.py
│   ├── guests.py       # Guest management API
│   ├── rooms.py        # Room management API
│   └── bookings.py     # Booking management API
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── utils.js
├── templates/
│   └── index.html
├── requirements.txt
├── vercel.json
├── .env.example
└── README.md
```

## Security Features

- CORS protection
- Input validation using Marshmallow
- Environment variable management
- Supabase Row Level Security (RLS)

## Differences from Node.js Version

- **Runtime**: Python 3.9+ instead of Node.js
- **Framework**: Flask instead of Express
- **Validation**: Marshmallow instead of Joi
- **Deployment**: Uses `@vercel/python` instead of `@vercel/node`
- **API Structure**: Serverless functions with `handler()` entry point

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
