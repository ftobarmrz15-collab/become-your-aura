import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get avatar config
    const { data: config } = await supabase
      .from("avatar_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!config) {
      return new Response(JSON.stringify({ error: "No avatar config found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get avatar state (stats) for evolution
    const { data: avatarState } = await supabase
      .from("avatar_state")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get equipped accessories
    const { data: accessories } = await supabase
      .from("unlocked_accessories")
      .select("*")
      .eq("user_id", user.id)
      .eq("equipped", true);

    // Build the prompt
    const prompt = buildAvatarPrompt(config, avatarState, accessories || []);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate avatar image
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageUrl =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );
    const fileName = `avatars/${user.id}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("activity-uploads")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return the base64 image directly as fallback
      return new Response(
        JSON.stringify({ avatar_url: imageUrl }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("activity-uploads")
      .getPublicUrl(fileName);

    // Save URL to avatar_config
    await supabase
      .from("avatar_config")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ avatar_url: publicUrl.publicUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildAvatarPrompt(
  config: any,
  stats: any,
  accessories: any[]
): string {
  const skinMap: Record<string, string> = {
    "very-light": "very light/pale",
    light: "light",
    "medium-light": "medium-light/olive",
    medium: "medium/tan",
    "medium-dark": "medium-dark",
    dark: "dark",
    "very-dark": "very dark/deep",
    "cool-brown": "cool brown",
  };

  const hairStyleMap: Record<string, string> = {
    short: "short cropped",
    medium: "medium length",
    long: "long flowing",
    buzzed: "buzz cut",
    braids: "braided",
    afro: "afro",
    curly: "curly",
    mohawk: "mohawk",
    ponytail: "ponytail",
    bun: "man bun/top bun",
  };

  // Build evolution descriptors from stats
  const evolutions: string[] = [];
  if (stats) {
    const str = stats.strength || 0;
    if (str > 60) evolutions.push("very muscular build with broad shoulders and defined arms");
    else if (str > 30) evolutions.push("athletic build with toned arms and noticeable shoulders");
    else if (str > 10) evolutions.push("slightly toned physique");

    const disc = stats.discipline || 0;
    if (disc > 60) evolutions.push("perfectly straight upright posture, calm serene expression, zen-like composure");
    else if (disc > 30) evolutions.push("good upright posture, focused calm expression");
    else if (disc > 10) evolutions.push("relatively good posture");

    const flow = stats.flow || 0;
    const cha = stats.charisma || 0;
    const swag = Math.max(flow, cha);
    if (swag > 60) evolutions.push("wearing trendy streetwear, relaxed confident stance, dripping with swagger");
    else if (swag > 30) evolutions.push("wearing stylish casual clothes, relaxed stance");

    const focus = stats.focus || 0;
    const cre = stats.creativity || 0;
    const wisdom = Math.max(focus, cre);
    if (wisdom > 60) evolutions.push("wearing stylish glasses, subtle glowing aura around the head");
    else if (wisdom > 30) evolutions.push("wearing thin-frame glasses");

    const courage = stats.courage || 0;
    if (courage > 60) evolutions.push("subtle energy particles or sparks around the body, confident powerful stance");
    else if (courage > 30) evolutions.push("slight glow/energy emanating from the body");

    const freedom = stats.freedom || 0;
    if (freedom > 60) evolutions.push("athletic defined legs, wearing performance/athletic outfit elements");
    else if (freedom > 30) evolutions.push("toned legs, sporty outfit elements");
  }

  // Accessories
  const accDescs = accessories.map(
    (a) => `wearing ${a.accessory_name.replace(/-/g, " ")} (${a.slot})`
  );

  const baseDesc = `Generate a stylized 2D character illustration in a modern flat art style (similar to Duolingo or Ready Player Me avatars). The character should be:
- Skin tone: ${skinMap[config.skin_tone] || config.skin_tone}
- Hair: ${hairStyleMap[config.hair_style] || config.hair_style}, ${config.hair_color} color
- Face shape: ${config.face_shape}
- Eyes: ${config.eye_shape} shaped, ${config.eye_color} color
- Nose: ${config.nose}
- Mouth: ${config.mouth}
- Facial hair: ${config.facial_hair === "none" ? "clean shaven" : config.facial_hair}
- Outfit: ${config.outfit}`;

  const evolutionDesc =
    evolutions.length > 0
      ? `\n\nPhysical evolution traits (important - these should be clearly visible):\n${evolutions.map((e) => `- ${e}`).join("\n")}`
      : "";

  const accessoryDesc =
    accDescs.length > 0 ? `\n\nAccessories:\n${accDescs.map((a) => `- ${a}`).join("\n")}` : "";

  return `${baseDesc}${evolutionDesc}${accessoryDesc}

STYLE REQUIREMENTS:
- Dark background (#0d0d14) or transparent
- Character facing slightly to the side (3/4 view)
- Full body visible from head to mid-thigh
- Clean vector-like illustration style with subtle shading
- Premium feel, NOT cartoonish - more like a stylized character portrait
- Color palette should include purple (#7c3aed) accents in clothing/accessories
- The illustration should feel aspirational and cool
- NO text or labels in the image
- Square aspect ratio, character centered`;
}
