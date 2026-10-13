#!/bin/sh
set -eu

# The bind mount and named volume can hide dependencies baked into the image.
# Initialize/repair the CLI volume on first use, then leave it cached.
if ! node -e "require.resolve('axios', { paths: ['/workspace/cli'] })" >/dev/null 2>&1; then
  echo "Installing CLI dependencies into cli_node_modules..."
  npm ci --prefix /workspace/cli
fi

exec "$@"
