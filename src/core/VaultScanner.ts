import { App, TFile, TFolder } from 'obsidian';

export class VaultScanner {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	scanFolders(): string[] {
		const folders = new Set<string>();
		this.collectFolders(this.app.vault.getRoot(), folders);
		return Array.from(folders)
			.filter(f => f !== '/')
			.sort();
	}

	scanTags(): string[] {
		const tags = new Set<string>();
		const markdownFiles = this.app.vault.getMarkdownFiles();

		for (const file of markdownFiles) {
			const fileCache = this.app.metadataCache.getFileCache(file);
			if (fileCache?.tags) {
				for (const tagInfo of fileCache.tags) {
					tags.add(tagInfo.tag);
				}
			}
		}

		return Array.from(tags).sort();
	}

	scanAll(): void {
		this.scanFolders();
		this.scanTags();
	}

	private collectFolders(folder: TFolder, folderSet: Set<string>): void {
		folderSet.add(folder.path);

		for (const child of folder.children) {
			if (child instanceof TFolder) {
				this.collectFolders(child, folderSet);
			}
		}
	}

	getMarkdownFiles(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getFileByPath(path: string): TFile | null {
		const file = this.app.vault.getFileByPath(path);
		return file instanceof TFile ? file : null;
	}

	getFolderByPath(path: string): TFolder | null {
		return this.app.vault.getFolderByPath(path);
	}
}
