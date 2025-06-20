import { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/components/AuthProvider';
import { Feather, Mail, Lock } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "请填写完整信息",
        description: "邮箱和密码都是必填项",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "登录失败",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "登录成功",
            description: "欢迎回来！",
          });
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          toast({
            title: "注册失败",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "注册成功",
            description: "请检查您的邮箱以确认账户",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-500 flex items-center justify-center p-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gray-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gray-50"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-6">
            <Feather className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-black mb-2 tracking-tight">
            Nova
          </h1>
          <p className="text-gray-600 font-serif text-lg">
            专门为小红书创作而生的 AI 助手
          </p>
        </div>

        {/* 登录表单 */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-serif font-semibold text-black">
              {isLogin ? '登录账户' : '创建账户'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱输入 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="email"
                  placeholder="邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-14 pl-12 bg-gray-50 border-0 rounded-xl font-serif text-base placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                />
              </div>
              
              {/* 密码输入 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-14 pl-12 bg-gray-50 border-0 rounded-xl font-serif text-base placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                />
              </div>
              
              {/* 登录按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black hover:bg-gray-800 text-white font-serif text-base rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-3" />
                    {isLogin ? '登录中...' : '注册中...'}
                  </div>
                ) : (
                  isLogin ? '登录' : '注册'
                )}
              </Button>
            </form>

            {/* 切换登录/注册 */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="text-gray-600 hover:text-black font-serif transition-colors duration-200 text-base"
              >
                {isLogin ? '还没有账户？立即注册' : '已有账户？立即登录'}
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* 底部装饰 */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm font-serif">
            开始你的创作之旅
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
