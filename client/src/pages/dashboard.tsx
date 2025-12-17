import { motion } from "framer-motion";
import { ArrowRight, Dna, Activity, Zap, FileJson, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import moleculeImage from "@assets/generated_images/3d_molecular_docking_simulation_visualization.png";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', value: 2400 },
  { name: '04:00', value: 1398 },
  { name: '08:00', value: 9800 },
  { name: '12:00', value: 3908 },
  { name: '16:00', value: 4800 },
  { name: '20:00', value: 3800 },
  { name: '24:00', value: 4300 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Agent Dashboard</h2>
          <p className="text-muted-foreground">Real-time overview of molecular docking simulations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border/50">Export Data</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            <Zap className="w-4 h-4 mr-2" />
            New Simulation
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Simulations", value: "12", icon: Activity, trend: "+2.5%", color: "text-primary" },
          { label: "Binding Success Rate", value: "87.4%", icon: CheckCircle2, trend: "+5.1%", color: "text-green-400" },
          { label: "Compute Nodes", value: "148", icon: Cpu, trend: "Stable", color: "text-purple-400" },
          { label: "Pending Reports", value: "3", icon: FileJson, trend: "-1", color: "text-orange-400" },
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Binding Affinity Trends</CardTitle>
            <CardDescription>Real-time analysis of docking scores across active clusters.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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

        {/* Recent Activity / Visual */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Live Docking View</CardTitle>
                <CardDescription>Target: EGFR-TK | Ligand: Gefitinib</CardDescription>
            </CardHeader>
            <div className="flex-1 relative min-h-[200px] m-6 mt-0 rounded-lg overflow-hidden border border-border/50 group cursor-pointer">
                <img 
                    src={moleculeImage} 
                    alt="Docking Simulation" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">Processing...</span>
                        <span className="text-xs text-muted-foreground">Step 452/1000</span>
                    </div>
                    <div className="h-1 w-full bg-secondary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[45%] animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
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
            <Button variant="ghost" className="text-xs">View All <ArrowRight className="w-3 h-3 ml-1" /></Button>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {[
                    { id: "SIM-8821", target: "SARS-CoV-2 Mpro", ligand: "N3 Inhibitor", status: "Completed", score: "-9.4 kcal/mol", time: "2m ago" },
                    { id: "SIM-8822", target: "HIV-1 Protease", ligand: "Saquinavir", status: "Processing", score: "Calculating...", time: "15m ago" },
                    { id: "SIM-8823", target: "HSP90", ligand: "Geldanamycin", status: "Queued", score: "Pending", time: "1h ago" },
                ].map((sim) => (
                    <div key={sim.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/5 border border-border/50 hover:border-primary/30 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${sim.status === 'Completed' ? 'bg-green-500/10 text-green-500' : sim.status === 'Processing' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Dna className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-foreground flex items-center gap-2">
                                    {sim.target} 
                                    <span className="text-xs text-muted-foreground font-normal">with {sim.ligand}</span>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{sim.id}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold font-mono text-foreground">{sim.score}</div>
                                <div className="text-xs text-muted-foreground">{sim.status}</div>
                            </div>
                            <div className="text-xs text-muted-foreground w-16 text-right">{sim.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
// Helper component for icon
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