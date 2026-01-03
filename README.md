# Octo - Zero Effort Note Organization with AI

**Zero effort naming, tagging, and filing your Notes with AI.**

## Features

- **Zero Maintenance:** Notes are automatically organized by AI, eliminating manual inbox sorting
- **Zero Memory:** Use associative search to bridge the gap beyond keyword matching
- **Zero Planning:** Classification system evolves naturally with content, automatically reusing existing structures

## Installation

### From Community Plugins (Recommended)
1. Open Obsidian → **Settings** → **Community plugins**
2. Click **Browse** and search for "Octo"
3. Click **Install** and then **Enable**
4. Configure your API key in Octo settings

### Manual Installation
1. Download the latest [release](https://github.com/nodewee/obsidian-octo-plugin/releases)
2. Extract to your vault's `.obsidian/plugins/` directory
3. Enable in **Settings** → **Community plugins**
4. Configure your API key

## Configuration

### API Settings
- **API Key:** Get it from [DeepSeek Platform](https://platform.deepseek.com/)
- **Base URL:** Default `https://api.deepseek.com`
- **Model:** `deepseek-chat` or `deepseek-reasoner`

### Automation Settings
- **Dev Mode:** Preview API requests before sending
- **Ignored Folders:** Comma-separated list to exclude (case-insensitive word matching)

## Usage

### Organize a Note
1. Open the note you want to organize
2. Right-click → "Octo: Organize this note" or use Command Palette
3. Octo will:
   - Keep existing good titles
   - Only rename if "Untitled" or generic
   - Move to the appropriate folder
   - Add relevant tags
   - Update frontmatter

### Dev Mode
When enabled, a modal shows the API request before sending. You can modify the prompt and then proceed.

## Development

### Build
```bash
pnpm install
pnpm run build
```

### Type Check
```bash
pnpm run typecheck
```

### Development Mode
```bash
pnpm run dev
```

### Version Management
```bash
pnpm version patch   # 0.1.5 → 0.1.6
pnpm version minor   # 0.1.5 → 0.2.0
pnpm version major   # 0.1.5 → 1.0.0
```

### Release Process
1. Bump version: `pnpm version <patch|minor|major>`
2. Commit: `git commit -m "Bump version to x.x.x"`
3. Tag and push: `git tag -a x.x.x -m "x.x.x" && git push origin x.x.x`
4. GitHub Actions creates a draft release
5. Edit and publish on GitHub

## FAQ

**Q: Does Octo work offline?**
A: No, Octo requires an internet connection to call the DeepSeek API.

**Q: Can I use other AI providers?**
A: Currently only DeepSeek is supported. Other providers may be added in the future.

**Q: Will Octo overwrite my existing notes?**
A: Octo only renames notes with "Untitled" or generic titles. It preserves good titles and only adds tags and moves notes to appropriate folders.

**Q: How does folder filtering work?**
A: Uses word-boundary matching. `archive` excludes `archive` but not `archive-old`. Case-insensitive.

**Q: Can I undo changes made by Octo?**
A: Yes, you can use Obsidian's built-in undo (Ctrl/Cmd + Z) immediately after organization.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Developed by [HenryZ](https://github.com/nodewee)
