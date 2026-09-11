import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.NG_APP_SUPABASE_ANON_KEY ?? '',
  appName: 'Consultorio del Amor',
};