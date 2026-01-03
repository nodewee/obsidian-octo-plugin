import { App, TFile, TFolder } from 'obsidian';

export class VaultScanner {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	scanFolders(): string[] {
		const folders = new Set<string>();
		this.collectFolders(this.app.vault.getRoot(), folders);
		return Array.from(folders).sort();
	}

	async scanTags(): Promise<string[]> {
		const tags = new Set<string>();
		const markdownFiles = this.app.vault.getMarkdownFiles();

		const promises = markdownFiles.map(file => this.extractTagsFromFile(file, tags));
		await Promise.all(promises);

		return Array.from(tags).sort();
	}

	async scanAll(): Promise<void> {
		this.scanFolders();
		await this.scanTags();
	}

	private collectFolders(folder: TFolder, folderSet: Set<string>): void {
		folderSet.add(folder.path);

		for (const child of folder.children) {
			if (child instanceof TFolder) {
				this.collectFolders(child, folderSet);
			}
		}
	}

	private async extractTagsFromFile(file: TFile, tagSet: Set<string>): Promise<void> {
		const content = await this.app.vault.cachedRead(file);
		const tagRegex = /#([\w\u4e00-\u9fa5-]+)/g;
		let match: RegExpExecArray | null;

		while ((match = tagRegex.exec(content)) !== null) {
			tagSet.add(match[1]);
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
		const folder = this.app.vault.getAbstractFileByPath(path);
		return folder instanceof TFolder ? folder : null;
	}
}
