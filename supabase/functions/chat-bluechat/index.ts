
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BluechatRequest {
  stage: 'STAGE_1' | 'STAGE_2';
  query: string;
  user_id: string;
  session_id: string;
  limit: number;
  ids: string[];
  count: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stage, query, user_id, session_id, limit, ids, count } = await req.json();
    
    const bluechatRequest: BluechatRequest = {
      stage,
      query,
      user_id,
      session_id,
      limit,
      ids,
      count
    };

    console.log('=== BLUECHAT REQUEST START ===');
    console.log('Sending to Bluechat:', bluechatRequest);

    // Call Bluechat API
    const bluechatResponse = await fetch('http://172.22.45.74:8000/api/v1/bluechat', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bluechatRequest),
    });

    console.log('Bluechat API response status:', bluechatResponse.status);
    
    if (!bluechatResponse.ok) {
      const errorText = await bluechatResponse.text();
      console.error('Bluechat API error details:', errorText);
      throw new Error(`Bluechat API error: ${bluechatResponse.status} - ${errorText}`);
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = bluechatResponse.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const dataStr = line.slice(6).trim();
                  
                  if (dataStr === '[DONE]') {
                    console.log('=== BLUECHAT RESPONSE COMPLETED ===');
                    controller.close();
                    return;
                  }
                  
                  if (dataStr && dataStr !== '') {
                    const data = JSON.parse(dataStr);
                    console.log('=== BLUECHAT EVENT ===');
                    console.log('Event data:', JSON.stringify(data, null, 2));
                    
                    // Forward the event to frontend for streaming display
                    const eventData = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(eventData));
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', line);
                  console.warn('Parse error:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          throw error;
        } finally {
          console.log('=== BLUECHAT STREAM COMPLETED ===');
          controller.close();
        }
      }
    });

    return new Response(stream, {
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
