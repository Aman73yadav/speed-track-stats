import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, TrendingUp, RefreshCw, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface PathStat {
  path: string;
  views: number;
}

interface Stats {
  site_id: string;
  date: string;
  total_views: number;
  unique_users: number;
  top_paths: PathStat[];
  days_tracked?: number;
}

export const Dashboard = () => {
  const [siteId, setSiteId] = useState("site-abc-123");
  const [date, setDate] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ site_id: siteId });
      if (date) {
        params.append('date', date);
      }

      const { data, error } = await supabase.functions.invoke('get-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stats?${params.toString()}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsData = await response.json();
      setStats(statsData);
      toast.success("Stats loaded successfully");
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

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

  const processEvents = async () => {
    setLoading(true);
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
      toast.success(`Processed ${result.processed} events`);
      
      // Refresh data
      await Promise.all([fetchStats(), fetchQueueCount()]);
    } catch (error) {
      console.error('Error processing events:', error);
      toast.error("Failed to process events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQueueCount();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchQueueCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Query Statistics</CardTitle>
          <CardDescription>Fetch aggregated analytics for a site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteId">Site ID</Label>
              <Input
                id="siteId"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="site-abc-123"
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date (optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchStats} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Fetch Stats'}
            </Button>
            {queueCount > 0 && (
              <Button 
                onClick={processEvents} 
                disabled={loading}
                variant="secondary"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Process Queue ({queueCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total_views.toLocaleString()}</div>
                {stats.days_tracked && (
                  <p className="text-xs text-muted-foreground">
                    Across {stats.days_tracked} days
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.unique_users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Tracked visitors
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Path Views</CardTitle>
                <TrendingUp className="h-4 w-4 text-[hsl(var(--chart-2))]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.top_paths[0]?.views.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {stats.top_paths[0]?.path || 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most viewed paths on {stats.site_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_paths.length > 0 ? (
                  stats.top_paths.map((pathStat, index) => (
                    <div key={pathStat.path} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-mono text-sm">{pathStat.path}</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {pathStat.views.toLocaleString()} views
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No path data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
