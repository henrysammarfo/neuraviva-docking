import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Loader2 } from "lucide-react";
import { insertDockingSimulationSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

export function NewSimulationDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(insertDockingSimulationSchema),
        defaultValues: {
            simulationId: `NV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            proteinTarget: "",
            ligandName: "",
            bindingAffinity: -7.5, // Default realistic starting point
            rmsd: 1.5,
            status: "pending",
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await fetch("/api/simulations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit simulation");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            toast({
                title: "Simulation Submitted",
                description: "Your docking job has been sent to the agent for processing.",
            });
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Submission Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    <Zap className="w-4 h-4 mr-2" />
                    New Simulation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display font-bold">Submit New Docking Job</DialogTitle>
                    <DialogDescription>
                        Enter the molecular parameters for the AI agent to analyze.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="proteinTarget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Protein</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. EGFR, Mpro, JAK2" {...field} className="bg-background/50" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ligandName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ligand Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Gefitinib, Paxlovid" {...field} className="bg-background/50" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bindingAffinity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expected Affinity (kcal/mol)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rmsd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RMSD (Å)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-background/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Launch Agent Analysis
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
