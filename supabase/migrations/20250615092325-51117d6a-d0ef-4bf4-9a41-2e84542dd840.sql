
-- Add conversation_id field to projects table for Dify conversation persistence
ALTER TABLE public.projects ADD COLUMN conversation_id text;
