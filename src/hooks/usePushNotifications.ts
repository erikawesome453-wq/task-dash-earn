import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HfGqf-OgxwTqJMTnpM8eGcVbEAM0L6l3DLPh3p5S0LnQH1ZXQN5Tn8xLLk';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications"
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setLoading(true);
    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
      });

      // Store subscription in database (could be used for targeted push)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Push subscription created for user:', user.id);
        // Could store subscription endpoint in database here if needed
      }

      setIsSubscribed(true);
      toast({
        title: "Subscribed!",
        description: "You'll receive notifications for important updates"
      });
      return true;
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not enable push notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast({
          title: "Unsubscribed",
          description: "You won't receive push notifications anymore"
        });
      }
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      toast({
        title: "Error",
        description: error.message || "Could not disable push notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show a local notification (for testing or immediate alerts)
  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
