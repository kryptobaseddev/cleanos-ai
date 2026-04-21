# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026.2.3] - 2026-04-21

### Fixed

- **Updater**: Fixed confusing "failed to install update" error for `.deb`/`.rpm` installs. The app now detects non-AppImage installations and shows a "Download from GitHub" button with an explanatory message instead of attempting (and failing) to auto-update system packages.
- **Updater**: Added `is_appimage()` backend command to detect AppImage runtime at startup.

## [2026.2.2] - 2026-04-20

### Fixed

- **Docker cleanup**: Fixed checkbox selection bug where clicking one item selected all. Added explicit checkbox IDs, labels, and event handling.
- **Docker cleanup**: Added support for selective deletion — you can now select specific images/containers/volumes and delete only those.
- **Log cleanup**: Fixed infinite spinner caused by `sudo journalctl` hanging while waiting for a password. Now uses `sudo -n` and shows a clear error message when elevated privileges are required.
- **Browser cache cleanup**: Fixed infinite spinner caused by attempting to delete entire browser profile directories. Now only deletes actual cache subdirectories (`Cache/`, `Code Cache/`, `cache2/`).
- **Browser cache cleanup**: Fixed Firefox cache path to point to `~/.cache/mozilla/firefox` instead of `~/.mozilla/firefox`.
- **Type alignment**: Fixed Docker type mismatches between Rust backend and TypeScript frontend (`size` fields were `String` in Rust but `number` in TS).
- **Type alignment**: Fixed `AIAnalysis` and `CleanupRecommendation` type mismatches between backend and frontend.
- **Error handling**: All cleanup panels (Docker, Logs, Browser Caches) now display error messages instead of failing silently.

## [2026.2.1] - 2026-02-14

### Fixed

- CalVer versioning alignment across package.json, Cargo.toml, and tauri.conf.json.
- CI/CD release asset uploads and signing.

## [2026.2.0] - 2026-02-14

### Changed

- Removed space from `productName` to fix release asset upload paths.

## [0.1.0] - 2026-02-14

### Added

- Initial release of CleanOS AI.
- AI-powered file analysis and organization.
- Multi-provider AI support (OpenAI, Gemini, Claude, Kimi).
- Docker and system cleanup tools.
- Interactive storage visualizations.
- Modern desktop UI with dark/light mode.
- Secure credential storage via Linux keyring.
