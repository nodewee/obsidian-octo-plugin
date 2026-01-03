import { Language } from '../i18n/I18n';

export interface ProviderConfig {
	apiKey: string;
	modelName: string;
	baseUrl: string;
}

export interface OctoSettings {
	apiProvider: 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom';
	providers: Record<'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom', ProviderConfig>;
	devMode: boolean;
	ignoredFolders: string[];
	customPrompt: string;
	language: Language;
}

export interface OctoResponse {
	title: string;
	path: string;
	tags: string[];
}

export interface NoteContext {
	content: string;
	currentTitle: string;
	currentPath: string;
	existingFolders: string[];
	existingTags: string[];
}

export interface FolderFilterResult {
	folders: string[];
	ignored: string[];
}
