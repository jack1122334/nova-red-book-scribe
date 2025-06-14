
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  project_id: string;
  core_instruction: string;
  references?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Chat request received');
    
    // Parse request body
    const { project_id, core_instruction, references = [] }: ChatRequest = await req.json();
    console.log('Request data:', { project_id, core_instruction, references });

    if (!project_id || !core_instruction) {
      throw new Error('Missing required fields: project_id and core_instruction');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('User authenticated:', user.id);

    // For now, create a simple mock response
    // In a real implementation, you would call DeepSeek API here
    const mockResponse = {
      content: `你好！我是 Nova，你的小红书创作助手。

我收到了你的消息："${core_instruction}"

我可以帮你：
1. 创作小红书内容
2. 优化文案
3. 提供创意建议

<new_xhs_card title="回复示例">
这是一个示例回复卡片。

在实际使用中，我会根据你的需求创建相应的内容卡片。
</new_xhs_card>

你想要我帮你创作什么类型的内容呢？`,
      role: 'assistant'
    };

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'user',
        content: core_instruction,
        created_at: new Date().toISOString(),
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Save assistant response to database
    const { error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        project_id,
        role: 'assistant',
        content: mockResponse.content,
        llm_raw_output: mockResponse,
        created_at: new Date().toISOString(),
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    console.log('Chat response prepared:', mockResponse);

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
