
#debug flags:
#a for all debugging (same as make -d and make --debug).
#b for basic debugging.
#v for slightly more verbose basic debugging.
#i for implicit rules.
#j for invocation information.
#m for information during makefile remakes.
DOCKER = docker
MAKEFLAGS += --no-print-directory -s
#MAKEFLAGS += --debug=v
# MAKEFLAGS += -s
include .env
export $(shell sed 's/=.*//' .env)
.DEFAULT_GOAL := help
#.PHONY: all
ARG=$(filter-out $@, $(MAKECMDGOALS))

define EXEC
    $(DOCKER) exec -w / $(DB_CONTAINER_NAME) $(1)
endef

MARIADB = $(call EXEC, mariadb -u root -p"root" --show-warnings -vvv -t)


prod: ## Launch production environment via Docker
	docker compose -f docker-compose.prod.yml up --build --remove-orphans --force-recreate -d

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker compose -f docker-compose.prod.yml logs -f

pt: ## Run Posting with the project request collection
	posting --collection ./request-collection


dev: ## npm run dev for back
	make start-db
	make db-wait
	make db-drop
	make db-create
	make dev-api

build: ## npm run build for back
	NODE_ENV=production npm run && npm run build

start: ## npm run start for back
	make start-db
	make db-wait
	make db-create
	make start-api

start-api: ## npm run start for back
	npm run start

dev-api: is-db-created ## npm run dev for back
	npm run dev

start-db: ## start the database docker service
	docker compose up --remove-orphans --force-recreate --build -d

is-db-created: is-db-up ## check if the database is created
	$(MARIADB) --database=$(APP_NAME) -e "SHOW TABLES;" \
		&& echo "✔ kilist-api database exists" \
		|| { echo "✘ kilist-api database does not exist"; exit 1; }

is-db-up: ## Check if db service is up
	@docker ps --filter "name=$(DB_CONTAINER_NAME)" --filter "status=running" --format "{{.Names}}" | grep -q "$(DB_CONTAINER_NAME)" \
		&& echo "✔ $(DB_CONTAINER_NAME) is up" \
		|| { echo "✘ $(DB_CONTAINER_NAME) is not running"; exit 1; }

db-create: db-wait ## Creates database db
	$(MARIADB) -e "CREATE DATABASE IF NOT EXISTS \`$(APP_NAME)\`;"

db-drop: db-wait ## Drop database db
	$(MARIADB) -e "DROP DATABASE IF EXISTS \`$(APP_NAME)\`;"

db-wait: ## Wait for MariaDB to be ready
	@echo "Waiting for MariaDB to be ready..."
	@for i in $$(seq 1 20); do \
		docker exec $(DB_CONTAINER_NAME) mariadb -u root -p"root" -e "SELECT 1;" > /dev/null 2>&1 \
			&& echo "✔ MariaDB is ready" && exit 0; \
		echo "  ...waiting ($$i/20)"; \
		sleep 2; \
	done; \
	echo "✘ MariaDB did not become ready in time"; exit 1

%:
	@:

help: ## This menu
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@echo
	@awk -F ':|##' '/^[a-zA-Z_-]+:.*?##/ && !/##hidden/ {printf "  %-20s %s\n", $$1, $$NF}' $(MAKEFILE_LIST) | sort
