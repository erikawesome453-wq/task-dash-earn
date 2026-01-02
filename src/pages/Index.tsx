import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, Shield, Users, Star, Zap, TrendingUp, Award } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating Elements Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/3 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="text-xl sm:text-2xl font-bold text-gradient-primary">EarnTask</div>
        <div className="flex gap-2 sm:gap-4">
          <Button asChild variant="ghost" size="sm" className="hover-lift text-sm sm:text-base">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild size="sm" className="gradient-primary hover-glow text-sm sm:text-base">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:py-0">
        <div className="text-center space-y-6 sm:space-y-8 max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-primary/20">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              Trusted by 10,000+ Users
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-gradient-primary">Earn Money</span>
              <br />
              <span className="text-foreground">Every Day</span>
              <br />
              <span className="text-gradient-accent">Effortlessly</span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              Complete simple tasks, earn instant rewards. Join thousands of users making money daily with our secure and user-friendly platform.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 sm:gap-6 sm:flex-row justify-center items-center px-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 gradient-primary hover-glow pulse-glow">
              <Link to="/auth">
                <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start Earning Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover-lift">
              <Link to="/admin">
                <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Admin Access
              </Link>
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 max-w-2xl mx-auto px-2">
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-gradient-primary">$50K+</div>
              <div className="text-xs sm:text-base text-muted-foreground">Payouts</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-gradient-primary">10K+</div>
              <div className="text-xs sm:text-base text-muted-foreground">Users</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-gradient-primary">99.9%</div>
              <div className="text-xs sm:text-base text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-12 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="text-gradient-accent">Why Choose</span> EarnTask?
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Experience the future of online earning with our cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            <Card className="card-elegant hover-lift group">
              <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-sm sm:text-xl">Instant Rewards</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-3 sm:p-6 pt-0">
                <CardDescription className="text-xs sm:text-base leading-relaxed">
                  Earn $0.10-$0.15 per task with instant credit.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elegant hover-lift group">
              <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 gradient-accent rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-sm sm:text-xl">Daily Tasks</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-3 sm:p-6 pt-0">
                <CardDescription className="text-xs sm:text-base leading-relaxed">
                  Up to 5 tasks daily with fair distribution.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elegant hover-lift group">
              <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-5 w-5 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-sm sm:text-xl">100% Secure</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-3 sm:p-6 pt-0">
                <CardDescription className="text-xs sm:text-base leading-relaxed">
                  Bank-level security for your data.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elegant hover-lift group">
              <CardHeader className="text-center pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 gradient-accent rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-sm sm:text-xl">Fast Payouts</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-3 sm:p-6 pt-0">
                <CardDescription className="text-xs sm:text-base leading-relaxed">
                  Withdraw at $5 minimum, lightning-fast.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="relative py-12 sm:py-24 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground">
              Start earning in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12">
            <div className="text-center space-y-3 sm:space-y-6 group">
              <div className="relative mx-auto w-fit">
                <div className="w-16 h-16 sm:w-24 sm:h-24 gradient-primary rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl font-bold text-primary-foreground group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-24 sm:h-24 gradient-primary rounded-2xl sm:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold">Create Account</h3>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed px-2">
                Sign up in seconds with just your email.
              </p>
            </div>
            
            <div className="text-center space-y-3 sm:space-y-6 group">
              <div className="relative mx-auto w-fit">
                <div className="w-16 h-16 sm:w-24 sm:h-24 gradient-accent rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl font-bold text-primary-foreground group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-24 sm:h-24 gradient-accent rounded-2xl sm:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold">Complete Tasks</h3>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed px-2">
                Simple clicks, visit websites. Each task takes seconds.
              </p>
            </div>
            
            <div className="text-center space-y-3 sm:space-y-6 group">
              <div className="relative mx-auto w-fit">
                <div className="w-16 h-16 sm:w-24 sm:h-24 gradient-primary rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl font-bold text-primary-foreground group-hover:scale-110 transition-transform">
                  3
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-24 sm:h-24 gradient-primary rounded-2xl sm:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold">Get Paid</h3>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed px-2">
                Reach $5 minimum and request your payout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-12 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-elegant p-6 sm:p-12 rounded-2xl sm:rounded-3xl">
            <div className="space-y-4 sm:space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-primary/20">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                Join the Community
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                Ready to Start <span className="text-gradient-primary">Earning?</span>
              </h2>
              
              <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                Join thousands of users who are already earning daily. No hidden fees, no commitments.
              </p>
              
              <div className="flex justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 gradient-primary hover-glow">
                  <Link to="/auth">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Join Now - It's Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 sm:py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xl sm:text-2xl font-bold text-gradient-primary mb-2 sm:mb-4">EarnTask</div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your trusted platform for daily earnings. Secure, fast, and reliable.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
