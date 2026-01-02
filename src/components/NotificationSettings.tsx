import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    showNotification
  } = usePushNotifications();

  const handleTestNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from EarnTask!',
      tag: 'test-notification'
    });
  };

  if (!isSupported) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in your browser. Try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Push Notifications</CardTitle>
          </div>
          <Badge 
            variant={isSubscribed ? "default" : "secondary"}
            className={isSubscribed ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
          >
            {isSubscribed ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>
          Receive instant alerts when your deposits or withdrawals are approved
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'denied' ? (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings to receive alerts.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            {isSubscribed ? (
              <>
                <Button
                  variant="outline"
                  onClick={unsubscribe}
                  disabled={loading}
                  className="flex-1"
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Disable Notifications'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleTestNotification}
                  className="flex-1"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Test Notification
                </Button>
              </>
            ) : (
              <Button
                onClick={subscribe}
                disabled={loading}
                className="gradient-primary hover-glow flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            )}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          You'll receive notifications for deposit/withdrawal approvals and important account updates even when you're not on the site.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
