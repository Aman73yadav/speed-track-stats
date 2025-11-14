import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

export const EventTester = () => {
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [response, setResponse] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    site_id: "site-abc-123",
    event_type: "page_view",
    path: "/pricing",
    user_id: "user-xyz-789",
    timestamp: new Date().toISOString(),
  });

  const generateRandomEvent = () => {
    const paths = ['/pricing', '/home', '/about', '/blog/post-1', '/contact', '/features'];
    const eventTypes = ['page_view', 'button_click', 'form_submit', 'video_play'];
    
    setFormData({
      site_id: `site-${Math.random().toString(36).substr(2, 9)}`,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      path: paths[Math.floor(Math.random() * paths.length)],
      user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    });
  };

  const sendEvent = async () => {
    setLoading(true);
    setResponseTime(null);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-event`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      setResponseTime(totalTime);

      if (!response.ok) {
        throw new Error('Failed to send event');
      }

      const result = await response.json();
      setResponse(result);
      
      toast.success(`Event queued in ${totalTime.toFixed(2)}ms!`);
    } catch (error) {
      console.error('Error sending event:', error);
      toast.error("Failed to send event");
      setResponse({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEvents = async () => {
    setLoading(true);
    const count = 100;
    const startTime = performance.now();
    
    try {
      const promises = Array.from({ length: count }, (_, i) => {
        const paths = ['/pricing', '/home', '/about', '/blog/post-1'];
        return fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-event`,
          {
            method: 'POST',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              site_id: "site-abc-123",
              event_type: "page_view",
              path: paths[i % paths.length],
              user_id: `user-${Math.floor(i / 5)}`,
              timestamp: new Date().toISOString(),
            }),
          }
        );
      });

      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / count;
      
      toast.success(`Sent ${count} events in ${totalTime.toFixed(0)}ms (avg: ${avgTime.toFixed(2)}ms per event)`);
      setResponse({ 
        success: true, 
        bulk_test: true,
        events_sent: count,
        total_time_ms: totalTime.toFixed(2),
        avg_time_ms: avgTime.toFixed(2)
      });
    } catch (error) {
      console.error('Error sending bulk events:', error);
      toast.error("Failed to send bulk events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Send Test Event
          </CardTitle>
          <CardDescription>Test the ingestion API with custom data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_id">Site ID *</Label>
            <Input
              id="site_id"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              className="bg-background border-input font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type *</Label>
            <Input
              id="event_type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="bg-background border-input font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              className="bg-background border-input font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_id">User ID</Label>
            <Input
              id="user_id"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="bg-background border-input font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={sendEvent} disabled={loading} className="flex-1 gap-2">
              <Send className="h-4 w-4" />
              {loading ? 'Sending...' : 'Send Event'}
            </Button>
            <Button 
              onClick={generateRandomEvent} 
              variant="outline"
              type="button"
            >
              Random
            </Button>
          </div>

          <Button 
            onClick={sendBulkEvents} 
            disabled={loading}
            variant="secondary"
            className="w-full gap-2"
          >
            <Zap className="h-4 w-4" />
            Send 100 Events (Load Test)
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Response</CardTitle>
          <CardDescription>
            {responseTime !== null && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {responseTime.toFixed(2)}ms
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {response ? (
            <Textarea
              value={JSON.stringify(response, null, 2)}
              readOnly
              className="min-h-[400px] font-mono text-sm bg-muted/50 border-border"
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">Send an event to see the response</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
