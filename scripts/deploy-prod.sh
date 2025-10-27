#!/bin/bash

# Production Deployment Script
# ============================================
set -e

# Configuration
APP_NAME="audit-app"
DOCKER_REGISTRY="your-registry.com"
DOCKER_TAG="latest"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting production deployment...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.production

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "NEXT_PUBLIC_APP_URL"
    "SENTRY_DSN"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Checking $service_name health...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "$service_name.*Up"; then
            echo -e "${GREEN}$service_name is healthy${NC}"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}$service_name failed to start after $max_attempts attempts${NC}"
            return 1
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts...${NC}"
        sleep 2
        ((attempt++))
    done
    
    return 1
}

# Function to deploy with rollback on failure
deploy_with_rollback() {
    local previous_tag=$1
    
    # Get current running tag
    if docker-compose ps | grep -q "app.*Up"; then
        previous_tag=$(docker-compose images | grep "$APP_NAME" | awk '{print $2}' | head -1)
    fi
    
    echo -e "${YELLOW}Deploying with rollback support...${NC}"
    
    # Deploy with rollback strategy
    docker-compose up -d --no-deps app \
        --update-parallelism 1 \
        --rollback-on-failure \
        --rollback-timeout 60s \
        --previous-image-tag "$previous_tag" || {
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Deployment successful!${NC}"
            
            # Health check
            sleep 10
            if check_service_health "app"; then
                echo -e "${GREEN}All services are healthy${NC}"
            else
                echo -e "${RED}Health check failed${NC}"
                docker-compose logs app
                exit 1
            fi
        else
            echo -e "${RED}Deployment failed${NC}"
            docker-compose logs app
            exit 1
        fi
    }
}

# Function to get current version
get_current_version() {
    if docker-compose ps | grep -q "app.*Up"; then
        docker-compose images | grep "$APP_NAME" | awk '{print $2}' | head -1
    else
        echo "unknown"
    fi
}

# Function to backup current deployment
backup_deployment() {
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    echo -e "${YELLOW}Creating backup...${NC}"
    
    # Backup environment file
    cp .env.production "$backup_dir/.env.production"
    
    # Backup database
    docker-compose exec -T postgres pg_dump -U postgres -d audit_app_prod > "$backup_dir/database_$(date +%Y%m%d_%H%M%S).sql"
    
    # Backup Docker Compose file
    cp docker-compose.prod.yml "$backup_dir/docker-compose.prod.yml"
    
    echo -e "${GREEN}Backup created: $backup_dir${NC}"
}

# Main deployment logic
main() {
    echo -e "${GREEN}Current version: $(get_current_version)${NC}"
    
    # Create backup
    backup_deployment
    
    # Stop existing services
    echo -e "${YELLOW}Stopping existing services...${NC}"
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images
    echo -e "${YELLOW}Pulling latest images...${NC}"
    docker-compose -f docker-compose.prod.yml pull
    
    # Deploy with rollback
    deploy_with_rollback
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Handle script interruption
trap 'echo -e "${RED}Deployment interrupted${NC}"; docker-compose -f docker-compose.prod.yml down; exit 1' INT

# Run main function
main "$@"