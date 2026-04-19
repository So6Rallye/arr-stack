.PHONY: up down restart logs ps pull update backup check-hardlinks \
        up-arr down-arr pull-arr logs-arr \
        up-immich down-immich pull-immich logs-immich

# Both stacks
up: up-arr up-immich

down: down-arr down-immich

pull: pull-arr pull-immich

restart:
	sudo docker compose down && sudo docker compose up -d

logs:
	sudo docker compose logs -f

ps:
	sudo docker compose ps

update:
	sudo docker compose pull && sudo docker compose up -d

backup:
	sudo ./backup-arr-stack.sh

# ARR stack only
up-arr:
	sudo docker compose up -d

down-arr:
	sudo docker compose down

pull-arr:
	sudo docker compose pull

logs-arr:
	sudo docker compose logs -f

# Immich stack only
up-immich:
	sudo docker compose -f docker-compose.immich.yml up -d

down-immich:
	sudo docker compose -f docker-compose.immich.yml down

pull-immich:
	sudo docker compose -f docker-compose.immich.yml pull

logs-immich:
	sudo docker compose -f docker-compose.immich.yml logs -f

check-hardlinks:
	@echo "Checking hardlinks — media/ vs torrents/ (inodes must match)..."
	@for dir in movies tv music; do \
	  f=$$(ls /data/media/$$dir/ 2>/dev/null | head -1); \
	  if [ -z "$$f" ]; then \
	    echo "  $$dir: no content yet — skipping"; \
	    continue; \
	  fi; \
	  inode_media=$$(stat -c '%i' "/data/media/$$dir/$$f"); \
	  inode_torrent=$$(stat -c '%i' "/data/torrents/$$dir/$$f" 2>/dev/null || echo "missing"); \
	  if [ "$$inode_media" = "$$inode_torrent" ]; then \
	    echo "  $$dir: OK — hardlinks (inode $$inode_media)"; \
	  else \
	    echo "  $$dir: FAIL — inode media=$$inode_media torrent=$$inode_torrent"; \
	    echo "         Run: df /data/media/$$dir /data/torrents/$$dir (must be same filesystem)"; \
	  fi; \
	done
