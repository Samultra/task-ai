const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;

function getApiKey(): string {
	// Попробуем несколько способов получить API ключ
	let key = import.meta.env.VITE_OPENAI_API_KEY as string;
	
	// Fallback для GitHub Pages - попробуем получить из window
	if (!key && typeof window !== 'undefined') {
		key = (window as any).OPENAI_API_KEY;
	}
	
	console.log('=== OpenAI API Key Debug ===');
	console.log('Environment:', import.meta.env.MODE);
	console.log('Raw env value:', import.meta.env.VITE_OPENAI_API_KEY);
	console.log('Window value:', typeof window !== 'undefined' ? (window as any).OPENAI_API_KEY : 'N/A');
	console.log('Key exists:', !!key);
	console.log('Key length:', key ? key.length : 0);
	console.log('Key starts with sk-proj:', key ? key.startsWith('sk-proj') : false);
	console.log('Key preview:', key ? `${key.substring(0, 15)}...` : 'NOT FOUND');
	console.log('================================');
	
	if (!key) {
		console.error('API key not found! Please check:');
		console.error('1. VITE_OPENAI_API_KEY environment variable');
		console.error('2. window.OPENAI_API_KEY for GitHub Pages');
		console.error('3. Check if API key is set in index.html script');
		throw new Error('VITE_OPENAI_API_KEY is missing - check console for details');
	}
	if (!key.startsWith('sk-proj')) throw new Error('API key format is invalid - should start with "sk-proj"');
	return key;
}

function getModel(): string {
	// OpenAI модели
	const openaiModels = [
		"gpt-4o-mini", // дешевая и быстрая
		"gpt-4o",      // более мощная
		"gpt-3.5-turbo" // fallback
	];
	
	const envModel = import.meta.env.VITE_OPENAI_MODEL as string;
	if (envModel) return envModel;
	
	// Используем gpt-4o-mini по умолчанию
	return openaiModels[0];
}

async function callOpenAI(messages: { role: "user"|"assistant"|"system"; content: string }[]) {
	const model = getModel();

	const useProxy = !!API_BASE || (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'));
	const proxyUrl = (API_BASE ? `${API_BASE}` : '') + '/api/chat';
	const url = useProxy ? proxyUrl : OPENAI_API_URL;
	const requestBody = { model, messages, temperature: 0.6 };

	console.log('=== OpenAI Request Debug ===');
	console.log('Using model:', model);
	console.log('Using proxy:', useProxy, 'URL:', url);
	console.log('Request body:', JSON.stringify(requestBody, null, 2));
	console.log('================================');

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (!useProxy) {
		const apiKey = getApiKey();
		headers['Authorization'] = `Bearer ${apiKey}`;
	}

	const res = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(requestBody)
	});

	const text = await res.text();
	console.log('=== OpenAI Response Debug ===');
	console.log('Response status:', res.status);
	console.log('Response headers:', Object.fromEntries(res.headers.entries()));
	console.log('Response body:', text);
	console.log('================================');

	if (!res.ok) {
		const errorMsg = `OpenAI API Error ${res.status}: ${text}`;
		console.error(errorMsg);
		throw new Error(errorMsg);
	}

	const json = JSON.parse(text);
	return (json.choices?.[0]?.message?.content ?? '').trim();
}

export async function toSMART(taskTitle: string, context?: string) {
	const prompt = `Переформулируй задачу в формат SMART на русском. Верни JSON:
{
  "title": string,
  "smart": string
}
Задача: ${taskTitle}\nКонтекст: ${context ?? ''}`;
	const content = await callOpenAI([{ role: 'user', content: prompt }]);
	return content;
}

export async function makeSubtasks(taskTitle: string, context?: string) {
	const prompt = `Разбей задачу на 3-7 подзадач и оцени время (час:мин). Верни JSON-массив:
[{"title": string, "estimate": "HH:MM"}]
Задача: ${taskTitle}\nКонтекст: ${context ?? ''}`;
	const content = await callOpenAI([{ role: 'user', content: prompt }]);
	return content;
}

export async function buildDayPlan(tasks: { title: string, priority: 'low'|'medium'|'high', estimateMinutes?: number }[]) {
	const prompt = `Сгенерируй расписание дня с таймблоками (формат 24ч), учитывая приоритет:
Вход (JSON): ${JSON.stringify(tasks)}
Верни JSON-массив блоков: [{"time": "HH:MM-HH:MM", "title": string, "note": string}]`;
	const content = await callOpenAI([{ role: 'user', content: prompt }]);
	return content;
}
