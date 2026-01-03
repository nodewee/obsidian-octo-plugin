import { FolderFilterResult } from '../types/index';

export class FolderFilter {
	static filter(folders: string[], ignoredFolders: string[]): FolderFilterResult {
		const result: FolderFilterResult = {
			folders: [],
			ignored: []
		};

		for (const folder of folders) {
			if (folder === '/') {
				result.ignored.push(folder);
				continue;
			}

			if (this.shouldIgnore(folder, ignoredFolders)) {
				result.ignored.push(folder);
			} else {
				result.folders.push(folder);
			}
		}

		return result;
	}

	private static shouldIgnore(folder: string, ignoredFolders: string[]): boolean {
		const normalizedFolder = folder.toLowerCase().replace(/^\//, '').replace(/\/$/, '');

		for (const ignored of ignoredFolders) {
			const normalizedIgnored = ignored.toLowerCase().trim();

			if (normalizedIgnored === normalizedFolder) {
				return true;
			}

			const folderParts = normalizedFolder.split('/');
			const ignoredParts = normalizedIgnored.split('/');

			if (this.matchesWordBoundary(folderParts, ignoredParts)) {
				return true;
			}
		}

		return false;
	}

	private static matchesWordBoundary(folderParts: string[], ignoredParts: string[]): boolean {
		if (ignoredParts.length > folderParts.length) {
			return false;
		}

		for (let i = 0; i <= folderParts.length - ignoredParts.length; i++) {
			let match = true;
			for (let j = 0; j < ignoredParts.length; j++) {
				if (folderParts[i + j] !== ignoredParts[j]) {
					match = false;
					break;
				}
			}
			if (match) {
				return true;
			}
		}

		return false;
	}
}
