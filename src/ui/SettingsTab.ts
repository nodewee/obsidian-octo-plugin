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

		new Setting(containerEl).setName("").setHeading();

		const usageInfo = containerEl.createDiv({ cls: 'octo-usage-info' });
		const usageDiv = usageInfo.createDiv({ cls: 'octo-usage-div' });

		const footerPara = usageDiv.createEl('p', { cls: 'octo-usage-footer' });
		footerPara.textContent = i18n.t('settings.usage.footer');

		usageDiv.createEl('br');

		const entryPointsPara = usageDiv.createEl('p', { cls: 'octo-usage-entry-points' });
		entryPointsPara.innerHTML = `<strong>${i18n.t('settings.usage.entryPoints')}</strong>`;

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
		setHotkeyPara.innerHTML = `<strong>${i18n.t('settings.usage.setHotkey')}</strong>`;

		const setHotkeyDescPara = usageDiv.createEl('p', { cls: 'octo-usage-set-hotkey-desc' });
		setHotkeyDescPara.textContent = i18n.t('settings.usage.setHotkeyDesc', {
			organizeCurrentNote: i18n.t('commands.organizeCurrentNote')
		});

		new Setting(containerEl).setName("").setHeading();

		new Setting(containerEl)
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
		const providerName: string = currentProvider === 'DeepSeek' ? 'deepseek' : currentProvider === 'OpenAI' ? 'openai' : currentProvider === 'Kimi' ? 'kimi' : currentProvider;

		new Setting(containerEl)
			.setName(i18n.t('settings.apiKey.name'))
			.setDesc(i18n.t('settings.apiKey.desc', { provider: providerName }))
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(providerConfig.apiKey)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					settings.providers[currentProvider].apiKey = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.modelName.name'))
			.setDesc(i18n.t('settings.modelName.desc', { provider: currentProvider }))
			.addText(text => text
				.setPlaceholder(currentProvider === 'DeepSeek' ? 'deepseek-chat' : currentProvider === 'OpenAI' ? 'gpt-4o-mini' : currentProvider === 'Kimi' ? 'kimi-k2-turbo-preview' : 'model-name')
				.setValue(providerConfig.modelName)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					settings.providers[currentProvider].modelName = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.baseUrl.name'))
			.setDesc(i18n.t('settings.baseUrl.desc', { provider: currentProvider }))
			.addText(text => text
				.setPlaceholder(currentProvider === 'DeepSeek' ? 'https://api.deepseek.com' : currentProvider === 'OpenAI' ? 'https://api.openai.com' : currentProvider === 'Kimi' ? 'https://api.moonshot.cn' : 'https://your-api-base')
				.setValue(providerConfig.baseUrl)
				.onChange(async (value) => {
					const settings = this.state.getSettings();
					settings.providers[currentProvider].baseUrl = value;
					this.state.updateSettings(settings);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName("").setHeading();

		new Setting(containerEl)
			.setName(i18n.t('settings.devMode.name'))
			.setDesc(i18n.t('settings.devMode.desc'))
			.addToggle(toggle => toggle
				.setValue(this.state.getSettings().devMode)
				.onChange(async (value) => {
					this.state.updateSettings({ devMode: value });
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
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

		new Setting(containerEl).setName("").setHeading();

		new Setting(containerEl)
			.setName(i18n.t('settings.customPrompt.name'))
			.setDesc(i18n.t('settings.customPrompt.desc'))
			.addTextArea(text => text
				.setPlaceholder(i18n.t('settings.customPrompt.placeholder'))
				.setValue(this.state.getSettings().customPrompt)
				.onChange(async (value) => {
					this.state.updateSettings({ customPrompt: value });
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
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

		new Setting(containerEl).setName("").setHeading();

		const cacheInfo = containerEl.createDiv({ cls: 'octo-cache-info' });

		const foldersPara = cacheInfo.createEl('p');
		foldersPara.innerHTML = `<strong>${i18n.t('settings.cacheStatus.foldersCached')}</strong> ${this.state.getFolderCache().length}`;

		const tagsPara = cacheInfo.createEl('p');
		tagsPara.innerHTML = `<strong>${i18n.t('settings.cacheStatus.tagsCached')}</strong> ${this.state.getTagCache().length}`;

		const validPara = cacheInfo.createEl('p');
		validPara.innerHTML = `<strong>${i18n.t('settings.cacheStatus.cacheValid')}</strong> ${this.state.isCacheValid() ? 'Yes' : 'No'}`;

		new Setting(containerEl)
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

		new Setting(containerEl).setName("").setHeading();

		new Setting(containerEl)
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
