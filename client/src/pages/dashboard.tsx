import { motion } from "framer-motion";
import { ArrowRight, Dna, Activity, Zap, FileJson, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import moleculeImage from "@assets/molecular_docking_hero.png";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NewSimulationDialog } from "@/components/layout/NewSimulationDialog";
import { useMemo } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time feel
  });

  const { data: simulations, isLoading: simsLoading } = useQuery({
    queryKey: ['/api/simulations'],
    queryFn: async () => {
      const res = await fetch('/api/simulations');
      if (!res.ok) throw new Error('Failed to fetch simulations');
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: agentInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/agent/insights'],
    queryFn: async () => {
      const res = await fetch('/api/agent/insights');
      if (!res.ok) throw new Error('Failed to fetch agent insights');
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const recentSimulations = simulations?.slice(0, 5) || [];
  const latestAnalyzed = simulations?.find((s: any) => s.status === 'analyzed' && s.interactionData);

  // Calculate dynamic trends based on simulation data
  const trends = useMemo(() => {
    if (!simulations || simulations.length === 0) {
      return { active: "--", success: "--", compute: "Online", total: "0" };
    }
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCount = simulations.filter((s: any) => new Date(s.createdAt) > oneHourAgo).length;
    const analyzedCount = simulations.filter((s: any) => s.status === 'analyzed').length;
    const successPct = simulations.length > 0 ? Math.round((analyzedCount / simulations.length) * 100) : 0;

    return {
      active: recentCount > 0 ? `+${recentCount} new` : "Idle",
      success: `${successPct}%`,
      compute: stats?.computeNodes > 120 ? "High Load" : "Normal",
      total: `+${recentCount} today`
    };
  }, [simulations, stats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Agent Dashboard</h2>
          <p className="text-muted-foreground">Real-time overview of molecular docking simulations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border/50"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(simulations, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "docking_data_export.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
              toast({ title: "Export Started", description: "Your data is being exported as JSON." });
            }}
          >
            Export Data
          </Button>
          <NewSimulationDialog />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {
          statsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: "Active Simulations", value: stats?.activeSimulations || 0, icon: Activity, trend: trends.active, color: "text-primary" },
              { label: "Binding Success Rate", value: stats?.successRate || "0%", icon: CheckCircle2, trend: trends.success, color: "text-green-400" },
              { label: "Compute Nodes", value: stats?.computeNodes || 0, icon: Cpu, trend: trends.compute, color: "text-purple-400" },
              { label: "Total Simulations", value: stats?.totalSimulations || 0, icon: FileJson, trend: trends.total, color: "text-orange-400" },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-2xl font-bold font-display">{metric.value}</div>
                      <span className="text-xs text-muted-foreground bg-secondary/10 px-1.5 py-0.5 rounded">{metric.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )
        }
      </div >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Binding Affinity Trends</CardTitle>
            <CardDescription>Real-time analysis of docking scores across active clusters.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulations ? [...simulations].reverse().map(s => ({
                  name: s.ligandName.substring(0, 10),
                  value: s.bindingAffinity
                })) : []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} kcal`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interaction Profile Radar Chart (Replacing Image) */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Interaction Profile</CardTitle>
            <CardDescription>
              {simulations?.[0] ? `${simulations[0].proteinTarget} - ${simulations[0].ligandName}` : "No Active Simulation"}
            </CardDescription>
          </CardHeader>
          <div className="flex-1 min-h-[250px] w-full relative">
            {latestAnalyzed?.interactionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: 'H-Bonds', A: latestAnalyzed.interactionData.hBonds || 0, fullMark: 10 },
                  { subject: 'Hydrophobic', A: latestAnalyzed.interactionData.hydrophobic || 0, fullMark: 10 },
                  { subject: 'Pi-Stacking', A: latestAnalyzed.interactionData.piStacking || 0, fullMark: 10 },
                  { subject: 'Salt Bridges', A: latestAnalyzed.interactionData.saltBridges || 0, fullMark: 10 },
                  { subject: 'Stability', A: (latestAnalyzed.interactionData.stabilityScore || 0) / 10, fullMark: 10 },
                  { subject: 'Drug-Likeness', A: (latestAnalyzed.interactionData.drugLikenessScore || 0) / 10, fullMark: 10 },
                ]}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Interaction" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Waiting for analysis data...</p>
              </div>
            )}

            {/* Overlay Agent Status */}
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 animate-pulse">
                <Activity className="w-3 h-3" /> AGENT ACTIVE
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Simulations Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Recent Simulations</CardTitle>
            <CardDescription>Latest docking jobs submitted to the Solana grid.</CardDescription>
          </div>
          <Button variant="ghost" className="text-xs" onClick={() => window.location.href = '/explorer'}>View All <ArrowRight className="w-3 h-3 ml-1" /></Button>
        </CardHeader>
        <CardContent>
          {simsLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentSimulations.map((sim: any) => (
                <div key={sim.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/5 border border-border/50 hover:border-primary/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${sim.status === 'analyzed' ? 'bg-green-500/10 text-green-500' : sim.status === 'processing' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Dna className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground flex items-center gap-2">
                        {sim.proteinTarget}
                        <span className="text-xs text-muted-foreground font-normal">with {sim.ligandName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{sim.simulationId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-foreground">{sim.bindingAffinity} kcal/mol</div>
                      <div className="text-xs text-muted-foreground capitalize">{sim.status}</div>
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Insights */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            AI Agent Insights
          </CardTitle>
          <CardDescription>Automated analysis and recommendations from NeuraViva AI Agent.</CardDescription>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : agentInsights ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold text-primary">{agentInsights.successRate}</div>
                </div>
                <div className="p-4 bg-secondary/5 rounded-lg border border-border/50">
                  <div className="text-sm text-muted-foreground">Protein Targets</div>
                  <div className="text-2xl font-bold text-foreground">{agentInsights.proteinTargets?.length || 0}</div>
                </div>
                <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                  <div className="text-sm text-muted-foreground">Therapeutic Areas</div>
                  <div className="text-2xl font-bold text-purple-400">{agentInsights.therapeuticAreas?.length || 0}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Key Recommendations</h4>
                <div className="space-y-2">
                  {agentInsights.recommendations?.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-border/50">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Agent insights will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}

function Cpu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  )
}