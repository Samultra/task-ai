import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
	? createClient(supabaseUrl, supabaseAnonKey)
	: null;
