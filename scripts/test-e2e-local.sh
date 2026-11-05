#!/bin/sh
case "$(uname -s)" in
  Darwin) PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright" ;;
  Linux) PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright" ;;
  MINGW* | MSYS* | CYGWIN*) PLAYWRIGHT_BROWSERS_PATH="${LOCALAPPDATA}/ms-playwright" ;;
  *) echo "unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac
export PLAYWRIGHT_BROWSERS_PATH
exec playwright test "$@"
