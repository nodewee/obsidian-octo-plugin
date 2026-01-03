import { App, TFile, TFolder } from 'obsidian';
import { StateController } from './StateController';
import { FolderFilter } from './FolderFilter';

export class VaultScanner {
	constructor(
		private app: App,
		private state: StateController
	) {}

	scanFolders(): string[] {
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folderSet = new Set<string>();

		for (const file of allFiles) {
			if (file instanceof TFolder) {
				if (file.path && file.path !== '/') {
					folderSet.add(file.path);
				}
			}
		}

		const folders = Array.from(folderSet).sort();
		this.state.setFolderCache(folders);
		return folders;
	}

	async scanTags(): Promise<string[]> {
		const files = this.app.vault.getMarkdownFiles();
		const tagSet = new Set<string>();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache?.tags) {
				// cache.tags is an array of TagCache objects
				for (const tagCache of cache.tags) {
					tagSet.add(tagCache.tag);
				}
			}
		}

		const tags = Array.from(tagSet).sort();
		this.state.setTagCache(tags);
		return tags;
	}

	async scanAll(): Promise<{ folders: string[]; tags: string[] }> {
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folderSet = new Set<string>();
		const tagSet = new Set<string>();

		for (const file of allFiles) {
			if (file instanceof TFolder) {
				if (file.path && file.path !== '/') {
					folderSet.add(file.path);
				}
			} else if (file instanceof TFile && file.extension === 'md') {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.tags) {
					for (const tagCache of cache.tags) {
						tagSet.add(tagCache.tag);
					}
				}
			}
		}

		const folders = Array.from(folderSet).sort();
		const tags = Array.from(tagSet).sort();

		this.state.setFolderCache(folders);
		this.state.setTagCache(tags);

		return { folders, tags };
	}

	getFilteredFolders(): string[] {
		const allFolders = this.state.getFolderCache();
		const settings = this.state.getSettings();
		const result = FolderFilter.filter(allFolders, settings.ignoredFolders);
		return result.folders;
	}
}
