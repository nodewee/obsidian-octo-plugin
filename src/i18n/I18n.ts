import en from './en.json';
import zh from './zh.json';

export type Language = 'en' | 'zh';

interface TranslationData {
	[key: string]: unknown;
}

const translations: Record<Language, TranslationData> = {
	en,
	zh
};

class I18n {
	private currentLanguage: Language = 'en';

	constructor() {
		this.detectLanguage();
	}

	private detectLanguage(): void {
		const locale = navigator.language.toLowerCase();
		if (locale.startsWith('zh')) {
			this.currentLanguage = 'zh';
		} else {
			this.currentLanguage = 'en';
		}
	}

	setLanguage(language: Language): void {
		this.currentLanguage = language;
	}

	getLanguage(): Language {
		return this.currentLanguage;
	}

	t(key: string, params?: Record<string, string | number>): string {
		const keys = key.split('.');
		let value: unknown = translations[this.currentLanguage];

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = (value as Record<string, unknown>)[k];
			} else {
				return key;
			}
		}

		if (typeof value !== 'string') {
			return key;
		}

		if (params) {
			return this.interpolate(value, params);
		}

		return value;
	}

	private interpolate(template: string, params: Record<string, string | number>): string {
		return template.replace(/\{(\w+)\}/g, (match, key) => {
			return key in params ? String(params[key as keyof typeof params]) : match;
		});
	}
}

export const i18n = new I18n();
