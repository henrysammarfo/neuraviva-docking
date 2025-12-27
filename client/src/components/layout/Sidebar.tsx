import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Search,
    FileText,
    Settings,
    LogOut,
    Menu,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function Sidebar() {
    const [location] = useLocation();
    const { user, logoutMutation } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
        <Link href={href}>
            <a
                className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-1",
                    location === href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setIsOpen(false)}
            >
                <Icon className="mr-3 h-5 w-5" />
                {label}
            </a>
        </Link>
    );

    const Navigation = () => (
        <div className="flex flex-col h-full">
            <div className="p-6">
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    NeuraViva
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Research Agent</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/explorer" icon={Search} label="Explorer" />
                <NavItem href="/reports" icon={FileText} label="Reports" />
                <NavItem href="/profile" icon={User} label="Profile" />
            </nav>

            {/* User Avatar Section */}
            {user && (
                <div className="px-4 py-3 border-t border-border/50">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/5">
                        <img
                            src={`https://api.dicebear.com/7.x/${user.avatar || 'identicon'}/svg?seed=${user.username}`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-primary/50"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                            <p className="text-xs text-muted-foreground">Researcher</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-border/50">
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={() => logoutMutation.mutate()}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl relative">
                <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <Navigation />
            </aside>

            {/* Mobile Sidebar */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <Navigation />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
