#!/usr/bin/env bash
# Generate Tauri v2 signing keypair for update verification.
#
# Usage:
#   ./scripts/setup-signing.sh
#
# After running:
# 1. Copy the PUBLIC key and paste it into src-tauri/tauri.conf.json -> plugins.updater.pubkey
# 2. Add the PRIVATE key as a GitHub Actions secret named TAURI_SIGNING_PRIVATE_KEY
# 3. Add the password as a GitHub Actions secret named TAURI_SIGNING_PRIVATE_KEY_PASSWORD
#
# IMPORTANT: Never commit the private key to version control.

set -euo pipefail

if ! command -v pnpm &>/dev/null; then
  echo "Error: pnpm is required. Install it first: npm install -g pnpm"
  exit 1
fi

echo "Generating Tauri signing keypair..."
echo "You will be prompted for a password. Remember this password!"
echo "It will be needed as the TAURI_SIGNING_PRIVATE_KEY_PASSWORD secret."
echo ""

pnpm tauri signer generate -w ~/.tauri/cleanos-ai.key

echo ""
echo "================================================"
echo " Keys generated successfully!"
echo "================================================"
echo ""
echo "Private key saved to: ~/.tauri/cleanos-ai.key"
echo "Public key saved to:  ~/.tauri/cleanos-ai.key.pub"
echo ""
echo "Next steps:"
echo "  1. Copy the contents of ~/.tauri/cleanos-ai.key.pub"
echo "     and paste it into src-tauri/tauri.conf.json -> plugins.updater.pubkey"
echo ""
echo "  2. Go to https://github.com/kryptobaseddev/cleanos-ai/settings/secrets/actions"
echo "     and create these repository secrets:"
echo ""
echo "     TAURI_SIGNING_PRIVATE_KEY       = contents of ~/.tauri/cleanos-ai.key"
echo "     TAURI_SIGNING_PRIVATE_KEY_PASSWORD = the password you just entered"
echo ""
echo "  3. NEVER commit the private key file to git."
echo ""
