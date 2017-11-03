build:
	docker-compose build

up:
	docker-compose up -d

stop:
	docker-compose stop

shell-web:
	docker exec -ti django_web /bin/bash
