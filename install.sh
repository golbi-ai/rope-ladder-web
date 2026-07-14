#!/bin/sh
set -eu

# Usage: curl -fsSL https://rpldr.golbi.ai/install.sh | sh
BASE_URL="${ROPE_LADDER_INSTALL_BASE:-https://rpldr.golbi.ai}"
BIN_NAME="rope-ladder"

info() { echo "  \033[1;34m>\033[0m $*"; }

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in x86_64|amd64) ARCH=amd64 ;; aarch64|arm64) ARCH=arm64 ;; *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;; esac
case "$OS" in linux|darwin) ;; *) echo "Unsupported OS: $OS (use native PowerShell on Windows)" >&2; exit 1 ;; esac

check_sha256() {
  actual=""
  if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$1" | cut -d' ' -f1); elif command -v shasum >/dev/null 2>&1; then actual=$(shasum -a 256 "$1" | cut -d' ' -f1); else echo "A SHA-256 tool is required (sha256sum or shasum)" >&2; exit 1; fi
  if [ "$actual" != "$2" ]; then echo "Checksum verification failed" >&2; rm -f "$1"; exit 1; fi
}

pick_install_dir() {
  if [ -w /usr/local/bin ]; then INSTALL_DIR=/usr/local/bin
  elif [ -d "$HOME/.local/bin" ] && [ -w "$HOME/.local/bin" ]; then INSTALL_DIR=$HOME/.local/bin
  elif [ -d "$HOME/bin" ] && [ -w "$HOME/bin" ]; then INSTALL_DIR=$HOME/bin
  else INSTALL_DIR=$HOME/.local/bin; mkdir -p "$INSTALL_DIR"; fi
}

info "Fetching version manifest..."
MANIFEST=$(curl -fsSL "$BASE_URL/version.json") || { echo "Could not fetch $BASE_URL/version.json" >&2; exit 1; }
VERSION=$(printf '%s' "$MANIFEST" | tr -d ' \n\r\t' | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')
ASSET=$(printf '%s' "$MANIFEST" | tr -d ' \n\r\t' | grep -o "{[^}]*\"os\":\"$OS\"[^}]*\"arch\":\"$ARCH\"[^}]*}")
URL=$(printf '%s' "$ASSET" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p')
SHA=$(printf '%s' "$ASSET" | sed -n 's/.*"sha256":"\([^"]*\)".*/\1/p')
[ -n "$URL" ] && [ -n "$SHA" ] || { echo "No release asset exists for $OS/$ARCH" >&2; exit 1; }

TMPDIR=$(mktemp -d); trap 'rm -rf "$TMPDIR"' EXIT
ARCHIVE=$TMPDIR/$(basename "$URL")
info "Downloading rope-ladder $VERSION for $OS/$ARCH..."
curl -fsSL -o "$ARCHIVE" "$URL"
info "Verifying checksum..."; check_sha256 "$ARCHIVE" "$SHA"
case "$ARCHIVE" in *.tar.gz) tar -xzf "$ARCHIVE" -C "$TMPDIR" ;; *.zip) unzip -qo "$ARCHIVE" -d "$TMPDIR" ;; *) echo "Unknown archive format" >&2; exit 1 ;; esac
BIN_PATH=$(find "$TMPDIR" -type f \( -name "$BIN_NAME" -o -name "$BIN_NAME.exe" \) | head -1)
[ -n "$BIN_PATH" ] || { echo "Release archive does not contain $BIN_NAME" >&2; exit 1; }
pick_install_dir
mv "$BIN_PATH" "$INSTALL_DIR/$BIN_NAME"; chmod +x "$INSTALL_DIR/$BIN_NAME"
"$INSTALL_DIR/$BIN_NAME" version
if ! printf '%s' "$PATH" | tr ':' '\n' | grep -qxF "$INSTALL_DIR"; then info "Add $INSTALL_DIR to PATH to use rope-ladder from a new shell."; fi
info "rope-ladder installed successfully. Run: rope-ladder mcp install"
