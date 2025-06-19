
-- Create table for canvas items
CREATE TABLE public.canvas_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- The id from the API response
  type TEXT NOT NULL DEFAULT 'canvas',
  title TEXT NOT NULL,
  content TEXT,
  keyword TEXT,
  author TEXT,
  author_avatar TEXT,
  like_count INTEGER DEFAULT 0,
  collect_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  cover_url TEXT,
  url TEXT,
  platform TEXT,
  ip_location TEXT,
  tags TEXT[], -- Array of tags
  create_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for insights
CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- The id from the API response
  type TEXT NOT NULL DEFAULT 'insight',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL, -- The "text" field from API
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for canvas_items
ALTER TABLE public.canvas_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canvas items" 
  ON public.canvas_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = canvas_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own canvas items" 
  ON public.canvas_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = canvas_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own canvas items" 
  ON public.canvas_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = canvas_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own canvas items" 
  ON public.canvas_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = canvas_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Add RLS policies for insights
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" 
  ON public.insights 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = insights.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own insights" 
  ON public.insights 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = insights.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own insights" 
  ON public.insights 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = insights.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own insights" 
  ON public.insights 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = insights.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_canvas_items_project_id ON public.canvas_items(project_id);
CREATE INDEX idx_canvas_items_external_id ON public.canvas_items(external_id);
CREATE INDEX idx_insights_project_id ON public.insights(project_id);
CREATE INDEX idx_insights_external_id ON public.insights(external_id);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_canvas_items 
  BEFORE UPDATE ON public.canvas_items 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_insights 
  BEFORE UPDATE ON public.insights 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
