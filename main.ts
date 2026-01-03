import { Plugin, Notice, TFile } from 'obsidian';
import { StateController } from './src/core/StateController';
import { VaultScanner } from './src/core/VaultScanner';
import { NoteOrganizer } from './src/core/NoteOrganizer';
import { APIClient } from './src/core/APIClient';
import { OctoSettingTab } from './src/ui/SettingsTab';
import { DevModeModal } from './src/ui/DevModeModal';
import { NoteContext, OctoSettings } from './src/types/index';
import { i18n } from './src/i18n/I18n';

class OctoPlugin extends Plugin {
	private state: StateController;
	private vaultScanner: VaultScanner;
	private noteOrganizer: NoteOrganizer;

	async onload() {
		console.debug('Loading Octo plugin...');

		this.state = new StateController(this.app);
		this.vaultScanner = new VaultScanner(this.app);
		this.noteOrganizer = new NoteOrganizer(this.app);

		await this.loadSettings();

		this.addCommand({
			id: 'organize-current-note',
			name: i18n.t('commands.organizeCurrentNote'),
			callback: () => {
				void this.organizeCurrentNote();
			}
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile)) {
					return;
				}
				menu.addItem((item) => {
					item
						.setTitle(i18n.t('commands.organizeThisNote'))
						.setIcon('octo')
						.onClick(() => {
							void this.organizeCurrentNote();
						});
				});
			})
		);

		this.addSettingTab(new OctoSettingTab(this.app, this, this.state));

		console.debug('Octo plugin loaded');
	}

	onunload() {
		console.debug('Unloading Octo plugin');
	}

	async loadSettings() {
		const savedData = await this.loadData() as Partial<OctoSettings> | null;
		if (savedData) {
			this.state.loadSettings(savedData);
		}
	}

	async saveSettings() {
		await this.saveData(this.state.getSettings());
	}

	private async ensureCache(): Promise<void> {
		if (!this.state.isCacheValid()) {
			await this.vaultScanner.scanAll();
		}
	}

	private async organizeCurrentNote(): Promise<void> {
		try {
			if (!this.state.isApiConfigured()) {
				new Notice(i18n.t('notices.pleaseConfigureApiKey'));
				return;
			}

			await this.ensureCache();

			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice(i18n.t('notices.noActiveNote'));
				return;
			}

			const content = await this.app.vault.read(activeFile);
			const context: NoteContext = {
				content,
				currentTitle: activeFile.basename,
				currentPath: activeFile.parent?.path || '',
				existingFolders: this.state.getFolderCache(),
				existingTags: this.state.getTagCache()
			};

			const settings = this.state.getSettings();
			const providerConfig = this.state.getCurrentProviderConfig();
			const apiClient = new APIClient(this.app, providerConfig, settings.customPrompt);
			const prompt = await apiClient.buildPrompt(context);

			if (settings.devMode) {
				new DevModeModal(
					this.app,
					activeFile,
					context,
					prompt,
					this.state
				).open();
			} else {
				await this.executeOrganization(activeFile, context, prompt);
			}
		} catch (error) {
			console.error('Error organizing note:', error);
			new Notice(i18n.t('notices.failedToStart'));
		}
	}

	private async executeOrganization(file: TFile, context: NoteContext, prompt: string): Promise<void> {
		const settings = this.state.getSettings();
		const providerConfig = this.state.getCurrentProviderConfig();
		const apiClient = new APIClient(this.app, providerConfig, settings.customPrompt);

		try {
			new Notice(i18n.t('notices.waitingForWisdom'));

			const response = await apiClient.organizeNoteWithPrompt(context, prompt);
			await this.noteOrganizer.applyOrganization(file, response, context.content);
		} catch (error: unknown) {
			console.error('Octo API Error:', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			new Notice(i18n.t('notices.apiError', { error: errorMessage }));
		}
	}
}

export default OctoPlugin;
