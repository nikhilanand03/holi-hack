#!/usr/bin/env bash
# Build and deploy to Azure Container Apps
set -e

REGISTRY="${REGISTRY:-banimcr}"
IMAGE="${IMAGE:-banim-api:latest}"
RESOURCE_GROUP="${RESOURCE_GROUP:-banim-rg}"
APP_NAME="${APP_NAME:-banim-api}"

echo "==> Building image in ACR..."
az acr build \
  --registry "$REGISTRY" \
  --image "$IMAGE" \
  --file Dockerfile .

echo "==> Deploying to Container Apps..."
az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --image "$REGISTRY.azurecr.io/$IMAGE"

echo "==> Done. Fetching URL..."
az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv
