import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Code, Database, Zap, BarChart3 } from "lucide-react";

export const ApiDocs = () => {
  const apiUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Architecture Overview
          </CardTitle>
          <CardDescription>High-performance analytics system design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Service 1: Ingestion API (Ultra-Fast)
            </h3>
            <p className="text-sm text-muted-foreground">
              Receives events and queues them asynchronously using Edge Functions with background tasks.
              Returns immediately without waiting for database writes.
            </p>

            <h3 className="font-semibold text-foreground flex items-center gap-2 mt-4">
              <Database className="h-4 w-4 text-accent" />
              Service 2: Background Processor
            </h3>
            <p className="text-sm text-muted-foreground">
              Processes queued events in batches, aggregates statistics, and writes to the database.
              Can handle high volumes efficiently.
            </p>

            <h3 className="font-semibold text-foreground flex items-center gap-2 mt-4">
              <BarChart3 className="h-4 w-4 text-[hsl(var(--chart-2))]" />
              Service 3: Reporting API
            </h3>
            <p className="text-sm text-muted-foreground">
              Reads pre-aggregated data from the database for fast query responses.
              Supports filtering by site_id and optional date.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>POST /ingest-event</CardTitle>
          <CardDescription>Queue an analytics event (requires no authentication)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge>POST</Badge>
            <code className="ml-2 text-sm font-mono text-muted-foreground">
              {apiUrl}/functions/v1/ingest-event
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Request Body (JSON)</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`{
  "site_id": "site-abc-123",      // Required
  "event_type": "page_view",      // Required
  "path": "/pricing",             // Optional
  "user_id": "user-xyz-789",      // Optional
  "timestamp": "2025-11-12T19:30:01Z"  // Optional
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Success Response (202 Accepted)</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`{
  "success": true,
  "queued": true,
  "response_time_ms": 2.34
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">cURL Example</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`curl -X POST '${apiUrl}/functions/v1/ingest-event' \\
  -H 'apikey: ${apiKey.substring(0, 20)}...' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/pricing",
    "user_id": "user-xyz-789"
  }'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>POST /process-events</CardTitle>
          <CardDescription>Process queued events (background worker endpoint)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge variant="secondary">POST</Badge>
            <code className="ml-2 text-sm font-mono text-muted-foreground">
              {apiUrl}/functions/v1/process-events
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Success Response</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`{
  "success": true,
  "processed": 1450,
  "aggregated_days": 3
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">cURL Example</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`curl -X POST '${apiUrl}/functions/v1/process-events' \\
  -H 'apikey: ${apiKey.substring(0, 20)}...'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>GET /get-stats</CardTitle>
          <CardDescription>Retrieve aggregated analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge variant="outline">GET</Badge>
            <code className="ml-2 text-sm font-mono text-muted-foreground">
              {apiUrl}/functions/v1/get-stats
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Query Parameters</h4>
            <ul className="space-y-1 text-sm">
              <li className="font-mono">
                <code className="text-primary">site_id</code>
                <span className="text-muted-foreground"> (required) - Site identifier</span>
              </li>
              <li className="font-mono">
                <code className="text-primary">date</code>
                <span className="text-muted-foreground"> (optional) - Specific date (YYYY-MM-DD)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Success Response</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`{
  "site_id": "site-abc-123",
  "date": "2025-11-12",
  "total_views": 1450,
  "unique_users": 212,
  "top_paths": [
    { "path": "/pricing", "views": 700 },
    { "path": "/blog/post-1", "views": 500 },
    { "path": "/", "views": 250 }
  ]
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">cURL Examples</h4>
            <pre className="rounded-lg bg-muted/50 p-4 text-sm overflow-x-auto border border-border">
{`# Get all-time stats
curl '${apiUrl}/functions/v1/get-stats?site_id=site-abc-123' \\
  -H 'apikey: ${apiKey.substring(0, 20)}...'

# Get stats for specific date
curl '${apiUrl}/functions/v1/get-stats?site_id=site-abc-123&date=2025-11-12' \\
  -H 'apikey: ${apiKey.substring(0, 20)}...'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Database Schema</CardTitle>
          <CardDescription>PostgreSQL tables and relationships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">events_queue</h4>
              <p className="text-sm text-muted-foreground mb-2">Temporary holding for incoming events</p>
              <pre className="rounded-lg bg-muted/50 p-3 text-xs overflow-x-auto border border-border">
{`id (UUID, primary key)
site_id (TEXT, not null)
event_type (TEXT, not null)
path (TEXT, not null)
user_id (TEXT, not null)
timestamp (TIMESTAMPTZ, not null)
processed (BOOLEAN, default false)
created_at (TIMESTAMPTZ, default now())`}
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">events</h4>
              <p className="text-sm text-muted-foreground mb-2">Processed events</p>
              <pre className="rounded-lg bg-muted/50 p-3 text-xs overflow-x-auto border border-border">
{`id (UUID, primary key)
site_id (TEXT, not null)
event_type (TEXT, not null)
path (TEXT, not null)
user_id (TEXT, not null)
timestamp (TIMESTAMPTZ, not null)
created_at (TIMESTAMPTZ, default now())`}
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">daily_stats</h4>
              <p className="text-sm text-muted-foreground mb-2">Pre-aggregated daily statistics</p>
              <pre className="rounded-lg bg-muted/50 p-3 text-xs overflow-x-auto border border-border">
{`id (UUID, primary key)
site_id (TEXT, not null)
date (DATE, not null)
total_views (INTEGER, default 0)
unique_users (INTEGER, default 0)
path_stats (JSONB, array of {path, views})
last_updated (TIMESTAMPTZ, default now())
UNIQUE(site_id, date)`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
