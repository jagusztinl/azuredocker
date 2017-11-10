build:
	docker-compose build

up:
	docker-compose up -d

stop:
	docker-compose stop

shell:
	docker exec -ti django_web /bin/bash
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

