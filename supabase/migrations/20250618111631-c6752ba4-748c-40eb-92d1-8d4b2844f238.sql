
-- Remove the two columns we added previously
ALTER TABLE public.projects 
DROP COLUMN IF EXISTS writing_intention_bg,
DROP COLUMN IF EXISTS account_style_bg;

-- Add the single user_background column as requested
ALTER TABLE public.projects 
ADD COLUMN user_background jsonb;
