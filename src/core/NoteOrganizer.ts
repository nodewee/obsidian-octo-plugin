import { App, TFile, Notice } from 'obsidian';
import { StateController } from './StateController';
import { OctoResponse } from '../types/index';
import { i18n } from '../i18n/I18n';

export class NoteOrganizer {
	constructor(
		private app: App,
		private state: StateController
	) {}

	async organizeNoteWithResponse(file: TFile, response: OctoResponse, content: string): Promise<TFile> {
		return await this.applyOrganization(file, response, content);
	}

	private async applyOrganization(
		file: TFile,
		response: OctoResponse,
		content: string
	): Promise<TFile> {
		const { title, path, tags } = response;

		let targetPath = path;
		if (!targetPath || targetPath === '/') {
			targetPath = '';
		}

		let filename = title || 'Untitled';
		if (file.basename !== 'Untitled' && !this.isGenericTitle(file.basename)) {
			filename = file.basename;
		}

		const timestamp = new Date().toISOString().slice(11, 16).replace(':', '');
		let finalPath = targetPath ? `${targetPath}/${filename}.md` : `${filename}.md`;

		const existingFile = this.app.vault.getAbstractFileByPath(finalPath);
		if (existingFile && existingFile !== file) {
			finalPath = targetPath 
				? `${targetPath}/${filename}_${timestamp}.md`
				: `${filename}_${timestamp}.md`;
		}

		let finalContent = content;

		if (tags.length > 0) {
			const frontmatterLines: string[] = ['---'];
			frontmatterLines.push(`tags: ${JSON.stringify(tags)}`);
			frontmatterLines.push('---', '');

			if (!content.startsWith('---')) {
				finalContent = frontmatterLines.join('\n') + content;
			}
		}

		if (file.path !== finalPath) {
			await this.app.fileManager.renameFile(file, finalPath);
		}
		await this.app.vault.modify(file, finalContent);
		new Notice(i18n.t('notices.success', { path: finalPath }));
		return file;
	}

	private isGenericTitle(title: string): boolean {
		const genericPatterns = ['untitled', 'new note', 'note', '无标题', '新建笔记'];
		const lowerTitle = title.toLowerCase();
		return genericPatterns.some(pattern => lowerTitle.includes(pattern));
	}
}
