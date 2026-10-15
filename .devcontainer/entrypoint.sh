#!/bin/sh
set -eu

# The bind mount and named volume can hide dependencies baked into the image.
# Initialize/repair the CLI volume on first use, then leave it cached.
if ! node -e "require.resolve('axios', { paths: ['/workspace/cli'] })" >/dev/null 2>&1; then
  echo "Installing CLI dependencies into cli_node_modules..."
  npm ci --prefix /workspace/cli
fi

# The bind mount and named volumes hide dependencies baked into the image.
# A freshly created named volume starts empty, which leaves the backend and
# frontend without their node_modules and makes the dev servers fail to start
# while the published ports still appear open. Repair them on first use.
install_if_missing() {
  label="$1"
  dir="$2"
  if ! node -e "require.resolve('$label', { paths: ['$dir'] })" >/dev/null 2>&1; then
    echo "Installing dependencies into $dir/node_modules..."
    npm ci --prefix "$dir"
  fi
}

install_if_missing next /workspace/frontend
install_if_missing express /workspace/backend

exec "$@"
