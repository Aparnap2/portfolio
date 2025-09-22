#!/bin/bash

echo "🚀 Setting up Lead Enrichment & Routing AI System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please add your API keys"
fi

# Start PostgreSQL with Docker
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Test the system
echo "🧪 Running system test..."
npm test

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your GOOGLE_API_KEY to .env file"
echo "2. Run 'npm start' to start the system"
echo "3. Visit http://localhost:3001/api/dashboard for API"
echo "4. Visit http://localhost:3000/leads for web dashboard"
