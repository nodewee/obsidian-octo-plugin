import { App, PluginSettingTab, Setting, Notice, Plugin } from 'obsidian';
import { StateController } from '../core/StateController';
import { i18n } from '../i18n/I18n';

export class OctoSettingTab extends PluginSettingTab {
	private state: StateController;
	private plugin: Plugin & { saveSettings(): Promise<void> };

	constructor(app: App, plugin: Plugin & { saveSettings(): Promise<void> }, state: StateController) {
		super(app, plugin);
		this.state = state;
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.renderUsageSection(containerEl);
		this.renderApiProviderSection(containerEl);
		this.renderDevModeSection(containerEl);
		this.renderCustomPromptSection(containerEl);
		this.renderCacheSection(containerEl);
		this.renderLanguageSection(containerEl);
	}

	private renderUsageSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		const usageInfo = container.createDiv({ cls: 'octo-usage-info' });
		const usageDiv = usageInfo.createDiv({ cls: 'octo-usage-div' });

		const footerPara = usageDiv.createEl('p', { cls: 'octo-usage-footer' });
		footerPara.textContent = i18n.t('settings.usage.footer');

		usageDiv.createEl('br');

		const entryPointsPara = usageDiv.createEl('p', { cls: 'octo-usage-entry-points' });
		entryPointsPara.textContent = i18n.t('settings.usage.entryPoints');

		const entryPointsUl = usageDiv.createEl('ul', { cls: 'octo-usage-entry-points-ul' });

		const hotkeyLi = entryPointsUl.createEl('li', { cls: 'octo-usage-entry-points-li' });
		hotkeyLi.textContent = i18n.t('settings.usage.hotkey');

		const commandPaletteLi = entryPointsUl.createEl('li', { cls: 'octo-usage-entry-points-li' });
		commandPaletteLi.textContent = i18n.t('settings.usage.commandPalette', {
			organizeCurrentNote: i18n.t('commands.organizeCurrentNote'),
			organize: i18n.t('commands.organize')
		});

		const rightClickLi = entryPointsUl.createEl('li', { cls: 'octo-usage-entry-points-li' });
		rightClickLi.textContent = i18n.t('settings.usage.rightClickMenu', {
			organizeThisNote: i18n.t('commands.organizeThisNote')
		});

		const setHotkeyPara = usageDiv.createEl('p', { cls: 'octo-usage-set-hotkey' });
		setHotkeyPara.textContent = i18n.t('settings.usage.setHotkey');

