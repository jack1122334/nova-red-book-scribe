
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BluechatRequest {
  project_id: string;
  query: string;
  stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3';
  selected_ids?: string[];
  user_id: string;
  user_background: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, query, stage, selected_ids = [], user_id, user_background }: BluechatRequest = await req.json();
    
    console.log('Bluechat request:', { project_id, query, stage, selected_ids, user_id });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'user',
        content: query,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      throw userMessageError;
    }

    // Prepare request body for external API
    const requestBody = {
      stage,
      query,
      user_id,
      session_id: project_id,
      limit: 3,
      ids: selected_ids,
      count: 6,
      user_background
    };

    console.log('Calling external API with:', requestBody);

    // Call external API
    // const response = await fetch('https://loomi.live:8088/api/v1/bluechat', {
    const response = await fetch('https://47.84.70.98:8443/api/v1/bluechat', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('External API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error details:', errorText);
      throw new Error(`External API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from external API');
    }

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      throw new Error(`External API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body from external API');
    }

    // Create a readable stream to forward the response
    const readable = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('Forwarding chunk:', chunk);
            controller.enqueue(new TextEncoder().encode(chunk));
            return pump();
          });
        }

        return pump();
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat-bluechat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
