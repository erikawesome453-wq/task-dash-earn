import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

interface DailyData {
  date: string;
  displayDate: string;
  users: number;
  deposits: number;
  withdrawals: number;
  tasks: number;
  earnings: number;
}

interface SummaryStats {
  totalUsers: number;
  newUsersToday: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTasksCompleted: number;
  totalEarningsPaid: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(280, 100%, 70%)', 'hsl(38, 92%, 50%)'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTasksCompleted: 0,
    totalEarningsPaid: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = subDays(endDate, daysBack);

      // Initialize all dates
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dataByDate: Record<string, DailyData> = {};
      
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        dataByDate[dateKey] = {
          date: dateKey,
          displayDate: format(date, period === '7d' ? 'EEE' : 'MMM d'),
          users: 0,
          deposits: 0,
          withdrawals: 0,
          tasks: 0,
          earnings: 0
        };
      });

      // Fetch all profiles for user growth
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      profiles?.forEach(p => {
        const dateKey = format(parseISO(p.created_at), 'yyyy-MM-dd');
        if (dataByDate[dateKey]) {
          dataByDate[dateKey].users += 1;
        }
      });

      // Fetch transactions for deposits/withdrawals
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      transactions?.forEach(t => {
        const dateKey = format(parseISO(t.created_at), 'yyyy-MM-dd');
        if (dataByDate[dateKey]) {
          if (t.transaction_type === 'deposit' && t.status === 'completed') {
            dataByDate[dateKey].deposits += t.amount;
          } else if (t.transaction_type === 'withdraw' && t.status === 'completed') {
            dataByDate[dateKey].withdrawals += t.amount;
          }
        }
      });

      // Fetch task completions
      const { data: userTasks } = await supabase
        .from('user_tasks')
        .select('completed_at, reward_earned')
        .gte('completed_at', startDate.toISOString());

      userTasks?.forEach(t => {
        const dateKey = format(parseISO(t.completed_at), 'yyyy-MM-dd');
        if (dataByDate[dateKey]) {
          dataByDate[dateKey].tasks += 1;
          dataByDate[dateKey].earnings += t.reward_earned;
        }
      });

      // Convert to array and calculate cumulative users
      const chartData = Object.values(dataByDate).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      // Calculate summary stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = format(new Date(), 'yyyy-MM-dd');
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      const { data: allTransactions } = await supabase
        .from('wallet_transactions')
        .select('transaction_type, amount, status');

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let pendingDeposits = 0;
      let pendingWithdrawals = 0;

      allTransactions?.forEach(t => {
        if (t.transaction_type === 'deposit') {
          if (t.status === 'completed') totalDeposits += t.amount;
          if (t.status === 'pending') pendingDeposits += 1;
        } else if (t.transaction_type === 'withdraw') {
          if (t.status === 'completed') totalWithdrawals += t.amount;
          if (t.status === 'pending') pendingWithdrawals += 1;
        }
      });

      const { count: totalTasksCompleted } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true });

      const { data: earningsData } = await supabase
        .from('profiles')
        .select('total_earned');

      const totalEarningsPaid = earningsData?.reduce((sum, p) => sum + (p.total_earned || 0), 0) || 0;

      setDailyData(chartData);
      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalDeposits,
        totalWithdrawals,
        totalTasksCompleted: totalTasksCompleted || 0,
        totalEarningsPaid,
        pendingDeposits,
        pendingWithdrawals
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes('$') || entry.dataKey === 'deposits' || entry.dataKey === 'withdrawals' || entry.dataKey === 'earnings' 
                ? `$${entry.value.toFixed(2)}` 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="7d" className="text-xs sm:text-sm">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs sm:text-sm">30 Days</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs sm:text-sm">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</p>
                {stats.newUsersToday > 0 && (
                  <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3" />
                    +{stats.newUsersToday} today
                  </p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-xl sm:text-2xl font-bold text-green-500">${stats.totalDeposits.toFixed(2)}</p>
                {stats.pendingDeposits > 0 && (
                  <Badge variant="outline" className="text-xs mt-1 border-yellow-500/50 text-yellow-500">
                    {stats.pendingDeposits} pending
                  </Badge>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Withdrawals</p>
                <p className="text-xl sm:text-2xl font-bold text-red-500">${stats.totalWithdrawals.toFixed(2)}</p>
                {stats.pendingWithdrawals > 0 && (
                  <Badge variant="outline" className="text-xs mt-1 border-yellow-500/50 text-yellow-500">
                    {stats.pendingWithdrawals} pending
                  </Badge>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalTasksCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.totalEarningsPaid.toFixed(2)} paid
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              User Signups
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    name="New Users"
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#userGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deposits vs Withdrawals Chart */}
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Deposits vs Withdrawals
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Financial activity comparison</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="deposits" name="Deposits" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Completions Chart */}
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Task Completions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Daily task completions</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="tasks" 
                    name="Tasks Completed"
                    fill="hsl(217, 91%, 60%)" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Paid Chart */}
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Earnings Paid Out
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Task rewards distributed to users</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    name="Earnings"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Flow Card */}
      <Card className="card-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/5 rounded-xl border border-green-500/20">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-500">${stats.totalDeposits.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">from deposits</p>
            </div>
            <div className="text-center p-4 bg-red-500/5 rounded-xl border border-red-500/20">
              <p className="text-sm text-muted-foreground">Total Outflow</p>
              <p className="text-2xl font-bold text-red-500">${(stats.totalWithdrawals + stats.totalEarningsPaid).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">withdrawals + earnings</p>
            </div>
            <div className={`text-center p-4 rounded-xl border ${
              stats.totalDeposits - stats.totalWithdrawals - stats.totalEarningsPaid >= 0 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${
                stats.totalDeposits - stats.totalWithdrawals - stats.totalEarningsPaid >= 0 
                  ? 'text-primary' 
                  : 'text-red-500'
              }`}>
                ${(stats.totalDeposits - stats.totalWithdrawals - stats.totalEarningsPaid).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">income - outflow</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
