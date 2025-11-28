#!/bin/bash
# PsyFi Deployment Helper Script
# Applied Alchemy Labs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║      PsyFi Deployment Assistant        ║"
    echo "║   Applied Alchemy Labs - ABX-Core v1.3 ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_info "Checking dependencies..."

    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi

    if ! command -v pip &> /dev/null; then
        print_error "pip is not installed"
        exit 1
    fi

    print_success "Dependencies check passed"
}

# Local deployment
deploy_local() {
    print_info "Starting local deployment..."

    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install -e . > /dev/null 2>&1
    print_success "Dependencies installed"

    # Create .env if not exists
    if [ ! -f .env ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_success ".env created (please configure before running)"
    fi

    # Run tests
    print_info "Running tests..."
    if python -m pytest -xvs > /dev/null 2>&1; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi

    # Start server
    print_success "Local deployment complete!"
    echo ""
    print_info "To start the server, run:"
    echo "  cd psyfi_api"
    echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    print_info "Then visit: http://localhost:8000"
}

# Docker deployment
deploy_docker() {
    print_info "Starting Docker deployment..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Build image
    print_info "Building Docker image..."
    docker build -t psyfi:latest . > /dev/null 2>&1
    print_success "Docker image built"

    # Run container
    print_info "Starting container..."
    docker run -d \
        --name psyfi \
        -p 8000:8000 \
        -e ENVIRONMENT=production \
        psyfi:latest > /dev/null 2>&1
    print_success "Container started"

    echo ""
    print_success "Docker deployment complete!"
    print_info "Container running at: http://localhost:8000"
    print_info "View logs: docker logs -f psyfi"
    print_info "Stop container: docker stop psyfi"
}

# Docker Compose deployment
deploy_compose() {
    print_info "Starting Docker Compose deployment..."

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    # Stop existing containers
    print_info "Stopping existing containers..."
    docker-compose down > /dev/null 2>&1 || true

    # Build and start
    print_info "Building and starting services..."
    docker-compose up -d --build > /dev/null 2>&1
    print_success "Services started"

    echo ""
    print_success "Docker Compose deployment complete!"
    print_info "Services running at: http://localhost:8000"
    print_info "View logs: docker-compose logs -f"
    print_info "Stop services: docker-compose down"
}

# Production checks
production_checks() {
    print_info "Running production readiness checks..."

    local errors=0

    # Check .env file
    if [ ! -f .env ]; then
        print_error ".env file not found"
        ((errors++))
    else
        # Check for default values
        if grep -q "change-me-in-production" .env; then
            print_error "SECRET_KEY still has default value"
            ((errors++))
        fi
        print_success ".env file exists"
    fi

    # Check tests
    print_info "Running test suite..."
    if python -m pytest -xvs > /dev/null 2>&1; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        ((errors++))
    fi

    # Check Docker build
    if command -v docker &> /dev/null; then
        print_info "Testing Docker build..."
        if docker build -t psyfi:test . > /dev/null 2>&1; then
            print_success "Docker build successful"
            docker rmi psyfi:test > /dev/null 2>&1
        else
            print_error "Docker build failed"
            ((errors++))
        fi
    fi

    echo ""
    if [ $errors -eq 0 ]; then
        print_success "Production checks passed! Ready to deploy."
    else
        print_error "Production checks failed ($errors errors)"
        exit 1
    fi
}

# Main menu
show_menu() {
    print_header
    echo "Select deployment option:"
    echo ""
    echo "1) Local development"
    echo "2) Docker (single container)"
    echo "3) Docker Compose"
    echo "4) Production checks"
    echo "5) Exit"
    echo ""
    read -p "Enter choice [1-5]: " choice

    case $choice in
        1) deploy_local ;;
        2) deploy_docker ;;
        3) deploy_compose ;;
        4) production_checks ;;
        5) exit 0 ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Run
check_dependencies
show_menu
