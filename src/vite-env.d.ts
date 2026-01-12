/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_TRANSCRIBE_LANGUAGE: string;
  readonly VITE_AWS_LEX_BOT_ID: string;
  readonly VITE_AWS_LEX_BOT_ALIAS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
