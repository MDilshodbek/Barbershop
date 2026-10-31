#!/usr/bin/env bash
# Runs on the VPS (called by GitHub Actions, or manually).
# Usage: ./deploy.sh [image-tag]   e.g. ./deploy.sh sha-1a2b3c4   (default: latest)
# Assumes `docker login ghcr.io` was already done (the workflow does it).
set -euo pipefail

cd "$(dirname "$0")"

export IMAGE_TAG="${1:-latest}"

echo "==> Deploying ghcr.io/mdilshodbek/barbershop:${IMAGE_TAG}"

if [ ! -f .env ]; then
	echo "ERROR: .env not found in $(pwd). Create it from .env.example first." >&2
	exit 1
fi

# Persistent uploads (bind-mounted into the container, owned by the container's node user)
mkdir -p uploads/article uploads/member uploads/review uploads/service

echo "==> Pulling images"
docker compose pull

echo "==> Restarting containers"
docker compose up -d --remove-orphans

echo "==> Waiting for barbershop to become healthy"
status="starting"
for _ in $(seq 1 40); do
	status="$(docker inspect -f '{{.State.Health.Status}}' barbershop 2>/dev/null || echo missing)"
	if [ "$status" = "healthy" ] || [ "$status" = "unhealthy" ]; then
		break
	fi
	sleep 3
done

if [ "$status" != "healthy" ]; then
	echo "ERROR: barbershop is '${status}'. Last logs:" >&2
	docker compose logs --tail=100 barbershop >&2
	exit 1
fi

echo "==> barbershop is healthy"
docker compose ps

# Remove only this project's unused images older than 7 days (recent ones stay for rollback)
echo "==> Cleaning up old images"
docker image prune -af \
	--filter "label=org.opencontainers.image.source=https://github.com/MDilshodbek/Barbershop" \
	--filter "until=168h" || true

echo "==> Deploy finished: ${IMAGE_TAG}"
