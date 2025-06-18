
-- Create user_background_cards table to store user background information
CREATE TABLE public.user_background_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personalities', 'intentions', 'resources', 'accountStyles')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_background_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for user_background_cards
CREATE POLICY "Users can view their own background cards" 
  ON public.user_background_cards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own background cards" 
  ON public.user_background_cards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own background cards" 
  ON public.user_background_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own background cards" 
  ON public.user_background_cards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_user_background_cards
  BEFORE UPDATE ON public.user_background_cards
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
