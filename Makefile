# ===========================================
# Lernello - Commandes de développement
# ===========================================

.PHONY: help dev build up down logs shell clean install

help:
	@echo "Commandes disponibles:"
	@echo "  make dev      - Démarre l'environnement de développement"
	@echo "  make build    - Build les images Docker"
	@echo "  make up       - Démarre les conteneurs en arrière-plan"
	@echo "  make down     - Arrête les conteneurs"
	@echo "  make logs     - Affiche les logs"
	@echo "  make shell    - Ouvre un shell dans le conteneur app"
	@echo "  make install  - Installe les dépendances"
	@echo "  make clean    - Nettoie les conteneurs et volumes"
	@echo "  make test     - Lance les tests"
	@echo "  make lint     - Lance le linter"

dev:
	docker compose up --build

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

shell:
	docker compose exec app sh

install:
	docker compose exec app pnpm install

clean:
	docker compose down -v --rmi local
	rm -rf node_modules .next

test:
	docker compose exec app pnpm test

lint:
	docker compose exec app pnpm lint

type-check:
	docker compose exec app pnpm type-check

db-push:
	docker compose exec app pnpm db:push

db-studio:
	@echo "Utilisez Supabase Studio via le dashboard ou MCP"
