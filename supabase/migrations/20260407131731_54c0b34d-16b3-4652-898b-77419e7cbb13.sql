
-- Avatar configuration table
CREATE TABLE public.avatar_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  skin_tone TEXT NOT NULL DEFAULT 'medium',
  hair_style TEXT NOT NULL DEFAULT 'short',
  hair_color TEXT NOT NULL DEFAULT 'black',
  face_shape TEXT NOT NULL DEFAULT 'oval',
  eye_shape TEXT NOT NULL DEFAULT 'almond',
  eye_color TEXT NOT NULL DEFAULT 'brown',
  nose TEXT NOT NULL DEFAULT 'straight',
  mouth TEXT NOT NULL DEFAULT 'neutral',
  facial_hair TEXT NOT NULL DEFAULT 'none',
  outfit TEXT NOT NULL DEFAULT 'casual',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avatar_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar config"
  ON public.avatar_config FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar config"
  ON public.avatar_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar config"
  ON public.avatar_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Unlocked accessories table
CREATE TABLE public.unlocked_accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slot TEXT NOT NULL,
  accessory_name TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, accessory_name)
);

ALTER TABLE public.unlocked_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessories"
  ON public.unlocked_accessories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessories"
  ON public.unlocked_accessories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accessories"
  ON public.unlocked_accessories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
