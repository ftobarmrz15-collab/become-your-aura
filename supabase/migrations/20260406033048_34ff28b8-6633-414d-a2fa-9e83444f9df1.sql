
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Users table (profiles)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  monthly_goal INT DEFAULT 20,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = user_id);

-- Avatar state
CREATE TABLE public.avatar_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1,
  total_xp INT NOT NULL DEFAULT 0,
  strength INT NOT NULL DEFAULT 0,
  discipline INT NOT NULL DEFAULT 0,
  creativity INT NOT NULL DEFAULT 0,
  charisma INT NOT NULL DEFAULT 0,
  flow INT NOT NULL DEFAULT 0,
  courage INT NOT NULL DEFAULT 0,
  focus INT NOT NULL DEFAULT 0,
  freedom INT NOT NULL DEFAULT 0,
  dominant_attribute TEXT DEFAULT 'strength',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.avatar_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own avatar" ON public.avatar_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own avatar" ON public.avatar_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own avatar" ON public.avatar_state FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_avatar_state_updated_at BEFORE UPDATE ON public.avatar_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Streaks
CREATE TABLE public.streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  shield_available BOOLEAN DEFAULT true
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- Activity types
CREATE TABLE public.activity_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT NOT NULL,
  attribute_boosts JSONB NOT NULL DEFAULT '{}',
  is_custom BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view global activity types" ON public.activity_types FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert custom activity types" ON public.activity_types FOR INSERT WITH CHECK (auth.uid() = user_id AND is_custom = true);

-- Activities (logged)
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id),
  duration_minutes INT NOT NULL DEFAULT 30,
  note TEXT,
  xp_earned INT NOT NULL DEFAULT 0,
  attribute_deltas JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Uploads
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_path TEXT,
  is_highlight BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own uploads" ON public.uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User favorite activities (selected during onboarding)
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
  UNIQUE(user_id, activity_type_id)
);
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for activity uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('activity-uploads', 'activity-uploads', true);
CREATE POLICY "Users can upload activity evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'activity-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view activity uploads" ON storage.objects FOR SELECT USING (bucket_id = 'activity-uploads');
