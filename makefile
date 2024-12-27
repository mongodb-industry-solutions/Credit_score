build:
	docker-compose up --build -d

start: 
	docker-compose start

stop:
	docker-compose stop

clean:
	docker-compose down --rmi all -v

poetry_start:
	cd backend && poetry config virtualenvs.in-project true

poetry_install:
	cd backend && poetry install --no-interaction -v --no-cache --no-root

poetry_update:
	cd backend && poetry update