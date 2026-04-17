.PHONY: up down restart logs ps pull update backup check-hardlinks

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
	sudo ./backup-arr-stack.sh

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
