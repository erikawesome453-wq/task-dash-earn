import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Calendar, ExternalLink, LogOut } from 'lucide-react';
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
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const availableTasks = tasks.filter(task => 
    !completedTasks.some(ct => ct.task.id === task.id)
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.username}!</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(profile?.wallet_balance || '0').toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksCompletedToday}/5</div>
              <p className="text-xs text-muted-foreground">
                {5 - tasksCompletedToday} tasks remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleWithdrawal}
                disabled={parseFloat(profile?.wallet_balance || '0') < 5}
                className="w-full"
              >
                Request Withdrawal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Available Tasks</CardTitle>
            <CardDescription>
              Complete up to 5 tasks daily to earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksCompletedToday >= 5 ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium">Daily limit reached!</p>
                <p className="text-muted-foreground">Come back tomorrow for more tasks.</p>
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">All tasks completed for today!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant="secondary">${task.reward_amount.toFixed(2)}</Badge>
                      </div>
                      <Button 
                        onClick={() => handleTaskClick(task)}
                        className="w-full mt-2"
                        size="sm"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Complete Task
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
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((ct) => (
                  <div key={ct.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <span>{ct.task.title}</span>
                    <Badge variant="outline">+${ct.reward_earned.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">${withdrawal.amount.toFixed(2)}</span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        withdrawal.status === 'approved' ? 'default' : 
                        withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                      }
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