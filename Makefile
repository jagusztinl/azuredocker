build:
	docker-compose build

up:
	docker-compose up -d

stop:
	docker-compose stop

log:
	docker-compose logs --follow web

shell:
	docker-compose exec web /bin/bash
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

