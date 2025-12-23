.PHONY: help up down restart logs clean seed reset test test-concurrency install build

help: ## Show this help message
	@echo "cstl-stripe-clone - Subscription Management System"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services with Docker Compose
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo "MongoDB: localhost:27017"
	@echo "Redis: localhost:6379"

down: ## Stop all services
	docker-compose down
	@echo "✅ Services stopped"

restart: ## Restart all services
	docker-compose restart
	@echo "✅ Services restarted"

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

clean: ## Stop services and remove volumes (CAUTION: deletes all data)
	docker-compose down -v
	@echo "⚠️  All data removed"

install: ## Install dependencies for backend and frontend
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed"

seed: ## Seed database with sample data
	cd backend && npm run seed

reset: ## Reset database (delete all data)
	cd backend && npm run reset

test: ## Run backend tests
	cd backend && npm test

test-concurrency: ## Run critical concurrency test
	@echo "🧪 Running concurrency test..."
	@echo "Make sure backend is running (make up or npm run dev)"
	@sleep 2
	cd backend && npm run test:concurrency

dev-backend: ## Run backend in development mode (without Docker)
	cd backend && npm run dev

dev-frontend: ## Run frontend in development mode (without Docker)
	cd frontend && npm run dev

build: ## Build for production
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "✅ Build complete"

status: ## Show status of all services
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-mongo: ## Open MongoDB shell
	docker-compose exec mongodb mongosh cstl-stripe-clone

backup-db: ## Backup MongoDB database
	@echo "Creating backup..."
	docker-compose exec -T mongodb mongodump --db cstl-stripe-clone --out /tmp/backup
	docker cp cstl-stripe-clone-mongo:/tmp/backup ./backup_$(shell date +%Y%m%d_%H%M%S)
	@echo "✅ Backup created"

# Quick start for first time setup
setup: install up seed ## Complete first-time setup
	@echo ""
	@echo "🎉 Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Visit http://localhost:5173 to use the app"
	@echo "  2. Run 'make test-concurrency' to verify system correctness"
	@echo "  3. Check 'make help' for more commands"
