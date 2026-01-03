import { OctoSettings, ProviderConfig } from '../types/index';
import { App } from 'obsidian';
import DEFAULT_SETTINGS from '../settings/default-settings.json';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export class StateController {
	private readonly app: App;
	private settings: OctoSettings;
	private folderCache: CacheEntry<string[]>;
	private tagCache: CacheEntry<string[]>;

	constructor(app: App) {
		this.app = app;
		this.settings = {
			...DEFAULT_SETTINGS,
			apiProvider: DEFAULT_SETTINGS.apiProvider as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom',
			language: DEFAULT_SETTINGS.language as 'en' | 'zh'
		};
		this.folderCache = { data: [], timestamp: 0 };
		this.tagCache = { data: [], timestamp: 0 };
	}

	getSettings(): OctoSettings {
		return { ...this.settings };
	}

	updateSettings(data: Partial<OctoSettings>): void {
		this.settings = { ...this.settings, ...data };
	}

	loadSettings(data: Partial<OctoSettings>): void {
		this.settings = {
			...DEFAULT_SETTINGS,
			...data,
			apiProvider: (data.apiProvider ?? DEFAULT_SETTINGS.apiProvider) as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom',
			language: (data.language ?? DEFAULT_SETTINGS.language) as 'en' | 'zh'
		};
	}

	isApiConfigured(): boolean {
		const provider = this.settings.apiProvider;
		const config = this.settings.providers[provider];
		return Boolean(config?.apiKey && config?.apiKey.trim().length > 0);
	}

	isCacheValid(): boolean {
		return this.isCacheEntryValid(this.folderCache) && this.isCacheEntryValid(this.tagCache);
	}

	getFolderCache(): string[] {
		return [...this.folderCache.data];
	}

	getTagCache(): string[] {
		return [...this.tagCache.data];
	}

	getCurrentProviderConfig(): ProviderConfig {
		const provider = this.settings.apiProvider;
		return this.settings.providers[provider];
	}

	getIgnoredFolders(): string[] {
		return [...this.settings.ignoredFolders];
	}

	updateIgnoredFolders(folders: string[]): void {
		this.settings.ignoredFolders = folders;
		this.folderCache = { data: [], timestamp: 0 };
	}

	getCachedFolders(): string[] | null {
		return this.isCacheEntryValid(this.folderCache) ? [...this.folderCache.data] : null;
	}

	setCachedFolders(folders: string[]): void {
		this.folderCache = {
			data: [...folders],
			timestamp: Date.now()
		};
	}

	getCachedTags(): string[] | null {
		return this.isCacheEntryValid(this.tagCache) ? [...this.tagCache.data] : null;
	}

	setCachedTags(tags: string[]): void {
		this.tagCache = {
			data: [...tags],
			timestamp: Date.now()
		};
	}

	clearCache(): void {
		this.folderCache = { data: [], timestamp: 0 };
		this.tagCache = { data: [], timestamp: 0 };
	}

	private isCacheEntryValid<T>(cache: CacheEntry<T>): boolean {
		return Date.now() - cache.timestamp < CACHE_TTL_MS;
	}
}
