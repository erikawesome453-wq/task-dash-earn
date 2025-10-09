import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Sparkles, Shield } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, profile, loading: authLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  if (user) {
    // Wait until profile loads to decide where to go
    if (authLoading || !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      );
    }
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in."
          });
        }
      } else {
        if (!username.trim()) {
          toast({
            title: "Username Required",
            description: "Please enter a username.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Registration Successful!",
            description: "Please check your email to confirm your account."
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl float" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="card-elegant hover-lift">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              {isLogin ? (
                <Shield className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">
                {isLogin ? (
                  <>Welcome <span className="text-gradient-primary">Back</span></>
                ) : (
                  <>Join <span className="text-gradient-accent">EarnTask</span></>
                )}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {isLogin 
                  ? 'Sign in to access your earning dashboard' 
                  : 'Start your journey to daily earnings today'
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="h-12 px-4 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 px-4 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold gradient-primary hover-glow"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </div>
                )}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-sm hover-lift"
            >
              {isLogin 
                ? "Don't have an account? Create one now" 
                : "Already have an account? Sign in instead"
              }
            </Button>
          </CardContent>
        </Card>
        
        {/* Trust indicators */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SSL Secured
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Instant Access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;