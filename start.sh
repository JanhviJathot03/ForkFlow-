#!/bin/bash

# Locus Agents - Quick Start Script

echo "🚀 Locus Agents - Setup & Start"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker: https://docker.com"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your credentials:"
    echo "   - LOCUS_API_KEY"
    echo "   - LOCUS_API_SECRET"
    echo "   - ETHEREUM_RPC_URL"
fi

# Create .env.local for frontend if it doesn't exist
if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
fi

echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "✅ Services started!"
echo ""
echo "📍 URLs:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:5000"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "📊 Check logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
