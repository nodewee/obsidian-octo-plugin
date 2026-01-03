import { App, Modal, Setting } from 'obsidian';
import { NoteContext } from '../types/index';
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
				text.inputEl.classList.add('octo-dev-textarea-full-width');
				text.inputEl.classList.add('octo-dev-textarea-monospace');
			});

		new Setting(contentEl)
			.setName(i18n.t('devMode.systemPrompt.name'))
			.setDesc(i18n.t('devMode.systemPrompt.desc'))
			.addTextArea(text => {
				text.setValue(this.prompt);
				text.inputEl.rows = 15;
				text.inputEl.classList.add('octo-dev-textarea-full-width');
				text.inputEl.classList.add('octo-dev-textarea-monospace');
				text.onChange((value) => {
					this.prompt = value;
				});
			});

		this.statusEl = contentEl.createDiv({ cls: 'octo-dev-status' });
		this.statusEl.classList.add('octo-dev-status-hidden');
		this.statusEl.classList.add('octo-dev-status-padding');
		this.statusEl.classList.add('octo-dev-status-margin');
		this.statusEl.classList.add('octo-dev-status-radius');

		new Setting(contentEl)
			.setName(i18n.t('devMode.requestStatus.name'))
			.setDesc(i18n.t('devMode.requestStatus.desc'))
			.addExtraButton(button => button.setIcon('refresh').setTooltip('Refresh'));

		this.responseEl = contentEl.createDiv({ cls: 'octo-dev-response' });
		this.responseEl.classList.add('octo-dev-response-hidden');
		this.responseEl.classList.add('octo-dev-response-padding');
		this.responseEl.classList.add('octo-dev-response-margin');

		const buttonContainer = contentEl.createDiv({ cls: 'octo-dev-modal-buttons' });
		buttonContainer.classList.add('octo-dev-modal-buttons-flex');
		buttonContainer.classList.add('octo-dev-modal-buttons-justify');
		buttonContainer.classList.add('octo-dev-modal-buttons-gap');
		buttonContainer.classList.add('octo-dev-modal-buttons-margin');

		const cancelButton = buttonContainer.createEl('button', { text: 'Close' });
		cancelButton.addEventListener('click', () => this.close());

		this.sendButton = buttonContainer.createEl('button', { 
			text: i18n.t('devMode.send'),
			cls: 'mod-cta'
		});
		this.sendButton.addEventListener('click', () => {
			void this.sendRequest();
		});
	}

	private async sendRequest(): Promise<void> {
		this.sendButton.disabled = true;
		this.sendButton.textContent = i18n.t('devMode.sending');
		this.statusEl.classList.remove('octo-dev-status-hidden');
		this.statusEl.textContent = i18n.t('devMode.requestStatus.sending');
		this.statusEl.classList.add('octo-dev-status-info');
		this.responseEl.classList.add('octo-dev-response-hidden');

		try {
			const settings = this.state.getSettings();
			const providerConfig = this.state.getCurrentProviderConfig();
			const apiClient = new APIClient(this.app, providerConfig, settings.customPrompt);
			const noteOrganizer = new NoteOrganizer(this.app, this.state);

			const response = await apiClient.organizeNoteWithPrompt(this.context, this.prompt);
			
			this.statusEl.textContent = i18n.t('devMode.requestStatus.success');
			this.statusEl.classList.remove('octo-dev-status-info');
			this.statusEl.classList.add('octo-dev-status-success');

			this.responseEl.classList.remove('octo-dev-response-hidden');
			this.responseEl.empty();
			this.responseEl.createEl('h4', { text: i18n.t('devMode.response'), cls: 'octo-dev-response-title' });
			const responsePre = this.responseEl.createEl('pre', { cls: 'octo-dev-response-pre' });
			responsePre.textContent = JSON.stringify(response, null, 2);

			void noteOrganizer.organizeNoteWithResponse(this.file, response, this.context.content);
			
			this.sendButton.textContent = i18n.t('devMode.done');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			
			this.statusEl.textContent = i18n.t('devMode.requestStatus.error', { error: errorMessage });
			this.statusEl.classList.remove('octo-dev-status-info');
			this.statusEl.classList.add('octo-dev-status-error');
			
			this.responseEl.classList.remove('octo-dev-response-hidden');
			this.responseEl.empty();
			this.responseEl.createEl('h4', { text: i18n.t('devMode.errorDetails'), cls: 'octo-dev-response-title' });
			const errorPre = this.responseEl.createEl('pre', { cls: 'octo-dev-response-pre' });
			errorPre.textContent = errorStack || errorMessage;
			
			this.sendButton.disabled = false;
			this.sendButton.textContent = i18n.t('devMode.retry');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
