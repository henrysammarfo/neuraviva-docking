import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import heroImage from "@assets/generated_images/3d_molecular_docking_simulation_visualization.png";

export default function AuthPage() {
    const { user, loginMutation, registerMutation } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (user) {
            setLocation("/dashboard");
        }
    }, [user, setLocation]);

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-background">
                <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            NeuraViva
                        </CardTitle>
                        <CardDescription>
                            AI-Powered Molecular Docking Agent
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="login">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">Register</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <AuthForm
                                    mode="login"
                                    onSubmit={(data) => loginMutation.mutate(data)}
                                    isPending={loginMutation.isPending}
                                />
                            </TabsContent>

                            <TabsContent value="register">
                                <AuthForm
                                    mode="register"
                                    onSubmit={(data) => registerMutation.mutate(data)}
                                    isPending={registerMutation.isPending}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <div className="hidden lg:flex flex-col bg-muted text-white p-10 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-zinc-900 border-l border-zinc-800" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 max-w-lg text-center space-y-8">
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                            src={heroImage}
                            alt="Molecular Simulation"
                            className="w-full h-auto object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold font-display">Secure & Traceable Research</h2>
                        <p className="text-zinc-400">
                            Leverage autonomous AI agents to analyze docking simulations with Solana blockchain verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuthForm({ mode, onSubmit, isPending }: {
    mode: "login" | "register",
    onSubmit: (data: InsertUser) => void,
    isPending: boolean
}) {
    const form = useForm<InsertUser>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="dr_research" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
            </form>
        </Form>
    );
}
