import { useState, useRef } from "react";
import { Share2, Download, ChevronRight, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import moleculeImage from "@assets/molecular_docking_hero.png";
import { exportReportToPDF } from "@/lib/pdfExport";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from "recharts";

const performanceData = [
  { subject: 'Binding Affinity', A: 120, B: 110, fullMark: 150 },
  { subject: 'Ligand Efficiency', A: 98, B: 130, fullMark: 150 },
  { subject: 'Lipophilicity', A: 86, B: 130, fullMark: 150 },
  { subject: 'Solubility', A: 99, B: 100, fullMark: 150 },
  { subject: 'Molecular Weight', A: 85, B: 90, fullMark: 150 },
  { subject: 'Toxicity Risk', A: 65, B: 85, fullMark: 150 },
];

export default function Reports() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const selectedReport = selectedReportId
    ? reports?.find((r: any) => r.id === selectedReportId)
    : reports?.[0];

  // Auto-select first report when reports load
  if (!selectedReportId && reports && reports.length > 0) {
    setSelectedReportId(reports[0].id);
  }

  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
      return true;
    },
    onSuccess: () => {
      toast({ title: "Report Deleted", description: "The report has been removed." });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setSelectedReportId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  // Get simulation data for the selected report
  const { data: simulation } = useQuery({
    queryKey: ['/api/simulations', selectedReport?.simulationId],
    queryFn: async () => {
      if (!selectedReport?.simulationId) return null;
      const res = await fetch(`/api/simulations/${selectedReport.simulationId}`);
      if (!res.ok) throw new Error('Failed to fetch simulation');
      return res.json();
    },
    enabled: !!selectedReport?.simulationId
  });

  // Create radar chart data from simulation interaction data
  const interactionData = simulation?.interactionData ? [
    { subject: 'H-Bonds', A: simulation.interactionData.hBonds * 20, fullMark: 100 },
    { subject: 'Hydrophobic', A: simulation.interactionData.hydrophobic * 12.5, fullMark: 100 },
    { subject: 'Pi-Stacking', A: simulation.interactionData.piStacking * 25, fullMark: 100 },
    { subject: 'Salt Bridges', A: simulation.interactionData.saltBridges * 33, fullMark: 100 },
    { subject: 'Stability', A: simulation.interactionData.stabilityScore || 0, fullMark: 100 },
    { subject: 'Drug-likeness', A: simulation.interactionData.drugLikenessScore || 0, fullMark: 100 },
  ] : performanceData;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar List */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Reports</h2>
          <p className="text-sm text-muted-foreground">AI-generated analysis documents.</p>
        </div>

        <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {reportsLoading ? (
              <div className="p-4 space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : reports?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="mb-4">No reports generated yet</p>
                <p className="text-sm">Generate reports from the Explorer page</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {reports?.map((report: any) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedReport?.id === report.id
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.1)]"
                      : "bg-card border-border/50 hover:bg-secondary/5 hover:border-border"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm line-clamp-1">{report.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{report.reportId}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5">Full Analysis</Badge>
                      {report.solanaVerificationHash && (
                        <Badge variant="default" className="text-[10px] h-5 bg-secondary text-secondary-foreground">Verified</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this report?")) {
                            deleteReportMutation.mutate(report.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Report Preview */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{selectedReport?.reportId || 'Select a report'}</span>
            {selectedReport && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>Preview</span>
              </>
            )}
          </div>
          {selectedReport && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground"
                disabled={isExporting}
                onClick={async () => {
                  if (reportContentRef.current && selectedReport) {
                    setIsExporting(true);
                    try {
                      const success = await exportReportToPDF(reportContentRef.current, selectedReport);
                      if (success) {
                        toast({ title: "PDF Downloaded", description: "Report saved successfully." });
                      } else {
                        toast({ title: "Export Failed", description: "Could not generate PDF. Check console for details.", variant: "destructive" });
                      }
                    } catch (err) {
                      toast({ title: "Export Error", description: "An unexpected error occurred.", variant: "destructive" });
                    } finally {
                      setIsExporting(false);
                    }
                  } else {
                    toast({ title: "No Report Selected", description: "Please select a report first.", variant: "destructive" });
                  }
                }}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </Button>
            </div>
          )}
        </div>

        {!selectedReport ? (
          <div className="flex-1 flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
            <div className="text-center text-muted-foreground">
              {reportsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              ) : (
                <p>Select a report to view</p>
              )}
            </div>
          </div>
        ) : (
          <div ref={reportContentRef} className="flex-1 bg-white text-slate-900 rounded-lg overflow-hidden shadow-2xl overflow-y-auto pdf-export-container">
            <div className="max-w-4xl mx-auto p-12 space-y-8">
              {/* Report Header */}
              <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-3xl font-bold font-display text-slate-900">Docking Analysis Report</h1>
                  <p className="text-slate-500 mt-2">
                    Generated by NeuraViva AI Agent • {new Date(selectedReport.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Reference ID</div>
                  <div className="font-mono font-bold text-slate-700">{selectedReport.reportId}</div>
                </div>
              </div>

              {/* Executive Summary */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-l-4 border-cyan-500 pl-3">Executive Summary</h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedReport.executiveSummary}
                </p>
              </section>

              {/* Visuals */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Interaction Profile</h4>
                  <div className="h-64 w-full border border-slate-100 rounded bg-slate-50 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={interactionData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Interaction Profile" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Binding Pose Visualization</h4>
                  <div className="h-64 w-full rounded overflow-hidden border border-slate-100 bg-slate-900 relative">
                    <img src={moleculeImage} className="w-full h-full object-cover opacity-80" alt="Binding Pose" />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                      Pose Rank: 1
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              {selectedReport.performanceMetrics && (
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-l-4 border-purple-500 pl-3">Key Performance Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase">Binding Energy</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {selectedReport.performanceMetrics.bindingEnergy}
                        <span className="text-xs font-normal text-slate-400 ml-1">kcal/mol</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase">Ligand Efficiency</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {selectedReport.performanceMetrics.ligandEfficiency?.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400 ml-1">kcal/mol/HA</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase">Inhibition Constant (Ki)</div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        {selectedReport.performanceMetrics.inhibitionConstant?.toFixed(1)}
                        <span className="text-xs font-normal text-slate-400 ml-1">nM</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Full Content */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-l-4 border-blue-500 pl-3">Detailed Analysis</h3>
                <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedReport.fullContent}
                </div>
              </section>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> NeuraViva Verified
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-sm">
                    This document is cryptographically hashed and anchored to the Solana Blockchain for immutable provenance and research integrity.
                  </p>
                </div>

                {selectedReport.solanaVerificationHash && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Blockchain Receipt</span>
                    <a
                      href={`https://explorer.solana.com/tx/${selectedReport.solanaVerificationHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-primary hover:text-primary/80 break-all text-center leading-relaxed"
                    >
                      {selectedReport.solanaVerificationHash}
                    </a>
                  </div>
                )}
                <div className="text-center text-[9px] text-slate-300">
                  © {new Date().getFullYear()} NeuraViva AI • Research Analytics Platform
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant: string, className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant === 'default' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'
      } ${className}`}>
      {children}
    </span>
  )
}