-- Future backend schema for Lexora Legal Academy.
-- PostgreSQL-flavoured SQL; the current React application does not connect to it.

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(160) NOT NULL,
  university VARCHAR(240),
  study_year VARCHAR(60),
  primary_goal VARCHAR(120),
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  appearance VARCHAR(20) NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE legal_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  parent_id UUID REFERENCES legal_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE legal_sources (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  jurisdiction VARCHAR(160),
  source_type VARCHAR(50) NOT NULL,
  base_url TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES legal_categories(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(320) NOT NULL UNIQUE,
  description TEXT,
  difficulty VARCHAR(40),
  estimated_minutes INTEGER CHECK (estimated_minutes >= 0),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  author_name VARCHAR(200),
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE modules (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, position)
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER CHECK (estimated_minutes >= 0),
  position INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module_id, position)
);

CREATE TABLE legal_documents (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES legal_categories(id) ON DELETE SET NULL,
  source_id UUID REFERENCES legal_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_number VARCHAR(160),
  document_type VARCHAR(100),
  jurisdiction VARCHAR(160),
  language VARCHAR(10),
  legal_status VARCHAR(30),
  publication_date DATE,
  adoption_date DATE,
  last_modified_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  original_url TEXT,
  citation TEXT,
  summary TEXT,
  indexed_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  record_status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE court_cases (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES legal_sources(id) ON DELETE SET NULL,
  category_id UUID REFERENCES legal_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  court VARCHAR(240),
  decided_on DATE,
  classification VARCHAR(30) NOT NULL CHECK (classification IN ('sourced', 'hypothetical')),
  original_url TEXT,
  facts TEXT,
  legal_issue TEXT,
  arguments JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision TEXT,
  reasoning TEXT,
  takeaway TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY,
  quiz_id UUID NOT NULL,
  question_type VARCHAR(30) NOT NULL,
  prompt TEXT NOT NULL,
  scenario TEXT,
  options JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  legal_reference JSONB,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quiz_questions
  ADD CONSTRAINT quiz_questions_quiz_fk FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  answer_snapshot JSONB NOT NULL,
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recent_views (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL,
  item_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_items (
  id UUID PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL,
  item_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, item_type, item_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(240) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX legal_documents_search_idx ON legal_documents USING GIN (to_tsvector('simple', title || ' ' || COALESCE(summary, '')));
CREATE INDEX court_cases_category_idx ON court_cases(category_id);
CREATE INDEX user_progress_user_idx ON user_progress(user_id, updated_at DESC);
CREATE INDEX quiz_attempts_user_idx ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX recent_views_user_idx ON recent_views(user_id, viewed_at DESC);
