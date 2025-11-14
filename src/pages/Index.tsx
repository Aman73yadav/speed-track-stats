import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EventTester } from "@/components/EventTester";
import { ApiDocs } from "@/components/ApiDocs";
import { QueueStatus } from "@/components/QueueStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Engine</h1>
              <p className="text-sm text-muted-foreground">High-performance event tracking & reporting</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="queue">Queue Status</TabsTrigger>
            <TabsTrigger value="test">Test API</TabsTrigger>
            <TabsTrigger value="docs">API Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <QueueStatus />
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <EventTester />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <ApiDocs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
