import { OctoResponse } from '../types/index';
import { App, TFile, TFolder, normalizePath, Notice } from 'obsidian';

export class NoteOrganizer {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	async applyOrganization(
		file: TFile,
		response: OctoResponse,
		content: string
	): Promise<TFile> {
		let updatedFile = file;

		if (response.title && response.title !== file.basename) {
			updatedFile = await this.renameFile(updatedFile, response.title);
		}

		if (response.path && this.shouldMoveFile(updatedFile, response.path)) {
			updatedFile = await this.moveFile(updatedFile, response.path);
		}

		if (response.tags && response.tags.length > 0) {
			await this.updateTags(updatedFile, response.tags, content);
		}

		return updatedFile;
	}

	private shouldMoveFile(file: TFile, targetPath: string): boolean {
		const currentPath = this.normalizePath(file.parent?.path || '');
		const normalizedTargetPath = this.normalizePath(targetPath);
		return currentPath !== normalizedTargetPath;
	}

	private normalizePath(path: string): string {
		return path.replace(/^\//, '').replace(/\/$/, '');
	}

	private async renameFile(file: TFile, newTitle: string): Promise<TFile> {
		const parentFolder = file.parent;
		if (!parentFolder) {
			throw new Error('File has no parent folder');
		}

		const newPath = normalizePath(`${parentFolder.path}/${newTitle}.md`);
		const existingFile = this.app.vault.getFileByPath(newPath);

		if (existingFile) {
			throw new Error(`File already exists: ${newPath}`);
		}

		await this.app.vault.rename(file, newPath);
		const renamedFile = this.app.vault.getFileByPath(newPath);

		if (!renamedFile) {
			throw new Error(`Failed to retrieve renamed file: ${newPath}`);
		}

		new Notice(`Renamed to: ${newTitle}`);
		return renamedFile;
	}

	private async moveFile(file: TFile, targetPath: string): Promise<TFile> {
		const obsidianTargetPath = normalizePath(targetPath);
		const targetFolder = this.app.vault.getFolderByPath(obsidianTargetPath);

		if (!targetFolder) {
			throw new Error(`Target folder not found: ${obsidianTargetPath}`);
		}

		const newPath = normalizePath(`${targetFolder.path}/${file.name}`);
		const existingFile = this.app.vault.getFileByPath(newPath);

		if (existingFile) {
			throw new Error(`File already exists: ${newPath}`);
		}

		await this.app.vault.rename(file, newPath);
		const movedFile = this.app.vault.getFileByPath(newPath);

		if (!movedFile) {
			throw new Error(`Failed to retrieve moved file: ${newPath}`);
		}

		new Notice(`Moved to: ${obsidianTargetPath}`);
		return movedFile;
	}

	private async updateTags(file: TFile, tags: string[], content: string): Promise<void> {
		const existingTags = this.extractTagsFromFile(file);
		const tagsToAdd = tags.filter(tag => !existingTags.has(tag));

		if (tagsToAdd.length === 0) {
			return;
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			const currentTags = (frontmatter.tags as string[]) || [];
			const mergedTags = [...new Set([...currentTags, ...tagsToAdd])];
			frontmatter.tags = mergedTags;
		});

		new Notice(`Added tags: ${tagsToAdd.join(', ')}`);
	}

	private extractTagsFromFile(file: TFile): Set<string> {
		const tags = new Set<string>();
		const fileCache = this.app.metadataCache.getFileCache(file);
		
		if (fileCache?.tags) {
			for (const tagInfo of fileCache.tags) {
				tags.add(tagInfo.tag);
			}
		}
		
		return tags;
	}
}