		const setHotkeyDescPara = usageDiv.createEl('p', { cls: 'octo-usage-set-hotkey-desc' });
		setHotkeyDescPara.textContent = i18n.t('settings.usage.setHotkeyDesc', {
			organizeCurrentNote: i18n.t('commands.organizeCurrentNote')
		});
	}

	private renderApiProviderSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		new Setting(container)
			.setName(i18n.t('settings.apiProvider.name'))
			.setDesc(i18n.t('settings.apiProvider.desc'))
			.addDropdown(dropdown => dropdown
				.addOption('DeepSeek', 'Deepseek')
				.addOption('OpenAI', 'Openai')
				.addOption('Kimi', 'Kimi')
				.addOption('Custom', 'Custom')
				.setValue(this.state.getSettings().apiProvider)
				.onChange(async (value) => {
					this.state.updateSettings({ apiProvider: value as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom' });
					await this.plugin.saveSettings();
					this.display();
				}));

		const currentProvider = this.state.getSettings().apiProvider;
		const providerConfig = this.state.getSettings().providers[currentProvider];
		const providerName: string = this.getProviderDisplayName(currentProvider);

		this.renderApiKeySetting(container, currentProvider, providerName, providerConfig.apiKey);
		this.renderModelNameSetting(container, currentProvider, providerConfig.modelName);
		this.renderBaseUrlSetting(container, currentProvider, providerConfig.baseUrl);
	}

	private getProviderDisplayName(provider: string): string {
		switch (provider) {
			case 'DeepSeek':
				return 'deepseek';
			case 'OpenAI':
				return 'openai';
			case 'Kimi':
				return 'kimi';
			default:
				return provider;
		}
	}

	private renderApiKeySetting(container: HTMLElement, currentProvider: string, providerName: string, apiKey: string): void {
		new Setting(container)
			.setName(i18n.t('settings.apiKey.name'))
			.setDesc(i18n.t('settings.apiKey.desc', { provider: providerName }))
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(apiKey)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					const providerKey = currentProvider as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom';
					settings.providers[providerKey].apiKey = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));
	}

	private renderModelNameSetting(container: HTMLElement, currentProvider: string, modelName: string): void {
		const placeholder = this.getModelPlaceholder(currentProvider);
		
		new Setting(container)
			.setName(i18n.t('settings.modelName.name'))
			.setDesc(i18n.t('settings.modelName.desc', { provider: currentProvider }))
			.addText(text => text
				.setPlaceholder(placeholder)
				.setValue(modelName)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					const providerKey = currentProvider as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom';
					settings.providers[providerKey].modelName = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));
	}

	private renderBaseUrlSetting(container: HTMLElement, currentProvider: string, baseUrl: string): void {
		const placeholder = this.getBaseUrlPlaceholder(currentProvider);

		new Setting(container)
			.setName(i18n.t('settings.baseUrl.name'))
			.setDesc(i18n.t('settings.baseUrl.desc', { provider: currentProvider }))
			.addText(text => text
				.setPlaceholder(placeholder)
				.setValue(baseUrl)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					const providerKey = currentProvider as 'DeepSeek' | 'OpenAI' | 'Kimi' | 'Custom';
					settings.providers[providerKey].baseUrl = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));
	}

	private getModelPlaceholder(provider: string): string {
		switch (provider) {
			case 'DeepSeek':
				return 'deepseek-chat';
			case 'OpenAI':
				return 'gpt-4o-mini';
			case 'Kimi':
				return 'kimi-k2-turbo-preview';
			default:
				return 'model-name';
		}
	}

	private getBaseUrlPlaceholder(provider: string): string {
		switch (provider) {
			case 'DeepSeek':
				return 'https://api.deepseek.com';
			case 'OpenAI':
				return 'https://api.openai.com';
			case 'Kimi':
				return 'https://api.moonshot.cn';
			default:
				return 'https://your-api-base';
		}
	}

	private renderDevModeSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		new Setting(container)
			.setName(i18n.t('settings.devMode.name'))
			.setDesc(i18n.t('settings.devMode.desc'))
			.addToggle(toggle => toggle
				.setValue(this.state.getSettings().devMode)
				.onChange(async (value) => {
					this.state.updateSettings({ devMode: value });
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName(i18n.t('settings.ignoredFolders.name'))
			.setDesc(i18n.t('settings.ignoredFolders.desc'))
			.addTextArea(text => text
				.setPlaceholder(i18n.t('settings.ignoredFolders.placeholder'))
				.setValue(this.state.getSettings().ignoredFolders.join(', '))
				.onChange(async (value) => {
					const folders = value
						.split(',')
						.map(f => f.trim())
						.filter(f => f.length > 0);
					this.state.updateSettings({ ignoredFolders: folders });
					await this.plugin.saveSettings();
				}));
	}

	private renderCustomPromptSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		new Setting(container)
			.setName(i18n.t('settings.customPrompt.name'))
			.setDesc(i18n.t('settings.customPrompt.desc'))
			.addTextArea(text => text
				.setPlaceholder(i18n.t('settings.customPrompt.placeholder'))
				.setValue(this.state.getSettings().customPrompt)
				.onChange(async (value) => {
					this.state.updateSettings({ customPrompt: value });
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName(i18n.t('settings.resetPrompt.name'))
			.setDesc(i18n.t('settings.resetPrompt.desc'))
			.addButton(button => button
				.setButtonText(i18n.t('settings.resetPrompt.button'))
				.onClick(async () => {
					this.state.updateSettings({ customPrompt: '' });
					await this.plugin.saveSettings();
					new Notice(i18n.t('settings.resetPrompt.notice'));
					this.display();
				}));
	}

	private renderCacheSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		const cacheInfo = container.createDiv({ cls: 'octo-cache-info' });

		const foldersPara = cacheInfo.createEl('p');
		foldersPara.textContent = `${i18n.t('settings.cacheStatus.foldersCached')} ${this.state.getFolderCache().length}`;

		const tagsPara = cacheInfo.createEl('p');
		tagsPara.textContent = `${i18n.t('settings.cacheStatus.tagsCached')} ${this.state.getTagCache().length}`;

		const validPara = cacheInfo.createEl('p');
		validPara.textContent = `${i18n.t('settings.cacheStatus.cacheValid')} ${this.state.isCacheValid() ? 'Yes' : 'No'}`;

		new Setting(container)
			.setName(i18n.t('settings.refreshCache.name'))
			.setDesc(i18n.t('settings.refreshCache.desc'))
			.addButton(button => button
				.setButtonText(i18n.t('settings.refreshCache.button'))
				.setCta()
				.onClick(() => {
					this.state.clearCache();
					new Notice(i18n.t('settings.refreshCache.notice'));
					this.display();
				}));
	}

	private renderLanguageSection(container: HTMLElement): void {
		new Setting(container).setHeading();

		new Setting(container)
			.setName(i18n.t('settings.language.name'))
			.setDesc(i18n.t('settings.language.desc'))
			.addDropdown(dropdown => dropdown
				.addOption('en', 'English')
				.addOption('zh', '中文')
				.setValue(this.state.getSettings().language)
				.onChange(async (value) => {
					i18n.setLanguage(value as 'en' | 'zh');
					this.state.updateSettings({ language: value as 'en' | 'zh' });
					await this.plugin.saveSettings();
					this.display();
				}));
	}
}
