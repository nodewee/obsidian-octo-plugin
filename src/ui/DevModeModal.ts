import { App, Modal, Setting, TextAreaComponent, Notice } from 'obsidian';
import { NoteContext, OctoResponse, ProviderConfig } from '../types/index';
import { APIClient } from '../core/APIClient';
import { NoteOrganizer } from '../core/NoteOrganizer';
import { StateController } from '../core/StateController';
import { TFile } from 'obsidian';
import { i18n } from '../i18n/I18n';

export class DevModeModal extends Modal {
	private context: NoteContext;
	private prompt: string;
	private file: TFile;
	private state: StateController;
	private statusEl: HTMLElement;
	private responseEl: HTMLElement;
	private sendButton: HTMLButtonElement;

	constructor(
		app: App,
		file: TFile,
		context: NoteContext,
		prompt: string,
		state: StateController
	) {
		super(app);
		this.file = file;
		this.context = context;
		this.prompt = prompt;
		this.state = state;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('octo-dev-modal');

		contentEl.createEl('h2', { text: i18n.t('devMode.title') });

		new Setting(contentEl)
			.setName(i18n.t('devMode.currentNoteContext.name'))
			.setDesc(i18n.t('devMode.currentNoteContext.desc'))
			.addTextArea(text => {
				text.setValue(JSON.stringify(this.context, null, 2));
				text.inputEl.rows = 10;
				text.inputEl.readOnly = true;
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
			});

		new Setting(contentEl)
			.setName(i18n.t('devMode.systemPrompt.name'))
			.setDesc(i18n.t('devMode.systemPrompt.desc'))
			.addTextArea(text => {
				text.setValue(this.prompt);
				text.inputEl.rows = 15;
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
				text.onChange((value) => {
					this.prompt = value;
				});
			});

		this.statusEl = contentEl.createDiv({ cls: 'octo-dev-status' });
		this.statusEl.style.display = 'none';
		this.statusEl.style.padding = '12px';
		this.statusEl.style.marginTop = '16px';
		this.statusEl.style.borderRadius = '4px';

		new Setting(contentEl)
			.setName(i18n.t('devMode.requestStatus.name'))
			.setDesc(i18n.t('devMode.requestStatus.desc'))
			.addExtraButton(button => button.setIcon('refresh').setTooltip('Refresh'));

		this.responseEl = contentEl.createDiv({ cls: 'octo-dev-response' });
		this.responseEl.style.display = 'none';
		this.responseEl.style.padding = '12px';
		this.responseEl.style.marginTop = '8px';

		const buttonContainer = contentEl.createDiv({ cls: 'octo-dev-modal-buttons' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		const cancelButton = buttonContainer.createEl('button', { text: 'Close' });
		cancelButton.addEventListener('click', () => this.close());

		this.sendButton = buttonContainer.createEl('button', { 
			text: i18n.t('devMode.sending'),
			cls: 'mod-cta'
		});
		this.sendButton.addEventListener('click', () => {
			this.sendRequest();
		});
	}

	private async sendRequest(): Promise<void> {
		this.sendButton.disabled = true;
		this.sendButton.textContent = i18n.t('devMode.sending');
		this.statusEl.style.display = 'block';
		this.statusEl.textContent = i18n.t('devMode.requestStatus.sending');
		this.statusEl.style.backgroundColor = 'var(--background-modifier-info)';
		this.responseEl.style.display = 'none';

		try {
			const settings = this.state.getSettings();
			const providerConfig = this.state.getCurrentProviderConfig();
			const apiClient = new APIClient(this.app, providerConfig, settings.customPrompt);
			const noteOrganizer = new NoteOrganizer(this.app, this.state);

			const response = await apiClient.organizeNoteWithPrompt(this.context, this.prompt);
			
			this.statusEl.textContent = i18n.t('devMode.requestStatus.success');
			this.statusEl.style.backgroundColor = 'var(--background-modifier-success)';

			this.responseEl.style.display = 'block';
			this.responseEl.innerHTML = `
				<h4 style="margin: 0 0 8px 0;">${i18n.t('devMode.response')}</h4>
				<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(response, null, 2)}</pre>
			`;

			await noteOrganizer.organizeNoteWithResponse(this.file, response, this.context.content);
			
			this.sendButton.textContent = i18n.t('devMode.done');
		} catch (error: any) {
			this.statusEl.textContent = i18n.t('devMode.requestStatus.error', { error: error.message });
			this.statusEl.style.backgroundColor = 'var(--background-modifier-error)';
			
			this.responseEl.style.display = 'block';
			this.responseEl.innerHTML = `
				<h4 style="margin: 0 0 8px 0;">${i18n.t('devMode.errorDetails')}</h4>
				<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${error.stack || error.message}</pre>
			`;
			
			this.sendButton.disabled = false;
			this.sendButton.textContent = i18n.t('devMode.retry');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
