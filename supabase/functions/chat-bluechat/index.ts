
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BluechatRequest {
  project_id: string;
  query: string;
  stage: 'STAGE_1' | 'STAGE_2';
  selected_ids?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, query, stage, selected_ids = [] }: BluechatRequest = await req.json();
    
    console.log('Bluechat request:', { project_id, query, stage, selected_ids });

    // Prepare request body for external API
    const requestBody = {
      stage,
      query,
      user_id: "123", // Fixed user_id as per requirements
      session_id: project_id,
      limit: 3,
      ids: selected_ids,
      count: 6
    };

    console.log('Calling external API with:', requestBody);

    // Call external API
    // const response = await fetch('http://47.84.70.98:8088/api/v1/bluechat', {
    const response = await fetch('http://loomi.live:8088/api/v1/bluechat', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cGN6dnd5Z2VscnZ4emZkY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU3ODUsImV4cCI6MjA2NTQ3MTc4NX0.y7uP6NVj48UAKnMWcB_5LltTVCVFuSeo7xmrCEHlp1I`,
      },
      body: JSON.stringify(requestBody),
    });

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
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat bluechat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
