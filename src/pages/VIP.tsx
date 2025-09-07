import React from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  CheckCircle, 
  Lock, 
  Target,
  TrendingUp,
  Gift,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const VIPPage = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const currentLevel = profile?.vip_level || 0;
  const totalActivity = (parseFloat(profile?.total_deposited || '0') + parseFloat(profile?.total_earned || '0'));

  const vipLevels = [
    {
      level: 0,
      name: 'Standard',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-muted text-muted-foreground',
      borderColor: 'border-muted',
      requirement: 0,
      nextRequirement: 20,
      benefits: [
        '5 tasks per day',
        'Basic support',
        'Standard rewards'
      ]
    },
    {
      level: 1,
      name: 'VIP 1',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-blue-500/10 text-blue-500',
      borderColor: 'border-blue-500/20',
      requirement: 20,
      nextRequirement: 50,
      benefits: [
        '10 tasks per day',
        'Priority support',
        '5% bonus rewards',
        'Exclusive tasks access'
      ]
    },
    {
      level: 2,
      name: 'VIP 2',
      icon: <Gift className="h-5 w-5" />,
      color: 'bg-green-500/10 text-green-500',
      borderColor: 'border-green-500/20',
      requirement: 50,
      nextRequirement: 100,
      benefits: [
        '15 tasks per day',
        'VIP support channel',
        '10% bonus rewards',
        'Weekly bonus tasks',
        'Faster withdrawals'
      ]
    },
    {
      level: 3,
      name: 'VIP 3',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-purple-500/10 text-purple-500',
      borderColor: 'border-purple-500/20',
      requirement: 100,
      nextRequirement: 200,
      benefits: [
        '20 tasks per day',
        'Dedicated VIP support',
        '15% bonus rewards',
        'Premium task categories',
        'Monthly bonus rewards',
        'Lower withdrawal fees'
      ]
    },
    {
      level: 4,
      name: 'VIP 4',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-orange-500/10 text-orange-500',
      borderColor: 'border-orange-500/20',
      requirement: 200,
      nextRequirement: 500,
      benefits: [
        '25 tasks per day',
        'Premium support',
        '20% bonus rewards',
        'Exclusive VIP tasks',
        'Early access to new features',
        'Free withdrawals',
        'Special VIP events'
      ]
    },
    {
      level: 5,
      name: 'VIP 5',
      icon: <Crown className="h-5 w-5" />,
      color: 'gradient-primary text-primary-foreground',
      borderColor: 'border-primary',
      requirement: 500,
      nextRequirement: null,
      benefits: [
        '30 tasks per day',
        'White-glove support',
        '25% bonus rewards',
        'Unlimited premium tasks',
        'Beta feature access',
        'Instant withdrawals',
        'VIP-only competitions',
        'Personal account manager'
      ]
    }
  ];

  const getCurrentProgress = () => {
    const currentVip = vipLevels[currentLevel];
    const nextVip = vipLevels[currentLevel + 1];
    
    if (!nextVip) {
      return 100; // Max level reached
    }
    
    const progress = ((totalActivity - currentVip.requirement) / (nextVip.requirement - currentVip.requirement)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getRequiredAmount = () => {
    const nextVip = vipLevels[currentLevel + 1];
    if (!nextVip) return 0;
    return nextVip.requirement - totalActivity;
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
              <Crown className="h-8 w-8 text-primary" />
              VIP Levels
            </h1>
            <p className="text-muted-foreground mt-2">Unlock exclusive benefits as you grow with us</p>
          </div>
        </div>

        {/* Current Status */}
        <Card className="card-elegant mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {vipLevels[currentLevel].icon}
                <span>Current Level: {vipLevels[currentLevel].name}</span>
              </div>
              <Badge className={`border ${vipLevels[currentLevel].color} ${vipLevels[currentLevel].borderColor}`}>
                <Crown className="h-3 w-3 mr-1" />
                Level {currentLevel}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your total activity: ${totalActivity.toFixed(2)} (Deposits + Earnings)
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {currentLevel < 5 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Progress to {vipLevels[currentLevel + 1].name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ${getRequiredAmount().toFixed(2)} needed
                  </span>
                </div>
                <Progress value={getCurrentProgress()} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Reach ${vipLevels[currentLevel + 1].requirement} in total activity to unlock the next level
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold text-gradient-primary">
                  Congratulations! You've reached the highest VIP level!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vipLevels.map((vip) => {
            const isCurrentLevel = vip.level === currentLevel;
            const isUnlocked = vip.level <= currentLevel;
            const isNext = vip.level === currentLevel + 1;

            return (
              <Card 
                key={vip.level}
                className={`card-elegant hover-lift relative ${
                  isCurrentLevel ? 'ring-2 ring-primary' : ''
                } ${isNext ? 'ring-2 ring-accent/50' : ''}`}
              >
                {isCurrentLevel && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground">
                      Current Level
                    </Badge>
                  </div>
                )}
                
                {isNext && !isCurrentLevel && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      Next Level
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    isUnlocked ? vip.color : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {isUnlocked ? vip.icon : <Lock className="h-5 w-5" />}
                  </div>
                  
                  <CardTitle className="flex items-center justify-center gap-2">
                    {vip.name}
                  </CardTitle>
                  
                  <CardDescription>
                    {vip.requirement === 0 
                      ? 'Starting level'
                      : `Requires $${vip.requirement} total activity`
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {vip.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className={`h-4 w-4 mt-0.5 ${
                          isUnlocked ? 'text-green-500' : 'text-muted-foreground'
                        }`} />
                        <span className={`text-sm ${
                          isUnlocked ? '' : 'text-muted-foreground'
                        }`}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How to Upgrade */}
        <Card className="card-elegant mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              How to Upgrade Your VIP Level
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Ways to Increase Activity
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Complete daily tasks and earn rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Make deposits to boost your total activity
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Refer friends and earn referral bonuses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Participate in special events and promotions
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  VIP Benefits
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Higher daily task limits
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Bonus reward percentages
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Exclusive features and events
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VIPPage;