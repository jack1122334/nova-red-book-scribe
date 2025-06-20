/**
 * 2025年06月21日01:14:17 修改 这个版本能用
 */
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
    const response = await fetch('http://loomi.live:8088/api/v1/bluechat', {
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

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body reader available'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = ''; // 添加缓冲区来处理被截断的数据

        async function pump(): Promise<void> {
          try {
            const { done, value } = await reader!.read();

            if (done) {
              // 处理缓冲区中剩余的数据
              if (buffer.trim()) {
                processBuffer(buffer);
              }
              console.log('=== STREAM COMPLETED ===');
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk; // 将新数据添加到缓冲区

            // 按行分割并处理完整的行
            const lines = buffer.split('\n');

            // 保留最后一行（可能不完整）在缓冲区中
            buffer = lines.pop() || '';

            // 处理完整的行
            for (const line of lines) {
              processLine(line);
            }

            return pump();
          } catch (error) {
            console.error('Error in stream pump:', error);
            controller.error(error);
          }
        }

        function processBuffer(remainingBuffer: string) {
          const lines = remainingBuffer.split('\n');
          for (const line of lines) {
            processLine(line);
          }
        }

        function processLine(line: string) {
          const trimmedLine = line.trim();

          if (trimmedLine && trimmedLine.startsWith('data: ')) {
            const dataContent = trimmedLine.slice(6).trim();

            // Check for stream completion
            if (dataContent === '[DONE]') {
              console.log('=== BLUECHAT RESPONSE COMPLETED ===');
              controller.enqueue(
                new TextEncoder().encode('data: [DONE]\n\n')
              );
              return;
            }

            if (dataContent === '') {
              return;
            }

            try {
              const data = JSON.parse(dataContent);

              console.log('=== BLUECHAT EVENT ===');
              console.log('Event type:', data.type || 'unknown');
              console.log('Full event data:', JSON.stringify(data, null, 2));

              // Forward the event to frontend for streaming display
              const eventData = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(new TextEncoder().encode(eventData));

            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError, 'Line:', trimmedLine);
              // 对于无法解析的数据，直接转发
              controller.enqueue(
                new TextEncoder().encode(`${line}\n`)
              );
            }
          } else if (trimmedLine.startsWith('event: ') || trimmedLine.startsWith('id: ')) {
            // 转发其他 SSE 字段
            controller.enqueue(
              new TextEncoder().encode(`${line}\n`)
            );
          } else {
            // 转发其他 SSE 字段
            controller.enqueue(
              new TextEncoder().encode(`${line}\n`)
            );
          }
        }

        pump();
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
