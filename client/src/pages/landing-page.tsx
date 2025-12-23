import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/3d_molecular_docking_simulation_visualization.png";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="border-b border-border/50 backdrop-blur-sm fixed top-0 w-full z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        NeuraViva
                    </div>
                    <div className="flex gap-4">
                        <Link href="/auth">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link href="/auth">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-16 px-6">
                <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
                            Autonomous AI for <br />
                            <span className="text-primary">Molecular Docking</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Accelerate drug discovery with our AI Agents that process simulations,
                            generate insights, and verify data on the Solana blockchain.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/auth">
                                <Button size="lg" className="h-12 px-8 text-lg">
                                    Start Researching
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                                View Documentation
                            </Button>
                        </div>

                        <div className="pt-8 grid grid-cols-2 gap-4">
                            {[
                                "AI-Powered Analysis",
                                "Solana Data Verification",
                                "Automated Reporting",
                                "Secure Team Collaboration"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary opacity-20 blur-3xl rounded-full" />
                        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                            <img
                                src={heroImage}
                                alt="Dashboard Preview"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="container mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-y border-border/50 py-12">
                    <div className="text-center">
                        <div className="text-4xl font-bold font-display text-primary mb-2">99.9%</div>
                        <div className="text-muted-foreground">Uptime Reliability</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-display text-primary mb-2">50k+</div>
                        <div className="text-muted-foreground">Simulations Processed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-display text-primary mb-2">&lt; 0.5s</div>
                        <div className="text-muted-foreground">Verification Speed</div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
                <p>© 2025 NeuraViva Research. All rights reserved.</p>
            </footer>
        </div>
    );
}
