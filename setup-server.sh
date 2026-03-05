#!/bin/bash
# Server Setup Script for Radar Deployment
# Run this on your Ubuntu server (54.254.174.153)

set -e  # Exit on error

echo "=== Starting Radar Server Setup ==="

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
rm get-docker.sh

# Install Docker Compose
echo "Installing Docker Compose..."
sudo apt-get install -y docker-compose

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Configure UFW firewall
echo "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Application
sudo ufw status verbose

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /opt/radar
sudo chown ubuntu:ubuntu /opt/radar

# Create deployment user (if needed)
echo "Setting up deployment environment..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Install nginx (optional, for reverse proxy)
echo "Installing nginx..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create systemd service for auto-restart
echo "Creating systemd service..."
sudo tee /etc/systemd/system/radar.service > /dev/null <<'EOF'
[Unit]
Description=Radar Intelligence Dashboard
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/radar
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable radar.service

# Create deployment script
echo "Creating deployment script..."
tee /opt/radar/deploy.sh > /dev/null <<'EOF'
#!/bin/bash
set -e

echo "=== Deploying Radar ==="

cd /opt/radar

# Pull latest code
echo "Pulling latest code from GitHub..."
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
else
    git clone https://github.com/Syntax-Error-1337/radar.git .
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Rebuild and start
echo "Building and starting containers..."
docker-compose up -d --build

# Show logs
echo "=== Deployment complete! ==="
docker-compose ps
docker-compose logs --tail=50

echo ""
echo "Application is running at http://54.254.174.153:3001"
EOF

chmod +x /opt/radar/deploy.sh

echo ""
echo "=== Server Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Copy your .env file to /opt/radar/server/.env"
echo "2. Run: /opt/radar/deploy.sh"
echo "3. Check status: docker ps"
echo "4. View logs: docker logs -f radar"
echo ""
echo "IMPORTANT: Logout and login again for Docker group changes to take effect!"
