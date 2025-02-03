COMPOSE_FILE = srcs/docker-compose.yml
DATA_PATH = data/
POSTGRES_DATA = $(DATA_PATH)/postgres

all: up setup

update_redirect_uri:
	@LOCAL_IP=$$(ip addr show $$(ip route | grep default | awk '{print $$5}') | grep -Po 'inet \K[\d.]+'); \
	echo "Detected IP: $$LOCAL_IP"; \
	sed -i "s|REDIRECT_URI=.*|REDIRECT_URI=http://$$LOCAL_IP:8000/auth/callback|" srcs/.env || echo "Failed to update REDIRECT_URI"; \
	grep "REDIRECT_URI=" srcs/.env

up:
	docker compose -f srcs/docker-compose.yml build --no-cache
	docker compose -f srcs/docker-compose.yml up -d

down: 
	docker compose -f $(COMPOSE_FILE) down

start:
	docker compose -f $(COMPOSE_FILE) start

stop:
	docker compose -f $(COMPOSE_FILE) stop

logs:
	docker compose -f $(COMPOSE_FILE) logs

setup:
	mkdir -p $(POSTGRES_DATA)

migrate:
	docker compose -f srcs/docker-compose.yml exec django python manage.py migrate

makemigration:
	docker compose -f srcs/docker-compose.yml exec django python manage.py makemigrations

clean:
	rm -rf $(DATA_PATH)

fclean: clean
	docker system prune -f -a --volumes
	docker volume rm srcs_postgres_data srcs_django_static

.PHONY: all up down start stop logs clean fclean
