import { OctoResponse, NoteContext, ProviderConfig } from '../types/index';
import { App } from 'obsidian';
import DEFAULT_PROMPT from '../../prompts/default-prompt.md';

export class APIClient {
	private apiKey: string;
	private baseUrl: string;
	private model: string;
	private customPrompt: string;
	private app: App;

	constructor(app: App, providerConfig: ProviderConfig, customPrompt: string = '') {
		this.app = app;
		this.apiKey = providerConfig.apiKey;
		this.baseUrl = providerConfig.baseUrl;
		this.model = providerConfig.modelName;
		this.customPrompt = customPrompt;
	}

	async organizeNote(context: NoteContext): Promise<OctoResponse> {
		const prompt = await this.buildPrompt(context);
		return this.organizeNoteWithPrompt(context, prompt);
	}

	async organizeNoteWithPrompt(context: NoteContext, prompt: string): Promise<OctoResponse> {
		
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{
						role: 'system',
						content: prompt
					},
					{
						role: 'user',
						content: context.content
					}
				],
				temperature: 0.3,
				stream: false
			})
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const content = data.choices[0].message.content;

		return this.parseResponse(content);
	}

	private async getDefaultPrompt(): Promise<string> {
		return DEFAULT_PROMPT;
	}

	async buildPrompt(context: NoteContext): Promise<string> {
		const promptTemplate = this.customPrompt || await this.getDefaultPrompt();
		
		const filteredFolders = context.existingFolders
			.filter(f => f !== '/')
			.map(f => f.replace(/^\//, ''))
			.join(', ');

		const topTags = context.existingTags.slice(0, 20).join(', ');

		return promptTemplate
			.replace(/\{\{folders\}\}/g, filteredFolders || '(none)')
			.replace(/\{\{tags\}\}/g, topTags || '(none)')
			.replace(/\{\{currentTitle\}\}/g, context.currentTitle)
			.replace(/\{\{currentPath\}\}/g, context.currentPath);
	}

	private parseResponse(content: string): OctoResponse {
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No valid JSON found in response');
		}

		try {
			const parsed = JSON.parse(jsonMatch[0]);
			return {
				title: parsed.title || '',
				path: parsed.path || '',
				tags: Array.isArray(parsed.tags) ? parsed.tags : []
			};
		} catch (error) {
			throw new Error(`Failed to parse JSON response: ${error}`);
		}
	}
}
