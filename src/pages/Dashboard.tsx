import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, Calendar, ExternalLink, LogOut, TrendingUp, Award, Clock, Target, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  url: string;
  reward_amount: number;
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
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksCompletedToday, setTasksCompletedToday] = useState(0);

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

      // Fetch withdrawal requests
      const { data: withdrawalData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (withdrawalData) setWithdrawals(withdrawalData);
      
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
    if (tasksCompletedToday >= 5) {
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
        .single();

      if (existingTask) {
        toast({
          title: "Task Already Completed",
          description: "You've already completed this task today!",
          variant: "destructive"
        });
        return;
      }

      // Open task URL in new tab
      window.open(task.url, '_blank');

      // Mark task as completed and add reward
      const { error: taskError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task_id: task.id,
          reward_earned: task.reward_amount,
          task_date: today
        });

      if (taskError) throw taskError;

      // Update user's wallet balance
      const newBalance = parseFloat(profile.wallet_balance) + parseFloat(task.reward_amount.toString());
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: newBalance,
          last_task_date: today
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Task Completed!",
        description: `You earned $${task.reward_amount.toFixed(2)}! Check your wallet.`
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

  const progressPercentage = (tasksCompletedToday / 5) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome back, <span className="text-gradient-primary">{profile?.username}</span>!
            </h1>
            <p className="text-lg text-muted-foreground">Ready to earn some money today?</p>
          </div>
          <Button onClick={signOut} variant="outline" className="hover-lift">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="card-elegant p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Daily Progress</h3>
            </div>
            <Badge variant={tasksCompletedToday >= 5 ? "default" : "secondary"} className="text-sm">
              {tasksCompletedToday}/5 Tasks
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {5 - tasksCompletedToday} tasks remaining today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <Card className="card-elegant hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Quick Action</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleWithdrawal}
                disabled={parseFloat(profile?.wallet_balance || '0') < 5}
                className="w-full gradient-primary hover-glow"
                size="lg"
              >
                <Award className="mr-2 h-4 w-4" />
                Request Withdrawal
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Minimum $5.00 required
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
              {tasksCompletedToday < 5 && (
                <Badge className="gradient-primary text-primary-foreground">
                  {availableTasks.length} Available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tasksCompletedToday >= 5 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableTasks.map((task) => (
                  <Card key={task.id} className="hover-lift cursor-pointer group border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{task.title}</h3>
                        <Badge className="gradient-primary text-primary-foreground font-semibold">
                          +${task.reward_amount.toFixed(2)}
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleTaskClick(task)}
                        className="w-full gradient-primary hover-glow group-hover:scale-105 transition-transform"
                        size="lg"
                      >
                        <ExternalLink className="mr-2 h-5 w-5" />
                        Complete Task & Earn
                      </Button>
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

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex justify-between items-center p-4 border border-border/50 rounded-xl hover-lift">
                    <div>
                      <span className="font-semibold text-lg">${withdrawal.amount.toFixed(2)}</span>
                      <p className="text-sm text-muted-foreground">
                        Requested on {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        withdrawal.status === 'approved' ? 'default' : 
                        withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {withdrawal.status}
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