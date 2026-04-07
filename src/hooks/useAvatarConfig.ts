import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from '@/lib/avatar-options';
import { toast } from 'sonner';

export function useAvatarConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['avatar-config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatar_config')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No config exists yet, create default
        const { data: newData } = await supabase
          .from('avatar_config')
          .insert({ user_id: user!.id, ...DEFAULT_AVATAR_CONFIG })
          .select()
          .single();
        return newData as unknown as AvatarConfig & { avatar_url: string | null };
      }
      return data as unknown as AvatarConfig & { avatar_url: string | null };
    },
    enabled: !!user,
  });

  const saveConfig = useCallback(async (newConfig: AvatarConfig) => {
    if (!user) return;
    const { error } = await supabase
      .from('avatar_config')
      .update({
        skin_tone: newConfig.skin_tone,
        hair_style: newConfig.hair_style,
        hair_color: newConfig.hair_color,
        face_shape: newConfig.face_shape,
        eye_shape: newConfig.eye_shape,
        eye_color: newConfig.eye_color,
        nose: newConfig.nose,
        mouth: newConfig.mouth,
        facial_hair: newConfig.facial_hair,
        outfit: newConfig.outfit,
        gender: newConfig.gender,
        eyebrows: newConfig.eyebrows,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Error guardando configuración');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['avatar-config'] });
  }, [user, queryClient]);

  const generateAvatar = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-avatar');

      if (error) {
        toast.error('Error generando avatar');
        console.error(error);
        return;
      }

      if (data?.avatar_url) {
        queryClient.invalidateQueries({ queryKey: ['avatar-config'] });
        toast.success('¡Avatar generado!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error generando avatar');
    } finally {
      setGenerating(false);
    }
  }, [user, queryClient]);

  return {
    config: config ?? null,
    isLoading,
    generating,
    saveConfig,
    generateAvatar,
  };
}
