import { useEffect, useState } from "react";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export const ServiceWorkerUpdater = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {offlineReady ? 'App Ready to Work Offline' : 'New Content Available'}
          </CardTitle>
          <CardDescription className="text-xs">
            {offlineReady 
              ? 'Analytics data is now cached for offline viewing'
              : 'Click reload to update to the latest version'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex gap-2">
          {needRefresh && (
            <Button 
              onClick={() => updateServiceWorker(true)}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              Reload
            </Button>
          )}
          <Button 
            onClick={close}
            variant="outline"
            size="sm"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
