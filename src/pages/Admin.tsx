import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Users, DollarSign, LogOut, Upload, X, Image, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  url: string;
  reward_amount: number;
  is_active: boolean;
  image_url?: string | null;
  description?: string | null;
  category?: string | null;
  platform?: string | null;
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
  payment_method?: string;
  payment_details?: any;
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
  
  const [taskForm, setTaskForm] = useState({ 
    title: '', 
    url: '', 
    reward_amount: 0.10,
    image_url: '',
    description: '',
    category: 'general',
    platform: 'website'
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Bulk selection states
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set());
  const [selectedDeposits, setSelectedDeposits] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

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

      // Fetch withdrawals from wallet_transactions (where users actually submit them)
      const { data: withdrawalsData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_type', 'withdraw')
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

  // IMPORTANT: useEffect must be called before any conditional returns
  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  // Now handle conditional rendering AFTER hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

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
      
      setTaskForm({ 
        title: '', 
        url: '', 
        reward_amount: 0.10,
        image_url: '',
        description: '',
        category: 'general',
        platform: 'website'
      });
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

  const sendNotification = async (userId: string, type: string, amount: number) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: { userId, type, amount }
      });
      if (error) {
        console.error('Notification error:', error);
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, userId: string, amount: number, status: 'approved' | 'rejected') => {
    try {
      // Update withdrawal status in wallet_transactions
      const newStatus = status === 'approved' ? 'completed' : 'rejected';
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: newStatus })
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
      }

      // Send email notification to user
      await sendNotification(userId, `withdrawal_${status}`, amount);
      
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `tasks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-images')
        .getPublicUrl(filePath);

      setTaskForm({ ...taskForm, image_url: publicUrl });
      setImagePreview(publicUrl);
      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setTaskForm({ ...taskForm, image_url: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      // Send email notification to user
      const notificationType = status === 'completed' ? 'deposit_approved' : 'deposit_rejected';
      await sendNotification(userId, notificationType, amount);
      
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

  // Bulk selection helpers
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const pendingDeposits = deposits.filter(d => d.status === 'pending');

  const toggleWithdrawalSelection = (id: string) => {
    const newSelected = new Set(selectedWithdrawals);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedWithdrawals(newSelected);
  };

  const toggleDepositSelection = (id: string) => {
    const newSelected = new Set(selectedDeposits);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDeposits(newSelected);
  };

  const selectAllWithdrawals = () => {
    if (selectedWithdrawals.size === pendingWithdrawals.length) {
      setSelectedWithdrawals(new Set());
    } else {
      setSelectedWithdrawals(new Set(pendingWithdrawals.map(w => w.id)));
    }
  };

  const selectAllDeposits = () => {
    if (selectedDeposits.size === pendingDeposits.length) {
      setSelectedDeposits(new Set());
    } else {
      setSelectedDeposits(new Set(pendingDeposits.map(d => d.id)));
    }
  };

  const handleBulkWithdrawalAction = async (status: 'approved' | 'rejected') => {
    if (selectedWithdrawals.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const selectedItems = withdrawals.filter(w => selectedWithdrawals.has(w.id));
      
      for (const withdrawal of selectedItems) {
        await handleWithdrawalAction(withdrawal.id, withdrawal.user_id, withdrawal.amount, status);
      }
      
      setSelectedWithdrawals(new Set());
      toast({ 
        title: `${selectedItems.length} withdrawal(s) ${status} successfully!` 
      });
    } catch (error: any) {
      toast({
        title: "Bulk action failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDepositAction = async (status: 'completed' | 'rejected') => {
    if (selectedDeposits.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const selectedItems = deposits.filter(d => selectedDeposits.has(d.id));
      
      for (const deposit of selectedItems) {
        await handleDepositAction(deposit.id, deposit.user_id, deposit.amount, status);
      }
      
      setSelectedDeposits(new Set());
      toast({ 
        title: `${selectedItems.length} deposit(s) ${status === 'completed' ? 'approved' : 'rejected'} successfully!` 
      });
    } catch (error: any) {
      toast({
        title: "Bulk action failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBulkProcessing(false);
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
        reward_amount: task.reward_amount,
        image_url: task.image_url || '',
        description: task.description || '',
        category: task.category || 'general',
        platform: task.platform || 'website'
      });
      setImagePreview(task.image_url || '');
    } else {
      setEditingTask(null);
      setTaskForm({ 
        title: '', 
        url: '', 
        reward_amount: 0.10,
        image_url: '',
        description: '',
        category: 'general',
        platform: 'website'
      });
      setImagePreview('');
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
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Admin Panel</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage tasks, users, and withdrawals</p>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Tasks</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{tasks.filter(t => t.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Withdrawals</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Deposits</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {deposits.filter(d => d.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-auto">
            <TabsTrigger value="tasks" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Tasks</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Users</TabsTrigger>
            <TabsTrigger value="deposits" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">Withdraws</TabsTrigger>
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
                    <form onSubmit={handleSaveTask} className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                        <Label htmlFor="url">Task URL</Label>
                        <Input
                          id="url"
                          type="url"
                          value={taskForm.url}
                          onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                          placeholder="https://example.com/task"
                          required
                        />
                      </div>
                      <div>
                        <Label>Task Image</Label>
                        <div className="space-y-3">
                          {(imagePreview || taskForm.image_url) ? (
                            <div className="relative inline-block">
                              <img 
                                src={imagePreview || taskForm.image_url} 
                                alt="Task preview" 
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={removeImage}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Image className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">Click to upload</span>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </Button>
                          </div>
                          <Input
                            type="url"
                            value={taskForm.image_url}
                            onChange={(e) => {
                              setTaskForm({ ...taskForm, image_url: e.target.value });
                              setImagePreview(e.target.value);
                            }}
                            placeholder="Or paste image URL..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          placeholder="Task description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <select
                            id="category"
                            value={taskForm.category}
                            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="general">General</option>
                            <option value="social">Social</option>
                            <option value="shopping">Shopping</option>
                            <option value="survey">Survey</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="platform">Platform</Label>
                          <select
                            id="platform"
                            value={taskForm.platform}
                            onChange={(e) => setTaskForm({ ...taskForm, platform: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="website">Website</option>
                            <option value="amazon">Amazon</option>
                            <option value="alibaba">Alibaba</option>
                            <option value="ebay">eBay</option>
                            <option value="youtube">YouTube</option>
                            <option value="tiktok">TikTok</option>
                            <option value="instagram">Instagram</option>
                          </select>
                        </div>
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
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">{task.title}</h3>
                          <Badge variant={task.is_active ? "default" : "secondary"} className="text-xs">
                            {task.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{task.url}</p>
                        <p className="text-xs sm:text-sm font-medium">${task.reward_amount.toFixed(2)} reward</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleTask(task)}
                          className="text-xs flex-1 sm:flex-none"
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
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-sm sm:text-base">{u.username}</h3>
                          {adminIds.has(u.user_id) && (
                            <Badge className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Joined: {new Date(u.created_at).toLocaleDateString()}
                        </p>
                        {u.last_task_date && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Last task: {new Date(u.last_task_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <p className="font-medium text-sm sm:text-base">${u.wallet_balance.toFixed(2)}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Balance</p>
                        </div>
                        <div>
                          {adminIds.has(u.user_id) ? (
                            <Button size="sm" variant="outline" onClick={() => handleRoleToggle(u.user_id, false)} className="text-xs sm:text-sm">
                              Remove
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleRoleToggle(u.user_id, true)} className="text-xs sm:text-sm">
                              Admin
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Deposit Requests</CardTitle>
                  <CardDescription>Approve or reject user deposit requests</CardDescription>
                </div>
                {pendingDeposits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllDeposits}
                      className="text-xs"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      {selectedDeposits.size === pendingDeposits.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedDeposits.size > 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleBulkDepositAction('completed')}
                          disabled={bulkProcessing}
                          className="text-xs"
                        >
                          Approve ({selectedDeposits.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBulkDepositAction('rejected')}
                          disabled={bulkProcessing}
                          className="text-xs"
                        >
                          Reject ({selectedDeposits.size})
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {deposits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No deposits found</p>
                  ) : (
                    deposits.map((deposit) => (
                      <div key={deposit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {deposit.status === 'pending' && (
                            <Checkbox
                              checked={selectedDeposits.has(deposit.id)}
                              onCheckedChange={() => toggleDepositSelection(deposit.id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base">{deposit.username || 'Unknown User'}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(deposit.created_at).toLocaleDateString()}
                            </p>
                            <p className="font-medium text-base sm:text-lg">${deposit.amount.toFixed(2)}</p>
                            {deposit.payment_method && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">Method: {deposit.payment_method}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                          <Badge 
                            variant={
                              deposit.status === 'completed' ? 'default' : 
                              deposit.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {deposit.status}
                          </Badge>
                          {deposit.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(deposit.id, deposit.user_id, deposit.amount, 'completed')}
                                className="text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDepositAction(deposit.id, deposit.user_id, deposit.amount, 'rejected')}
                                className="text-xs"
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Withdrawal Requests</CardTitle>
                  <CardDescription>Approve or reject user withdrawal requests</CardDescription>
                </div>
                {pendingWithdrawals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllWithdrawals}
                      className="text-xs"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      {selectedWithdrawals.size === pendingWithdrawals.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedWithdrawals.size > 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleBulkWithdrawalAction('approved')}
                          disabled={bulkProcessing}
                          className="text-xs"
                        >
                          Approve ({selectedWithdrawals.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBulkWithdrawalAction('rejected')}
                          disabled={bulkProcessing}
                          className="text-xs"
                        >
                          Reject ({selectedWithdrawals.size})
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {withdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No withdrawals found</p>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {withdrawal.status === 'pending' && (
                            <Checkbox
                              checked={selectedWithdrawals.has(withdrawal.id)}
                              onCheckedChange={() => toggleWithdrawalSelection(withdrawal.id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base">{withdrawal.username || 'Unknown User'}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(withdrawal.created_at).toLocaleDateString()}
                            </p>
                            <p className="font-medium text-base sm:text-lg">${withdrawal.amount.toFixed(2)}</p>
                            {withdrawal.payment_method && (
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Method: {withdrawal.payment_method.replace('_', ' ')}
                              </p>
                            )}
                            {withdrawal.payment_details && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                Details: {typeof withdrawal.payment_details === 'object' && withdrawal.payment_details.details 
                                  ? withdrawal.payment_details.details 
                                  : JSON.stringify(withdrawal.payment_details)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                          <Badge 
                            variant={
                              withdrawal.status === 'completed' ? 'default' : 
                              withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {withdrawal.status}
                          </Badge>
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawalAction(withdrawal.id, withdrawal.user_id, withdrawal.amount, 'approved')}
                                className="text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleWithdrawalAction(withdrawal.id, withdrawal.user_id, withdrawal.amount, 'rejected')}
                                className="text-xs"
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;