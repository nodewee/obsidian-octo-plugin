# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.6] - 2026-01-17

### Added
- Wildcard pattern matching for folder filtering (supports * and **)
- Comprehensive test cases covering various matching scenarios

### Changed
- Optimized cache mechanism by converting async scanning to sync operations for better performance
- Improved folder filter path matching logic with case-insensitive support
- Optimized file movement and tag update logic using Obsidian native APIs
- Refactored prompt template with improved path display format
- Updated settings UI to support multi-line input format for folder ignore patterns

## [0.1.5] - 2026-01-03

### Added
- Initial version
- Core note organization functionality
- DeepSeek API integration
- Settings UI for configuration
- Dev mode modal for prompt preview

[Unreleased]: https://github.com/nodewee/obsidian-octo-plugin/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/nodewee/obsidian-octo-plugin/releases/tag/v0.1.6
[0.1.5]: https://github.com/nodewee/obsidian-octo-plugin/releases/tag/v0.1.5
