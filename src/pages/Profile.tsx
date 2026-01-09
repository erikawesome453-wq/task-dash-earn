import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Crown, Calendar, Mail, Phone, Save, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    phone: profile?.phone || '',
    payment_method: profile?.payment_method || 'mobile_money'
  });

  const getVipLabel = (level: number) => {
    switch (level) {
      case 0: return 'Standard';
      case 1: return 'VIP 1';
      case 2: return 'VIP 2';
      case 3: return 'VIP 3';
      case 4: return 'VIP 4';
      case 5: return 'VIP 5';
      default: return 'Standard';
    }
  };

  // Redirect check - after all hooks
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getVipColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted text-muted-foreground';
      case 1: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 2: return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 3: return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 4: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 5: return 'gradient-primary text-primary-foreground border-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          phone: formData.phone,
          payment_method: formData.payment_method
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              My Profile
            </h1>
            <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
          </div>
          
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="hover-lift">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="card-elegant hover-lift">
              <CardHeader className="text-center pb-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-2xl font-bold text-primary">
                      {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{profile?.username}</h3>
                    <Badge className={`border ${getVipColor(profile?.vip_level || 0)}`}>
                      <Crown className="h-3 w-3 mr-1" />
                      {getVipLabel(profile?.vip_level || 0)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(profile?.join_date || profile?.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Earned</span>
                    <span className="text-sm font-semibold text-gradient-primary">
                      ${parseFloat(profile?.total_earned || '0').toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Referrals</span>
                    <span className="text-sm font-semibold">
                      {profile?.total_referrals || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        {profile?.username}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {profile?.email || user.email}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {profile?.phone || 'Not provided'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Preferred Payment Method</Label>
                    {isEditing ? (
                      <select
                        id="payment_method"
                        value={formData.payment_method}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="w-full p-3 border border-input bg-background rounded-lg"
                      >
                        <option value="mobile_money">Mobile Money</option>
                        <option value="paypal">PayPal</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-lg capitalize">
                        {profile?.payment_method?.replace('_', ' ') || 'Mobile Money'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="gradient-primary hover-glow"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          username: profile?.username || '',
                          phone: profile?.phone || '',
                          payment_method: profile?.payment_method || 'mobile_money'
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>Overview of your account activity</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-gradient-primary">
                      ${parseFloat(profile?.wallet_balance || '0').toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-gradient-accent">
                      ${parseFloat(profile?.total_earned || '0').toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Earned</div>
                  </div>
                  
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-gradient-primary">
                      {profile?.total_referrals || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Referrals</div>
                  </div>
                  
                  <div className="text-center p-4 bg-accent/5 rounded-lg">
                    <div className="text-2xl font-bold text-gradient-accent">
                      ${parseFloat(profile?.referral_earnings || '0').toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Referral Bonus</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;