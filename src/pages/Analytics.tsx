import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle, 
  Calendar,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface EarningData {
  date: string;
  earnings: number;
  tasks: number;
}

interface TaskStats {
  category: string;
  count: number;
  earnings: number;
}

const Analytics = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [earningsData, setEarningsData] = useState<EarningData[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [totals, setTotals] = useState({
    totalEarnings: 0,
    totalTasks: 0,
    avgDailyEarning: 0,
    bestDay: '',
    bestDayEarning: 0,
    completionRate: 0
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchAnalytics();
  }, [user, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Determine date range based on period
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate = subDays(endDate, 7);
          break;
        case 'weekly':
          startDate = subDays(endDate, 28);
          break;
        case 'monthly':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      // Fetch completed user tasks
      const { data: userTasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('*, tasks(category, platform)')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Process earnings by date
      const earningsByDate: Record<string, { earnings: number; tasks: number }> = {};
      const categoryStats: Record<string, { count: number; earnings: number }> = {};

      // Initialize all dates in range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        earningsByDate[dateKey] = { earnings: 0, tasks: 0 };
      });

      // Aggregate data
      userTasks?.forEach(task => {
        const dateKey = format(parseISO(task.completed_at), 'yyyy-MM-dd');
        if (earningsByDate[dateKey]) {
          earningsByDate[dateKey].earnings += task.reward_earned;
          earningsByDate[dateKey].tasks += 1;
        }

        // Category stats
        const category = (task.tasks as any)?.category || 'general';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, earnings: 0 };
        }
        categoryStats[category].count += 1;
        categoryStats[category].earnings += task.reward_earned;
      });

      // Convert to chart data
      const chartData: EarningData[] = Object.entries(earningsByDate).map(([date, data]) => ({
        date: format(parseISO(date), period === 'daily' ? 'EEE' : period === 'weekly' ? 'MMM d' : 'MMM d'),
        earnings: Number(data.earnings.toFixed(2)),
        tasks: data.tasks
      }));

      // Category chart data
      const categoryData: TaskStats[] = Object.entries(categoryStats).map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: data.count,
        earnings: Number(data.earnings.toFixed(2))
      }));

      // Calculate totals
      const totalEarnings = userTasks?.reduce((sum, t) => sum + t.reward_earned, 0) || 0;
      const totalTasks = userTasks?.length || 0;
      const avgDaily = dateRange.length > 0 ? totalEarnings / dateRange.length : 0;

      // Find best day
      let bestDay = '';
      let bestDayEarning = 0;
      Object.entries(earningsByDate).forEach(([date, data]) => {
        if (data.earnings > bestDayEarning) {
          bestDayEarning = data.earnings;
          bestDay = date;
        }
      });

      // Calculate completion rate (tasks done vs daily limit)
      const dailyLimit = profile?.vip_level ? [5, 10, 15, 20, 25, 30][profile.vip_level] : 5;
      const daysWithActivity = Object.values(earningsByDate).filter(d => d.tasks > 0).length;
      const maxPossibleTasks = daysWithActivity * dailyLimit;
      const completionRate = maxPossibleTasks > 0 ? (totalTasks / maxPossibleTasks) * 100 : 0;

      setEarningsData(chartData);
      setTaskStats(categoryData);
      setTotals({
        totalEarnings,
        totalTasks,
        avgDailyEarning: avgDaily,
        bestDay: bestDay ? format(parseISO(bestDay), 'MMM d, yyyy') : 'N/A',
        bestDayEarning,
        completionRate: Math.min(completionRate, 100)
      });

    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(280, 100%, 70%)', 'hsl(38, 92%, 50%)'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">${payload[0]?.value?.toFixed(2) || '0.00'}</p>
          {payload[1] && <p className="text-muted-foreground">{payload[1].value} tasks</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Earnings Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Track your earnings and task completion</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-gradient-primary">
                    ${totals.totalEarnings.toFixed(2)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{totals.totalTasks}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Daily</p>
                  <p className="text-2xl font-bold">${totals.avgDailyEarning.toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{totals.completionRate.toFixed(0)}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="mb-8">
          <TabsList>
            <TabsTrigger value="daily">Last 7 Days</TabsTrigger>
            <TabsTrigger value="weekly">Last 4 Weeks</TabsTrigger>
            <TabsTrigger value="monthly">Last 3 Months</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Earnings Chart */}
            <Card className="card-elegant lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Earnings Trend
                </CardTitle>
                <CardDescription>Your earnings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earningsData}>
                      <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#earningsGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Best Performance */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Best Performance
                </CardTitle>
                <CardDescription>Your top earning day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-xl">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Best Day</p>
                  <p className="font-semibold">{totals.bestDay}</p>
                  <p className="text-2xl font-bold text-gradient-primary mt-1">
                    ${totals.bestDayEarning.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">All-time Earned</span>
                    <span className="font-semibold">${profile?.total_earned?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">All-time Deposited</span>
                    <span className="font-semibold">${profile?.total_deposited?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Referral Earnings</span>
                    <span className="font-semibold">${profile?.referral_earnings?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks by Category */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Tasks by Category
                </CardTitle>
                <CardDescription>Distribution of completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {taskStats.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {taskStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No task data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Completion Bar Chart */}
            <Card className="card-elegant lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Daily Task Completion
                </CardTitle>
                <CardDescription>Number of tasks completed each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="tasks" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
