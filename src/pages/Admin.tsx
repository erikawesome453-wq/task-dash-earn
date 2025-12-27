import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  url: string;
  reward_amount: number;
  is_active: boolean;
}

interface User {
  id: string;
  user_id: string;
  username: string;
  wallet_balance: number;
  last_task_date: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  username?: string;
}

interface Deposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  username?: string;
  payment_method?: string;
  payment_details?: any;
  description?: string;
}

const Admin = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [taskForm, setTaskForm] = useState({ title: '', url: '', reward_amount: 0.10 });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchData = async () => {
    try {
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tasksData) setTasks(tasksData);

      // Fetch users (all profiles)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersData) setUsers(usersData);

      // Fetch admin roles
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (adminRoles) {
        setAdminIds(new Set(adminRoles.map(r => r.user_id)));
      }

      // Fetch withdrawals with user info
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (withdrawalsData) {
        // Get usernames for each withdrawal
        const withdrawalsWithUsernames = await Promise.all(
          withdrawalsData.map(async (withdrawal) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', withdrawal.user_id)
              .single();
            
            return {
              ...withdrawal,
              username: profile?.username || 'Unknown'
            };
          })
        );
        setWithdrawals(withdrawalsWithUsernames);
      }

      // Fetch deposits (from wallet_transactions with type 'deposit')
      const { data: depositsData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_type', 'deposit')
        .order('created_at', { ascending: false });
      
      if (depositsData) {
        // Get usernames for each deposit
        const depositsWithUsernames = await Promise.all(
          depositsData.map(async (deposit) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', deposit.user_id)
              .single();
            
            return {
              ...deposit,
              username: profile?.username || 'Unknown'
            };
          })
        );
        setDeposits(depositsWithUsernames);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskForm)
          .eq('id', editingTask.id);
        
        if (error) throw error;
        
        toast({ title: "Task updated successfully!" });
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskForm);
        
        if (error) throw error;
        
        toast({ title: "Task created successfully!" });
      }
      
      setTaskForm({ title: '', url: '', reward_amount: 0.10 });
      setEditingTask(null);
      setShowTaskDialog(false);
      fetchData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      toast({ title: "Task deleted successfully!" });
      fetchData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_active: !task.is_active })
        .eq('id', task.id);
      
      if (error) throw error;
      
      toast({ 
        title: `Task ${!task.is_active ? 'activated' : 'deactivated'} successfully!` 
      });
      fetchData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, userId: string, amount: number, status: 'approved' | 'rejected') => {
    try {
      // Update withdrawal status
      const { error } = await supabase
        .from('withdrawals')
        .update({ status })
        .eq('id', withdrawalId);
      
      if (error) throw error;

      // If approved, deduct from user's wallet balance
      if (status === 'approved') {
        // First fetch current balance
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', userId)
          .single();

        if (fetchError) throw fetchError;

        const newBalance = Math.max(0, (profile.wallet_balance || 0) - amount);

        // Update with new balance
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('user_id', userId);
        
        if (balanceError) throw balanceError;

        // Log the withdrawal transaction
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'withdraw',
            amount: amount,
            status: 'completed',
            description: 'Withdrawal approved by admin'
          });

        if (transactionError) console.error('Transaction log error:', transactionError);
      }
      
      toast({ 
        title: `Withdrawal ${status} successfully!` 
      });
      fetchData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDepositAction = async (depositId: string, userId: string, amount: number, status: 'completed' | 'rejected') => {
    try {
      // Update deposit status
      const { error: depositError } = await supabase
        .from('wallet_transactions')
        .update({ status })
        .eq('id', depositId);
      
      if (depositError) throw depositError;

      // If approved, update user's wallet balance, total_deposited, and recalculate VIP level
      if (status === 'completed') {
        // First fetch current profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('wallet_balance, total_deposited, total_earned, vip_level')
          .eq('user_id', userId)
          .single();

        if (fetchError) throw fetchError;

        const newTotalDeposited = (profile.total_deposited || 0) + amount;
        const newWalletBalance = (profile.wallet_balance || 0) + amount;
        const totalActivity = newTotalDeposited + (profile.total_earned || 0);

        // Calculate new VIP level based on total activity
        const { data: newVipLevel, error: vipError } = await supabase.rpc('calculate_vip_level', {
          total_deposits: newTotalDeposited,
          total_earnings: profile.total_earned || 0
        });

        if (vipError) {
          console.error('VIP calculation error:', vipError);
        }

        // Update with new values including VIP level
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            wallet_balance: newWalletBalance,
            total_deposited: newTotalDeposited,
            vip_level: newVipLevel ?? profile.vip_level ?? 0
          })
          .eq('user_id', userId);
        
        if (balanceError) throw balanceError;
      }
      
      toast({ 
        title: `Deposit ${status === 'completed' ? 'approved' : 'rejected'} successfully!` 
      });
      fetchData();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRoleToggle = async (targetUserId: string, makeAdmin: boolean) => {
    try {
      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: targetUserId, role: 'admin' });
        if (error) throw error;
        toast({ title: 'User promoted to admin' });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId)
          .eq('role', 'admin');
        if (error) throw error;
        toast({ title: 'Admin role removed' });
      }
      // Refresh admin roles and users
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        url: task.url,
        reward_amount: task.reward_amount
      });
    } else {
      setEditingTask(null);
      setTaskForm({ title: '', url: '', reward_amount: 0.10 });
    }
    setShowTaskDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage tasks, users, and withdrawals</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deposits.filter(d => d.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tasks Management</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tasks Management</CardTitle>
                  <CardDescription>Add, edit, and manage tasks</CardDescription>
                </div>
                <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openTaskDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingTask ? 'Edit Task' : 'Add New Task'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingTask ? 'Update task details' : 'Create a new task for users'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTask} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          type="url"
                          value={taskForm.url}
                          onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reward">Reward Amount ($)</Label>
                        <Input
                          id="reward"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={taskForm.reward_amount}
                          onChange={(e) => setTaskForm({ ...taskForm, reward_amount: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        {editingTask ? 'Update Task' : 'Create Task'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge variant={task.is_active ? "default" : "secondary"}>
                            {task.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.url}</p>
                        <p className="text-sm font-medium">${task.reward_amount.toFixed(2)} reward</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleTask(task)}
                        >
                          {task.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTaskDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users Overview</CardTitle>
                <CardDescription>View all registered users and their balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{u.username}</h3>
                          {adminIds.has(u.user_id) && (
                            <Badge>Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(u.created_at).toLocaleDateString()}
                        </p>
                        {u.last_task_date && (
                          <p className="text-sm text-muted-foreground">
                            Last task: {new Date(u.last_task_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">${u.wallet_balance.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Balance</p>
                        </div>
                        <div>
                          {adminIds.has(u.user_id) ? (
                            <Button size="sm" variant="outline" onClick={() => handleRoleToggle(u.user_id, false)}>
                              Remove Admin
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleRoleToggle(u.user_id, true)}>
                              Make Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
                <CardDescription>Approve or reject user deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deposits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No deposits found</p>
                  ) : (
                    deposits.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{deposit.username || 'Unknown User'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested: {new Date(deposit.created_at).toLocaleDateString()} {new Date(deposit.created_at).toLocaleTimeString()}
                          </p>
                          <p className="font-medium text-lg">${deposit.amount.toFixed(2)}</p>
                          {deposit.payment_method && (
                            <p className="text-sm text-muted-foreground">Method: {deposit.payment_method}</p>
                          )}
                          {deposit.payment_details && (
                            <p className="text-sm text-muted-foreground">
                              Details: {JSON.stringify(deposit.payment_details)}
                            </p>
                          )}
                          {deposit.description && (
                            <p className="text-sm text-muted-foreground">{deposit.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              deposit.status === 'completed' ? 'default' : 
                              deposit.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {deposit.status}
                          </Badge>
                          {deposit.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(deposit.id, deposit.user_id, deposit.amount, 'completed')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDepositAction(deposit.id, deposit.user_id, deposit.amount, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Approve or reject user withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{withdrawal.username || 'Unknown User'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(withdrawal.created_at).toLocaleDateString()}
                        </p>
                        <p className="font-medium">${withdrawal.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            withdrawal.status === 'approved' ? 'default' : 
                            withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {withdrawal.status}
                        </Badge>
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(withdrawal.id, withdrawal.user_id, withdrawal.amount, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleWithdrawalAction(withdrawal.id, withdrawal.user_id, withdrawal.amount, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;