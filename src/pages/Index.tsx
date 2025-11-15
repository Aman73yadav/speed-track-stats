import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EventTester } from "@/components/EventTester";
import { ApiDocs } from "@/components/ApiDocs";
import { QueueStatus } from "@/components/QueueStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerUpdater } from "@/components/ServiceWorkerUpdater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: Activity },
    { value: "queue", label: "Queue Status", icon: Activity },
    { value: "test", label: "Test API", icon: Activity },
    { value: "docs", label: "API Docs", icon: Activity },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-foreground">Analytics Engine</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">High-performance event tracking & reporting</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "secondary" : "ghost"}
                      className="justify-start h-12 text-base"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <tab.icon className="mr-3 h-5 w-5" />
                      {tab.label}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Desktop Tabs - Hidden on Mobile */}
          <TabsList className="hidden md:grid w-full max-w-2xl grid-cols-4 h-12">
            <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="queue" className="text-sm">Queue Status</TabsTrigger>
            <TabsTrigger value="test" className="text-sm">Test API</TabsTrigger>
            <TabsTrigger value="docs" className="text-sm">API Docs</TabsTrigger>
          </TabsList>

          {/* Mobile: Show active tab title */}
          <div className="md:hidden">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {tabs.find(t => t.value === activeTab)?.label}
            </h2>
          </div>

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

      {/* PWA Features */}
      <ServiceWorkerUpdater />
      <OfflineIndicator />
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
