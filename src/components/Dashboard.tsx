import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, TrendingUp, RefreshCw, BarChart3, Download, FileJson, FileText } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

interface DailyTrend {
  date: string;
  views: number;
  users: number;
}

export const Dashboard = () => {
  const [siteId, setSiteId] = useState("site-abc-123");
  const [date, setDate] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [trendData, setTrendData] = useState<DailyTrend[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ site_id: siteId });
      if (date) {
        params.append('date', date);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stats?${params.toString()}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      const statsData = await response.json();
      setStats(statsData);
      
      // Fetch trend data
      await fetchTrendData();
      
      toast.success("Stats loaded successfully");
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch stats");
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

  const fetchTrendData = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('date, total_views, unique_users')
        .eq('site_id', siteId)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;
      
      const trends: DailyTrend[] = (data || []).map(d => ({
        date: d.date,
        views: d.total_views || 0,
        users: d.unique_users || 0,
      }));
      
      setTrendData(trends);
    } catch (error) {
      console.error('Error fetching trend data:', error);
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

  const exportAsJSON = () => {
    const exportData = {
      stats,
      trendData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${siteId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  };

  const exportAsCSV = () => {
    if (!trendData.length) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ['Date', 'Total Views', 'Unique Users'];
    const rows = trendData.map(d => [d.date, d.views, d.users]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${siteId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  useEffect(() => {
    fetchStats();
    fetchQueueCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueCount();
      fetchTrendData();
    }, 30000);

    return () => clearInterval(interval);
  }, [siteId]);

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
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={exportAsJSON} 
              variant="outline"
              disabled={!stats}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
            <Button 
              onClick={exportAsCSV} 
              variant="outline"
              disabled={!trendData.length}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      {trendData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Views Trend
              </CardTitle>
              <CardDescription>Daily pageviews over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  views: {
                    label: "Views",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                User Engagement
              </CardTitle>
              <CardDescription>Unique users per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  users: {
                    label: "Users",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="users" 
                      fill="hsl(var(--chart-2))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

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
