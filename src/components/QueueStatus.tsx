import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Database, Activity, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ProcessingLog {
  timestamp: Date;
  processed: number;
  status: 'success' | 'error';
  message?: string;
}

export const QueueStatus = () => {
  const [queueCount, setQueueCount] = useState(0);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchQueueCount = async () => {
    try {
      const { count, error } = await supabase
        .from('events_queue')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      if (error) throw error;
      setQueueCount(count || 0);
    } catch (error) {
      console.error('Error fetching queue count:', error);
    }
  };

  const fetchLastProcessed = async () => {
    try {
      const { data, error } = await supabase
        .from('events_queue')
        .select('created_at')
        .eq('processed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      if (data) {
        setLastProcessed(new Date(data.created_at));
      }
    } catch (error) {
      console.error('Error fetching last processed:', error);
    }
  };

  const processEvents = async () => {
    if (queueCount === 0) {
      toast.info("No events in queue to process");
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-events`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process events');
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;
      
      const log: ProcessingLog = {
        timestamp: new Date(),
        processed: result.processed,
        status: 'success',
        message: `Processed ${result.processed} events in ${processingTime}ms`
      };
      
      setProcessingLogs(prev => [log, ...prev].slice(0, 5)); // Keep last 5 logs
      toast.success(log.message);
      
      // Refresh data
      await Promise.all([fetchQueueCount(), fetchLastProcessed()]);
    } catch (error) {
      console.error('Error processing events:', error);
      const log: ProcessingLog = {
        timestamp: new Date(),
        processed: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Processing failed'
      };
      setProcessingLogs(prev => [log, ...prev].slice(0, 5));
      toast.error("Failed to process events");
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchQueueCount(), fetchLastProcessed()]);
  };

  useEffect(() => {
    // Initial fetch
    refreshData();

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString();
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Queue Processing Status
            </CardTitle>
            <CardDescription>Real-time monitoring and processing control</CardDescription>
          </div>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Events in Queue</p>
              <p className="text-2xl font-bold">{queueCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Processed</p>
              <p className="text-lg font-semibold">{formatTimestamp(lastProcessed)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={processEvents}
            disabled={isProcessing || queueCount === 0}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Process Queue Now
              </>
            )}
          </Button>
          <Button
            onClick={refreshData}
            variant="outline"
            disabled={isProcessing}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {processingLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
            <div className="space-y-2">
              {processingLogs.map((log, index) => (
                <div
                  key={`${log.timestamp.getTime()}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {log.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
