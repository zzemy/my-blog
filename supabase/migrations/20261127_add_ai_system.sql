-- AI System Tables for Blog
-- 包含：多厂商 Provider 配置、按任务模型路由与 Prompt 配置、多语言文章译文表、调用日志表

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AI Provider 配置表（支持 OpenAI 兼容 / Anthropic / Gemini）
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('openai-compatible', 'anthropic', 'gemini')),
  base_url TEXT NOT NULL,
  key_mode TEXT NOT NULL DEFAULT 'encrypted' CHECK (key_mode IN ('encrypted', 'env')),
  api_key_encrypted TEXT,
  api_key_mask TEXT,
  env_var_name TEXT,
  models JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_model TEXT NOT NULL DEFAULT '',
  custom_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. 按任务路由与 Prompt 配置表
CREATE TABLE IF NOT EXISTS ai_task_configs (
  task_key TEXT PRIMARY KEY CHECK (task_key IN ('summary', 'metadata', 'translate', 'rewrite', 'outline')),
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  model TEXT,
  temperature REAL NOT NULL DEFAULT 0.3,
  max_tokens INTEGER NOT NULL DEFAULT 2048,
  system_prompt TEXT,
  glossary JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. 多语言文章译文表（无损 TipTap JSON）
CREATE TABLE IF NOT EXISTS post_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ai_summary JSONB,
  content JSONB NOT NULL,
  source_hash TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(post_id, locale)
);

-- 4. AI 调用日志与用量统计表
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  task_key TEXT NOT NULL,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS ai_providers_enabled_idx ON ai_providers(enabled);
CREATE INDEX IF NOT EXISTS post_translations_post_id_idx ON post_translations(post_id);
CREATE INDEX IF NOT EXISTS post_translations_published_idx ON post_translations(post_id, published);
CREATE INDEX IF NOT EXISTS ai_generation_logs_created_at_idx ON ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generation_logs_task_key_idx ON ai_generation_logs(task_key);

-- 自动更新 updated_at 触发器（依赖 schema.sql 中的 update_updated_at_column）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_providers_updated_at ON ai_providers;
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_task_configs_updated_at ON ai_task_configs;
CREATE TRIGGER update_ai_task_configs_updated_at
  BEFORE UPDATE ON ai_task_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_translations_updated_at ON post_translations;
CREATE TRIGGER update_post_translations_updated_at
  BEFORE UPDATE ON post_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 初始化默认任务路由行
INSERT INTO ai_task_configs (task_key, temperature, max_tokens) VALUES
  ('summary', 0.3, 1200),
  ('metadata', 0.3, 1000),
  ('translate', 0.2, 4096),
  ('rewrite', 0.5, 2048),
  ('outline', 0.6, 2048)
ON CONFLICT (task_key) DO NOTHING;

-- 行级安全策略（防止 anon 角色读取敏感 Provider 配置与日志）
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin authenticated full access to ai_providers" ON ai_providers;
CREATE POLICY "Admin authenticated full access to ai_providers"
  ON ai_providers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin authenticated full access to ai_task_configs" ON ai_task_configs;
CREATE POLICY "Admin authenticated full access to ai_task_configs"
  ON ai_task_configs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view published post_translations" ON post_translations;
CREATE POLICY "Public can view published post_translations"
  ON post_translations FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Admin authenticated full access to post_translations" ON post_translations;
CREATE POLICY "Admin authenticated full access to post_translations"
  ON post_translations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin authenticated full access to ai_generation_logs" ON ai_generation_logs;
CREATE POLICY "Admin authenticated full access to ai_generation_logs"
  ON ai_generation_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
