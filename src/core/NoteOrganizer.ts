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

		if (response.path && response.path !== updatedFile.parent?.path) {
			updatedFile = await this.moveFile(updatedFile, response.path);
		}

		if (response.tags && response.tags.length > 0) {
			await this.updateTags(updatedFile, response.tags, content);
		}

		return updatedFile;
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
		const normalizedTargetPath = normalizePath(targetPath);
		const targetFolder = this.app.vault.getAbstractFileByPath(normalizedTargetPath);

		if (!targetFolder) {
			throw new Error(`Target folder not found: ${normalizedTargetPath}`);
		}

		if (!(targetFolder instanceof TFolder)) {
			throw new Error(`Target path is not a folder: ${normalizedTargetPath}`);
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

		new Notice(`Moved to: ${normalizedTargetPath}`);
		return movedFile;
	}

	private async updateTags(file: TFile, tags: string[], content: string): Promise<void> {
		const existingTags = this.extractTags(content);
		const tagsToAdd = tags.filter(tag => !existingTags.has(tag));

		if (tagsToAdd.length === 0) {
			return;
		}

		const tagString = tagsToAdd.map(tag => `#${tag}`).join(' ');
		const updatedContent = this.insertTags(content, tagString);

		await this.app.vault.modify(file, updatedContent);
		new Notice(`Added tags: ${tagsToAdd.join(', ')}`);
	}

	private extractTags(content: string): Set<string> {
		const tagRegex = /#([\w\u4e00-\u9fa5-]+)/g;
		const tags = new Set<string>();
		let match: RegExpExecArray | null;

		while ((match = tagRegex.exec(content)) !== null) {
			tags.add(match[1]);
		}

		return tags;
	}

	private insertTags(content: string, tagString: string): string {
		const lines = content.split('\n');
		const yamlEndIndex = this.findYamlEndIndex(lines);
		const insertIndex = yamlEndIndex >= 0 ? yamlEndIndex + 1 : 0;

		lines.splice(insertIndex, 0, '', tagString, '');
		return lines.join('\n');
	}

	private findYamlEndIndex(lines: string[]): number {
		if (lines.length === 0 || !lines[0].trim().startsWith('---')) {
			return -1;
		}

		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === '---') {
				return i;
			}
		}

		return -1;
	}
}
