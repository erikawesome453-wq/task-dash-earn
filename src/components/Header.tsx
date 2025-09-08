import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Wallet, 
  CheckSquare, 
  Users, 
  Crown, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface HeaderProps {
  tasksCompletedToday?: number;
  dailyTaskLimit?: number;
}

const Header: React.FC<HeaderProps> = ({ tasksCompletedToday = 0, dailyTaskLimit = 5 }) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getVipLabel = (level: number) => {
    switch (level) {
      case 0: return 'Standard';
      case 1: return 'Level 1';
      case 2: return 'VIP';
      case 3: return 'VVIP';
      case 4: return 'Super VIP';
      case 5: return 'Super VVIP';
      default: return 'Standard';
    }
  };

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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: CheckSquare },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/referrals', label: 'Referrals', icon: Users },
    { path: '/vip', label: 'VIP Levels', icon: Crown },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-gradient-primary">TaskEarn</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Wallet Balance - Desktop */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-semibold text-gradient-primary">
                ${parseFloat(profile?.wallet_balance || '0').toFixed(2)}
              </span>
            </div>

            {/* Task Progress - Desktop */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {tasksCompletedToday}/{dailyTaskLimit}
              </span>
            </div>

            {/* User Avatar & VIP Level */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs font-semibold">
                    {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.username}</p>
                  <Badge className={`text-xs border ${getVipColor(profile?.vip_level || 0)}`}>
                    <Crown className="h-3 w-3 mr-1" />
                    {getVipLabel(profile?.vip_level || 0)}
                  </Badge>
                </div>
              </div>

              {/* Sign Out - Desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hidden md:flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {/* Mobile Stats */}
              <div className="flex justify-between items-center px-4 py-2 bg-muted/50 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="font-semibold">${parseFloat(profile?.wallet_balance || '0').toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium">{tasksCompletedToday}/{dailyTaskLimit}</span>
                </div>
              </div>

              {/* Mobile Navigation */}
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}

              {/* Mobile Sign Out */}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-3 mt-4"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;