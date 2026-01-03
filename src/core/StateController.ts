import { OctoSettings } from '../types/index';
import { i18n } from '../i18n/I18n';

const DEFAULT_SETTINGS: OctoSettings = {
	apiProvider: 'DeepSeek',
	providers: {
		DeepSeek: { apiKey: '', modelName: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
		OpenAI: { apiKey: '', modelName: 'gpt-4o-mini', baseUrl: 'https://api.openai.com' },
		Kimi: { apiKey: '', modelName: 'kimi-k2-turbo-preview', baseUrl: 'https://api.moonshot.cn' },
		Custom: { apiKey: '', modelName: '', baseUrl: '' }
	},
	devMode: false,
	ignoredFolders: [],
	customPrompt: '',
	language: i18n.getLanguage()
};

export class StateController {
	private settings: OctoSettings;
	private folderCache: string[] = [];
	private tagCache: string[] = [];
	private cacheTimestamp: number = 0;
	private readonly CACHE_TTL = 60000;

	constructor() {
		this.settings = { ...DEFAULT_SETTINGS };
	}

	loadSettings(data: Partial<OctoSettings>): void {
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	getSettings(): OctoSettings {
		return { ...this.settings };
	}

	updateSettings(updates: Partial<OctoSettings>): void {
		this.settings = { ...this.settings, ...updates };
	}

	getCurrentProviderConfig() {
		const provider = this.settings.apiProvider;
		return this.settings.providers[provider];
	}

	setFolderCache(folders: string[]): void {
		this.folderCache = folders;
		this.cacheTimestamp = Date.now();
	}

	getFolderCache(): string[] {
		if (Date.now() - this.cacheTimestamp > this.CACHE_TTL) {
			return [];
		}
		return [...this.folderCache];
	}

	setTagCache(tags: string[]): void {
		this.tagCache = tags;
		this.cacheTimestamp = Date.now();
	}

	getTagCache(): string[] {
		if (Date.now() - this.cacheTimestamp > this.CACHE_TTL) {
			return [];
		}
		return [...this.tagCache];
	}

	clearCache(): void {
		this.folderCache = [];
		this.tagCache = [];
		this.cacheTimestamp = 0;
	}

	isCacheValid(): boolean {
		return Date.now() - this.cacheTimestamp <= this.CACHE_TTL;
	}

	isApiConfigured(): boolean {
		const providerConfig = this.getCurrentProviderConfig();
		return !!(providerConfig && providerConfig.apiKey && providerConfig.apiKey.trim() !== '');
	}
}
