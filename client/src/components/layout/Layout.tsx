import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Settings, 
  Activity, 
  Search, 
  Bell, 
  Menu, 
  Hexagon,
  Cpu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Database, label: "Docking Results", href: "/explorer" },
    { icon: Activity, label: "Analysis", href: "/analysis" },
    { icon: FileText, label: "Reports", href: "/reports" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <Hexagon className="w-6 h-6 animate-pulse" />
          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">NeuraViva</h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">AI Docking Agent</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-lg bg-card border border-border/50 bg-[url('/grid-pattern.svg')]">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Solana TPS</span>
              <span className="font-mono text-foreground">3,492</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Agent Status</span>
              <span className="text-green-400 font-bold">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 px-2">
            <Button variant="ghost" size="icon" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
            </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:block w-64 border-r border-border/40 bg-sidebar/50 backdrop-blur-xl fixed inset-y-0 z-50">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
            <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 border-r border-border/40 bg-sidebar">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>
          
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Search proteins, ligands, or simulations..." 
                    className="pl-9 bg-secondary/5 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden sm:flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all shadow-[0_0_10px_rgba(0,255,255,0.05)]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Wallet Connected
            </Button>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </Button>
            <Avatar className="h-8 w-8 ring-2 ring-border ring-offset-2 ring-offset-background">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>NV</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}