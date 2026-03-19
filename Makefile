.PHONY: dev build up down restart logs migrate seed fresh shell clean prod prod-down prod-restart prod-logs prod-fresh setup

# Local development
dev:
	node ace serve --hmr

build:
	node ace build

migrate:
	node ace migration:run

seed:
	node ace db:seed

fresh:
	node ace migration:fresh
	node ace db:seed

# Docker (dev)
up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f app

shell:
	docker compose exec app sh

# Docker (production)
prod:
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-restart:
	docker compose -f docker-compose.prod.yml restart

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f app

prod-fresh:
	docker compose -f docker-compose.prod.yml down -v
	docker compose -f docker-compose.prod.yml up -d --build

# Clean
clean:
	docker compose down -v
	rm -rf tmp/db.sqlite3 build node_modules

# Full setup (first time)
setup:
	npm install --legacy-peer-deps
	node ace migration:run
	node ace db:seed
	@echo "Ready! Run 'make dev' or 'make up' for Docker (port 5080)"

# Docker fresh reset (dev)
docker-fresh:
	docker compose down -v
	docker compose up -d --build
