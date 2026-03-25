#!/bin/bash

# JHCIS Central Hub - Quick Deployment Script
# Run this on your server: curl -fsSL https://your-domain/deploy.sh | bash

set -e

echo "=========================================="
echo "JHCIS Central Hub - Deployment Script"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create directory
echo "Creating directory..."
sudo mkdir -p /opt/jhcis-central-hub
cd /opt/jhcis-central-hub

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32)
    API_KEY_SALT=$(openssl rand -hex 16)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    sed -i "s/change_this_jwt_secret_key/$JWT_SECRET/g" .env
    sed -i "s/change_this_api_key_salt/$API_KEY_SALT/g" .env
    sed -i "s/change_this_db_password/$DB_PASSWORD/g" .env
    
    echo "Generated secure passwords in .env file"
    echo "Please save these credentials!"
fi

# SSL Setup (Let's Encrypt)
echo "Setting up SSL..."
if [ ! -f nginx/ssl/cert.pem ]; then
    echo "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot
    
    echo "Getting SSL certificate..."
    sudo certbot certonly --standalone -d ubonlocal.phoubon.in.th --non-interactive --agree-tos --email admin@phoubon.in.th
    
    mkdir -p nginx/ssl
    sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/privkey.pem nginx/ssl/key.pem
    sudo chown -R $USER:$USER nginx/ssl
fi

# Build and start
echo "Building and starting containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check health
echo "Checking health..."
curl -f http://localhost:9021/health || echo "API not ready yet, waiting..."
sleep 5
curl -f http://localhost:9021/health || echo "API still starting..."

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Access the API at: http://ubonlocal.phoubon.in.th/api/v1"
echo ""
echo "Important:"
echo "1. Save your .env file credentials"
echo "2. Configure firewall to allow ports 80 and 443"
echo "3. Add health facilities via admin API"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f api     # View API logs"
echo "  docker-compose logs -f mysql   # View database logs"
echo "  docker-compose restart api     # Restart API"
echo "  docker-compose down            # Stop all services"
echo "  docker-compose up -d           # Start all services"
echo ""