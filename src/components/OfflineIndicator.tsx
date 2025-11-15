import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showAlert) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant={isOnline ? "default" : "destructive"} className="border-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-accent" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
          <div>
            <AlertTitle className="text-sm font-semibold">
              {isOnline ? "Back Online" : "You're Offline"}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {isOnline 
                ? "Connection restored. Data will sync automatically."
                : "Showing cached data. Some features may be limited."}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};
