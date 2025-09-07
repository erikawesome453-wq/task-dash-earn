import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Shield, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Earn Money Daily
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Complete simple tasks and earn rewards. Up to 5 tasks per day, easy payouts, and secure platform.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/admin">Admin Panel</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="text-lg">Easy Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Earn $0.10-$0.15 per task. Simple clicks, instant rewards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="text-lg">Daily Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete up to 5 tasks per day. Fair system for everyone.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="text-lg">Secure Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your data is safe. Secure authentication and payments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="text-lg">Quick Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Withdraw earnings at $5 minimum. Fast approval process.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <div className="mt-20 space-y-8">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your account in seconds. No complex verification required.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold">Complete Tasks</h3>
                <p className="text-muted-foreground">
                  Click on tasks, visit websites, earn rewards instantly.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold">Get Paid</h3>
                <p className="text-muted-foreground">
                  Request withdrawal when you reach $5. Fast approval process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
