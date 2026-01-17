import { OctoResponse, NoteContext, ProviderConfig } from '../types/index';
import { App, requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian';
import DEFAULT_PROMPT from '../../prompts/default-prompt.md';

interface APIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

interface ParsedResponse {
	title?: string;
	path?: string;
	tags?: unknown;
}

export class APIClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly model: string;
	private readonly customPrompt: string;
	private readonly app: App;

	constructor(app: App, providerConfig: ProviderConfig, customPrompt: string = '') {
		this.app = app;
		this.apiKey = providerConfig.apiKey;
		this.baseUrl = providerConfig.baseUrl;
		this.model = providerConfig.modelName;
		this.customPrompt = customPrompt;
	}

	async organizeNote(context: NoteContext): Promise<OctoResponse> {
		const prompt = this.buildPrompt(context);
		return this.organizeNoteWithPrompt(context, prompt);
	}

	async organizeNoteWithPrompt(context: NoteContext, prompt: string): Promise<OctoResponse> {
		const requestBody = this.buildRequestBody(prompt, context.content);
		const response = await this.sendAPIRequest(requestBody);
		return this.parseResponse(response);
	}

	private buildRequestBody(prompt: string, content: string): Record<string, unknown> {
		return {
			model: this.model,
			messages: [
				{
					role: 'system',
					content: prompt
				},
				{
					role: 'user',
					content: content
				}
			],
			temperature: 0.3,
			stream: false
		};
	}

	private async sendAPIRequest(body: Record<string, unknown>): Promise<string> {
		const requestParams: RequestUrlParam = {
			url: `${this.baseUrl}/chat/completions`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify(body)
		};

		const response = await requestUrl(requestParams);
		this.validateResponseStatus(response);
		return this.extractContentFromResponse(response);
	}

	private validateResponseStatus(response: RequestUrlResponse): void {
		if (response.status >= 400) {
			throw new Error(`API request failed: ${response.status} ${response.text}`);
		}
	}

	private extractContentFromResponse(response: RequestUrlResponse): string {
		const data = response.json as APIResponse;
		if (!data.choices || data.choices.length === 0) {
			throw new Error('No choices returned from API');
		}
		return data.choices[0].message.content;
	}

	private getDefaultPrompt(): string {
		return DEFAULT_PROMPT;
	}

	buildPrompt(context: NoteContext): string {
		const promptTemplate = this.customPrompt || this.getDefaultPrompt();
		const filteredFolders = this.formatFolders(context.existingFolders);
		const topTags = this.formatTags(context.existingTags);
		const currentPathDisplay = this.formatCurrentPath(context.currentPath);

		return promptTemplate
			.replace(/\{\{folders\}\}/g, filteredFolders)
			.replace(/\{\{tags\}\}/g, topTags)
			.replace(/\{\{currentTitle\}\}/g, context.currentTitle)
			.replace(/\{\{currentPath\}\}/g, currentPathDisplay);
	}

	private formatFolders(folders: string[]): string {
		return folders
			.filter(f => f !== '/' && f !== '')
			.map(f => f.replace(/^\//, ''))
			.join(', ') || '(none)';
	}

	private formatCurrentPath(currentPath: string): string {
		return currentPath === '' ? '(root)' : currentPath.replace(/^\//, '');
	}

	private formatTags(tags: string[]): string {
		return tags.slice(0, 20).join(', ') || '(none)';
	}

	private parseResponse(content: string): OctoResponse {
		const jsonMatch = this.extractJSONFromContent(content);
		const parsed = this.parseJSONResponse(jsonMatch);
		return this.normalizeResponse(parsed);
	}

	private extractJSONFromContent(content: string): string {
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No valid JSON found in response');
		}
		return jsonMatch[0];
	}

	private parseJSONResponse(jsonString: string): ParsedResponse {
		try {
			return JSON.parse(jsonString) as ParsedResponse;
		} catch (error) {
			throw new Error(`Failed to parse JSON response: ${error}`);
		}
	}

	private normalizeResponse(parsed: ParsedResponse): OctoResponse {
		return {
			title: parsed.title || '',
			path: parsed.path || '',
			tags: Array.isArray(parsed.tags) ? parsed.tags as string[] : []
		};
	}
}
