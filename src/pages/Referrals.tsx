import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  TrendingUp,
  ExternalLink,
  Check,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Referral {
  id: string;
  referred_id: string;
  bonus_earned: number;
  created_at: string;
}

const ReferralsPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}/auth?ref=${profile?.referral_code}`;

  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  // Redirect check - after all hooks
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskEarn and Start Earning!',
          text: 'I\'m earning money by completing simple tasks on TaskEarn. Join me and get a $1 bonus!',
          url: referralUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying
      copyReferralLink();
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
              <Users className="h-8 w-8 text-primary" />
              Referral Program
            </h1>
            <p className="text-muted-foreground mt-2">Invite friends and earn $1 for each signup!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="card-elegant hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                      <p className="text-2xl font-bold text-gradient-primary">
                        {profile?.total_referrals || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Referral Earnings</p>
                      <p className="text-2xl font-bold text-gradient-accent">
                        ${parseFloat(profile?.referral_earnings || '0').toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How it Works */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Share Your Link</p>
                      <p className="text-xs text-muted-foreground">Send your unique referral link to friends</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Friend Signs Up</p>
                      <p className="text-xs text-muted-foreground">They create an account using your link</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Earn Bonus</p>
                      <p className="text-xs text-muted-foreground">Get $1.00 instantly added to your wallet</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Link Card */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Share this link with friends to earn $1 for each signup
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={referralUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={copyReferralLink}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={shareReferralLink}
                      className="gradient-primary hover-glow flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your referral code:</p>
                  <div className="flex items-center gap-2">
                    <Badge className="gradient-primary text-primary-foreground font-mono text-lg px-3 py-1">
                      {profile?.referral_code}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Referral History
                </CardTitle>
                <CardDescription>
                  People you've successfully referred
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No referrals yet</p>
                    <p className="text-sm">Start sharing your referral link to see your referrals here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover-lift"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          
                          <div>
                            <p className="font-medium">
                              User #{referral.referred_id.slice(-8)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Joined {new Date(referral.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className="gradient-primary text-primary-foreground">
                            +${referral.bonus_earned.toFixed(2)}
                          </Badge>
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

export default ReferralsPage;