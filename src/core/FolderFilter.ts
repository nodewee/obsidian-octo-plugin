import { FolderFilterResult } from '../types/index';

export class FolderFilter {
	private readonly ignoredPatterns: string[];

	constructor(ignoredFolders: string[] = []) {
		this.ignoredPatterns = ignoredFolders
			.map(f => f.trim())
			.filter(f => f.length > 0)
			.map(f => f.replace(/\/+$/, '').toLowerCase());
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
		const lowerFolder = folder.toLowerCase();
		for (const pattern of this.ignoredPatterns) {
			if (this.matchPattern(pattern, lowerFolder)) {
				return true;
			}
		}
		return false;
	}

	private matchPattern(pattern: string, path: string): boolean {
		if (!pattern.includes('*')) {
			return path === pattern || path.startsWith(`${pattern}/`);
		}

		const patternParts = pattern.split('/');
		const pathParts = path.split('/');

		return this.matchPatternParts(patternParts, pathParts, 0, 0);
	}

	private matchPatternParts(patternParts: string[], pathParts: string[], patternIndex: number, pathIndex: number): boolean {
		if (patternIndex >= patternParts.length && pathIndex >= pathParts.length) {
			return true;
		}

		if (patternIndex >= patternParts.length) {
			return false;
		}

		if (pathIndex >= pathParts.length) {
			return patternParts.slice(patternIndex).every(p => p === '**');
		}

		const patternPart = patternParts[patternIndex];
		const pathPart = pathParts[pathIndex];

		if (patternPart === '**') {
			if (this.matchPatternParts(patternParts, pathParts, patternIndex + 1, pathIndex)) {
				return true;
			}
			return this.matchPatternParts(patternParts, pathParts, patternIndex, pathIndex + 1);
		}

		if (this.matchSinglePattern(patternPart, pathPart)) {
			return this.matchPatternParts(patternParts, pathParts, patternIndex + 1, pathIndex + 1);
		}

		return false;
	}

	private matchSinglePattern(pattern: string, text: string): boolean {
		if (pattern === '*') {
			return true;
		}

		let patternIndex = 0;
		let textIndex = 0;
		let starIndex = -1;
		let matchIndex = -1;

		while (textIndex < text.length) {
			if (patternIndex < pattern.length && pattern[patternIndex] === text[textIndex]) {
				patternIndex++;
				textIndex++;
			} else if (patternIndex < pattern.length && pattern[patternIndex] === '*') {
				starIndex = patternIndex;
				matchIndex = textIndex;
				patternIndex++;
			} else if (starIndex !== -1) {
				patternIndex = starIndex + 1;
				matchIndex++;
				textIndex = matchIndex;
			} else {
				return false;
			}
		}

		while (patternIndex < pattern.length && pattern[patternIndex] === '*') {
			patternIndex++;
		}

		return patternIndex >= pattern.length;
	}
}
