import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  payment_method?: string;
  description?: string;
  created_at: string;
}

const WalletPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }

    if (!paymentDetails) {
      toast({
        title: "Missing Details",
        description: "Please provide payment details",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Create deposit transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'deposit',
          amount: parseFloat(depositAmount),
          status: 'pending',
          payment_method: paymentMethod,
          payment_details: { details: paymentDetails },
          description: `Deposit via ${paymentMethod.replace('_', ' ')}`
        });

      if (error) throw error;

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request is pending admin approval. Funds will be added to your wallet once approved."
      });

      setIsDepositOpen(false);
      setDepositAmount('');
      setPaymentDetails('');
      await fetchTransactions();
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit deposit request",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const currentBalance = parseFloat(profile?.wallet_balance || '0');
    const minWithdraw = 5.00;

    if (!withdrawAmount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    if (amount < minWithdraw) {
      toast({
        title: "Amount Too Small",
        description: `Minimum withdrawal amount is $${minWithdraw.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (amount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    if (!paymentDetails) {
      toast({
        title: "Missing Details",
        description: "Please provide payment details",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Create withdrawal transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'withdraw',
          amount: amount,
          status: 'pending',
          payment_method: paymentMethod,
          payment_details: { details: paymentDetails },
          description: `Withdrawal via ${paymentMethod.replace('_', ' ')}`
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request is pending admin approval."
      });

      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setPaymentDetails('');
      await fetchTransactions();
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdraw': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'task_reward': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'referral_bonus': return <Plus className="h-4 w-4 text-purple-500" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_money': return <Smartphone className="h-4 w-4" />;
      case 'paypal': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              My Wallet
            </h1>
            <p className="text-muted-foreground mt-2">Manage your funds and track transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <Card className="card-elegant hover-lift">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-sm text-muted-foreground">Current Balance</CardTitle>
                <div className="text-3xl font-bold text-gradient-primary">
                  ${parseFloat(profile?.wallet_balance || '0').toFixed(2)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gradient-primary hover-glow">
                      <Plus className="mr-2 h-4 w-4" />
                      Deposit Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Deposit Funds</DialogTitle>
                      <DialogDescription>
                        Add money to your wallet. Deposits require admin approval.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deposit-amount">Amount ($)</Label>
                        <Input
                          id="deposit-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="deposit-method">Payment Method</Label>
                        <select
                          id="deposit-method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full p-2 border border-input bg-background rounded-lg"
                        >
                          <option value="mobile_money">Mobile Money</option>
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="deposit-details">Payment Details</Label>
                        <Input
                          id="deposit-details"
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          placeholder="Enter payment details (account number, email, etc.)"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleDeposit} 
                        disabled={processing}
                        className="w-full gradient-primary"
                      >
                        {processing ? 'Processing...' : 'Submit Deposit Request'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={parseFloat(profile?.wallet_balance || '0') < 5}
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Withdraw Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                      <DialogDescription>
                        Request a withdrawal from your wallet. Minimum $5.00 required.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdraw-amount">Amount ($)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="0.01"
                          min="5.00"
                          max={parseFloat(profile?.wallet_balance || '0')}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available: ${parseFloat(profile?.wallet_balance || '0').toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="withdraw-method">Payment Method</Label>
                        <select
                          id="withdraw-method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full p-2 border border-input bg-background rounded-lg"
                        >
                          <option value="mobile_money">Mobile Money</option>
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="withdraw-details">Payment Details</Label>
                        <Input
                          id="withdraw-details"
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          placeholder="Enter payment details (account number, email, etc.)"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleWithdraw} 
                        disabled={processing}
                        className="w-full gradient-primary"
                      >
                        {processing ? 'Processing...' : 'Submit Withdrawal Request'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <p className="text-xs text-muted-foreground text-center">
                  All transactions require admin approval
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="font-semibold text-gradient-primary">
                    ${parseFloat(profile?.total_earned || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Deposited</span>
                  <span className="font-semibold">
                    ${parseFloat(profile?.total_deposited || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Referral Bonus</span>
                  <span className="font-semibold text-gradient-accent">
                    ${parseFloat(profile?.referral_earnings || '0').toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Recent wallet transactions and their status
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover-lift"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {getTransactionIcon(transaction.transaction_type)}
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium capitalize">
                                {transaction.transaction_type.replace('_', ' ')}
                              </span>
                              {transaction.payment_method && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {getPaymentMethodIcon(transaction.payment_method)}
                                  <span className="capitalize">
                                    {transaction.payment_method.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className={`font-semibold ${
                              transaction.transaction_type === 'withdraw' ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {transaction.transaction_type === 'withdraw' ? '-' : '+'}
                              ${transaction.amount.toFixed(2)}
                            </div>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;