import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Очищаем URL от лишних путей
let supabaseUrl = rawSupabaseUrl;
if (rawSupabaseUrl) {
  // Убираем только /task-ai/ если есть в конце
  supabaseUrl = rawSupabaseUrl.replace(/\/task-ai\/?$/, '');
  console.log('Original Supabase URL:', rawSupabaseUrl);
  console.log('Cleaned Supabase URL:', supabaseUrl);
}

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn("Supabase env variables are not set. Please create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

// Проверяем, настроен ли Supabase правильно
export const isSupabaseConfigured = () => {
	return !!(supabaseUrl && supabaseAnonKey && 
		supabaseUrl !== "https://placeholder.supabase.co" && 
		supabaseAnonKey !== "placeholder-key" &&
		supabaseUrl.startsWith("https://") &&
		supabaseAnonKey.startsWith("eyJ"));
};

// Создаем клиент только если Supabase настроен правильно
export const supabase = isSupabaseConfigured() 
	? createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
		},
		global: {
			headers: {
				'X-Client-Info': 'task-ai-app'
			}
		}
	})
	: null;
