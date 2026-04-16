up:
	sudo docker compose up -d

down:
	sudo docker compose down

restart:
	sudo docker compose down && sudo docker compose up -d

logs:
	sudo docker compose logs -f

ps:
	sudo docker compose ps

pull:
	sudo docker compose pull

update:
	sudo docker compose pull && sudo docker compose up -d

backup:
	sudo /usr/local/bin/backup-arr-stack.sh
