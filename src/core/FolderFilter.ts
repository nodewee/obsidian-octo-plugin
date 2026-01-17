import { FolderFilterResult } from '../types/index';

export class FolderFilter {
	private readonly ignoredFolders: Set<string>;

	constructor(ignoredFolders: string[] = []) {
		this.ignoredFolders = new Set(ignoredFolders.map(f => f.toLowerCase()));
	}

	filterFolders(folders: string[]): FolderFilterResult {
		const filteredFolders: string[] = [];
		const ignoredFolders: string[] = [];

		for (const folder of folders) {
			if (this.isFolderIgnored(folder)) {
				ignoredFolders.push(folder);
			} else {
				filteredFolders.push(folder);
			}
		}

		return {
			folders: filteredFolders,
			ignored: ignoredFolders
		};
	}

	private isFolderIgnored(folder: string): boolean {
		return this.ignoredFolders.has(folder.toLowerCase()) || this.isSubfolderOfIgnored(folder);
	}

	private isSubfolderOfIgnored(folder: string): boolean {
		const lowerFolder = folder.toLowerCase();
		for (const ignoredFolder of this.ignoredFolders) {
			if (lowerFolder.startsWith(`${ignoredFolder}/`)) {
				return true;
			}
		}
		return false;
	}
}
