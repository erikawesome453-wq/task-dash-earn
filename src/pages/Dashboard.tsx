import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, Calendar, ExternalLink, TrendingUp, Award, Clock, Target, Zap, Crown, Users, Plus, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Task {
  id: string;
  title: string;
  url: string;
  reward_amount: number;
  image_url?: string;
  description?: string;
  category?: string;
  platform?: string;
}

interface CompletedTask {
  id: string;
  task: Task;
  completed_at: string;
  reward_earned: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksCompletedToday, setTasksCompletedToday] = useState(0);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [currentCompany, setCurrentCompany] = useState('');

  const topCompanies = [
    'Amazon', 'Google', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Nike', 'Samsung', 'Walmart',
    'JPMorgan', 'Visa', 'Mastercard', 'PayPal', 'Stripe', 'Square', 'Adobe', 'Salesforce', 'Oracle', 'IBM',
    'Coca-Cola', 'Pepsi', 'McDonald\'s', 'Starbucks', 'Disney', 'Sony', 'Nintendo', 'Spotify', 'Uber', 'Airbnb',
    'Twitter', 'LinkedIn', 'TikTok', 'Instagram', 'YouTube', 'Snapchat', 'Pinterest', 'Reddit', 'Zoom', 'Slack'
  ];
  
  // Calculate daily task limit based on VIP level
  const getDailyTaskLimit = (vipLevel: number) => {
    switch (vipLevel) {
      case 5: return 30;
      case 4: return 25;
      case 3: return 20;
      case 2: return 15;
      case 1: return 10;
      default: return 5;
    }
  };
  
  const dailyTaskLimit = getDailyTaskLimit(profile?.vip_level || 0);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchData = async () => {
    try {
      // Fetch available tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true);
      
      if (tasksData) setTasks(tasksData);

      // Fetch today's completed tasks
      const today = new Date().toISOString().split('T')[0];
      const { data: completedData } = await supabase
        .from('user_tasks')
        .select(`
          id,
          completed_at,
          reward_earned,
          task:tasks(*)
        `)
        .eq('user_id', user.id)
        .eq('task_date', today);
      
      if (completedData) {
        setCompletedTasks(completedData);
        setTasksCompletedToday(completedData.length);
      }

      // Note: Withdrawals now handled in separate Wallet page
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleTaskClick = async (task: Task) => {
    if (tasksCompletedToday >= dailyTaskLimit) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily task limit. Come back tomorrow!",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if task already completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingTask } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_id', task.id)
        .eq('task_date', today)
        .maybeSingle();

      if (existingTask) {
        toast({
          title: "Task Already Completed",
          description: "You've already completed this task today!",
          variant: "destructive"
        });
        return;
      }

      // Start loading animation
      setLoadingTask(task.id);
      
      // Start company name cycling
      const companyInterval = setInterval(() => {
        const randomCompany = topCompanies[Math.floor(Math.random() * topCompanies.length)];
        setCurrentCompany(randomCompany);
      }, 150); // Change every 150ms for fast cycling

      // Wait for 3 seconds to simulate task completion
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clear the interval
      clearInterval(companyInterval);

      // Generate dynamic reward based on user's VIP level
      const { data: rewardData, error: rewardError } = await supabase
        .rpc('generate_task_reward', { user_vip_level: (profile?.vip_level || 0) });

      if (rewardError) throw rewardError;

      const dynamicReward = rewardData || task.reward_amount;

      // Mark task as completed and add reward
      const { error: taskError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task_id: task.id,
          reward_earned: dynamicReward,
          task_date: today
        });

      if (taskError) throw taskError;

      // Note: Wallet update now handled by database trigger automatically
      // The trigger updates wallet_balance, total_earned, and logs transaction

      toast({
        title: "Task Completed!",
        description: `You earned $${dynamicReward.toFixed(2)}! Check your wallet.`
      });

      // Refresh data
      await refreshProfile();
      await fetchData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive"
      });
    } finally {
      setLoadingTask(null);
      setCurrentCompany('');
    }
  };

  const handleWithdrawal = async () => {
    const minWithdraw = 5.00;
    const currentBalance = parseFloat(profile?.wallet_balance || '0');
    
    if (currentBalance < minWithdraw) {
      toast({
        title: "Insufficient Balance",
        description: `Minimum withdrawal amount is $${minWithdraw.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: currentBalance
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request is pending admin approval."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const availableTasks = tasks.filter(task => 
    !completedTasks.some(ct => ct.task.id === task.id)
  );

  const progressPercentage = (tasksCompletedToday / dailyTaskLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header tasksCompletedToday={tasksCompletedToday} dailyTaskLimit={dailyTaskLimit} />
      
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Welcome back, <span className="text-gradient-primary">{profile?.username}</span>!
          </h1>
          <p className="text-lg text-muted-foreground">Ready to earn some money today?</p>
        </div>

        {/* Progress Bar */}
        <div className="card-elegant p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Daily Progress</h3>
            </div>
            <Badge variant={tasksCompletedToday >= dailyTaskLimit ? "default" : "secondary"} className="text-sm">
              {tasksCompletedToday}/{dailyTaskLimit} Tasks
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {dailyTaskLimit - tasksCompletedToday} tasks remaining today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elegant hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-medium">Wallet Balance</CardTitle>
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-primary">
                ${parseFloat(profile?.wallet_balance || '0').toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
            </CardContent>
          </Card>

          <Card className="card-elegant hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-medium">Today's Earnings</CardTitle>
              <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-accent">
                ${completedTasks.reduce((sum, task) => sum + task.reward_earned, 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">From {tasksCompletedToday} completed tasks</p>
            </CardContent>
          </Card>

          <Card className="card-elegant hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-medium">VIP Level</CardTitle>
              <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-accent">
                {profile?.vip_level === 0 ? 'Standard' : 
                 profile?.vip_level === 1 ? 'Level 1' :
                 profile?.vip_level === 2 ? 'VIP' :
                 profile?.vip_level === 3 ? 'VVIP' :
                 profile?.vip_level === 4 ? 'Super VIP' :
                 profile?.vip_level === 5 ? 'Super VVIP' : 'Standard'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {dailyTaskLimit} tasks per day
              </p>
            </CardContent>
          </Card>

          <Card className="card-elegant hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-medium">Referrals</CardTitle>
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient-primary">
                {profile?.total_referrals || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ${parseFloat(profile?.referral_earnings || '0').toFixed(2)} earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Tasks */}
        <Card className="card-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Available Tasks</CardTitle>
                  <CardDescription className="text-base">
                    Complete tasks to earn instant rewards
                  </CardDescription>
                </div>
              </div>
              {tasksCompletedToday < dailyTaskLimit && (
                <Badge className="gradient-primary text-primary-foreground">
                  {availableTasks.length} Available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tasksCompletedToday >= dailyTaskLimit ? (
              <div className="text-center py-12 space-y-4">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-2xl font-bold">Daily limit reached!</p>
                  <p className="text-muted-foreground text-lg">Come back tomorrow for more earning opportunities.</p>
                </div>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Award className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-2xl font-bold">All tasks completed!</p>
                  <p className="text-muted-foreground text-lg">Great job! Come back tomorrow for more tasks.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTasks.map((task) => (
                  <Card key={task.id} className="hover-lift cursor-pointer group border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={task.image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'}
                        alt={task.title}
                        className="w-full h-full object-cover animate-bounce group-hover:scale-110 transition-all duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="gradient-primary text-primary-foreground font-semibold shadow-lg">
                          +${task.reward_amount.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
                          {task.category || 'General'}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      {/* Platform Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs font-medium">
                          {task.platform || 'Website'}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Earn instantly
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-2 line-clamp-1">
                          {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description || 'Complete this task to earn instant rewards'}
                        </p>
                      </div>

                      {/* Action Button */}
                      {loadingTask === task.id ? (
                        <div className="space-y-3">
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center space-x-2 text-primary">
                              <Globe className="h-5 w-5 animate-world-rotate" />
                              <span className="text-sm font-medium">Finding best buyer with automatic search...</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Scanning: <span className="font-semibold text-primary">{currentCompany}</span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-primary/70 animate-progress"></div>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleTaskClick(task)}
                          className="w-full gradient-primary hover-glow group-hover:scale-105 transition-all duration-200"
                          size="lg"
                        >
                          <ExternalLink className="mr-2 h-5 w-5" />
                          Complete & Earn
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks Today */}
        {completedTasks.length > 0 && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                Completed Tasks Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedTasks.map((ct) => (
                  <div key={ct.id} className="flex justify-between items-center p-4 border border-border/50 rounded-xl hover-lift">
                    <div>
                      <span className="font-medium">{ct.task.title}</span>
                      <p className="text-sm text-muted-foreground">
                        Completed at {new Date(ct.completed_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className="gradient-primary text-primary-foreground">
                      +${ct.reward_earned.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Dashboard;