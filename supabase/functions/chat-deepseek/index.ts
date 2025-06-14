
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

    // Get API keys
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
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

    // Call DeepSeek API
    console.log('Calling DeepSeek API...');
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是 Nova，一个专业的小红书创作助手。你的任务是帮用户创作优质的小红书内容。

核心指令：
1. 根据用户需求创作小红书风格的内容
2. 使用 <new_xhs_card title="标题"> 标签来创建新的卡片内容
3. 使用 <update_xhs_card card_ref_id="卡片标题"> 标签来更新已有卡片
4. 内容要符合小红书用户喜好：有趣、实用、易读
5. 适当使用emoji和小红书常用词汇
6. 内容要有价值，避免空泛

请用中文回复，语气亲切自然。`
          },
          {
            role: 'user',
            content: core_instruction
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${deepseekResponse.status} ${errorText}`);
    }

    const deepseekData = await deepseekResponse.json();
    console.log('DeepSeek API response:', deepseekData);

    if (!deepseekData.choices || !deepseekData.choices[0]) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const aiResponse = {
      content: deepseekData.choices[0].message.content,
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
        content: aiResponse.content,
        llm_raw_output: deepseekData,
        created_at: new Date().toISOString(),
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    console.log('Chat response prepared:', aiResponse);

    return new Response(JSON.stringify(aiResponse), {
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
