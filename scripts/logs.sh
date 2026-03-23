#!/usr/bin/env bash
# Stream logs from the running Azure Container App
set -e

RESOURCE_GROUP="${RESOURCE_GROUP:-banim-rg}"
APP_NAME="${APP_NAME:-banim-api}"

az containerapp logs show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type console \
  --follow
