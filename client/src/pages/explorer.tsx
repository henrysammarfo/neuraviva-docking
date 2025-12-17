import { useState } from "react";
import { Search, Filter, Download, ChevronDown, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Explorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: simulations, isLoading } = useQuery({
    queryKey: ['/api/simulations', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/simulations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch simulations');
      return res.json();
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (simulationId: number) => {
      const res = await fetch(`/api/simulations/${simulationId}/generate-report`, {
        method: 'POST'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate report');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "AI analysis report has been successfully generated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Docking Results</h2>
            <p className="text-muted-foreground">Comprehensive database of all molecular simulations.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                New Query
            </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, Protein, or Ligand..." 
              className="pl-9 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background/50">
                        <Filter className="w-4 h-4" />
                        Status
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter === undefined}
                      onCheckedChange={() => setStatusFilter(undefined)}
                    >
                      All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter === 'analyzed'}
                      onCheckedChange={() => setStatusFilter('analyzed')}
                    >
                      Analyzed
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter === 'processing'}
                      onCheckedChange={() => setStatusFilter('processing')}
                    >
                      Processing
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem 
                      checked={statusFilter === 'failed'}
                      onCheckedChange={() => setStatusFilter('failed')}
                    >
                      Failed
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[50px]">
                <Checkbox className="border-muted-foreground/50" />
              </TableHead>
              <TableHead className="font-medium text-muted-foreground">Simulation ID</TableHead>
              <TableHead className="font-medium text-muted-foreground">Target Protein</TableHead>
              <TableHead className="font-medium text-muted-foreground">Ligand</TableHead>
              <TableHead className="font-medium text-muted-foreground">Binding Affinity</TableHead>
              <TableHead className="font-medium text-muted-foreground">RMSD (Å)</TableHead>
              <TableHead className="font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="font-medium text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : simulations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No simulations found
                </TableCell>
              </TableRow>
            ) : (
              simulations?.map((row: any) => (
                <TableRow key={row.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                  <TableCell>
                    <Checkbox className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-primary/80">{row.simulationId}</TableCell>
                  <TableCell className="font-medium">{row.proteinTarget}</TableCell>
                  <TableCell>{row.ligandName}</TableCell>
                  <TableCell>
                      <Badge variant="outline" className={`font-mono ${row.bindingAffinity < -9 ? "border-green-500/50 text-green-500 bg-green-500/10" : "border-border text-foreground"}`}>
                          {row.bindingAffinity} kcal/mol
                      </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{row.rmsd}</TableCell>
                  <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'analyzed' ? 'bg-primary/10 text-primary' :
                          row.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                      }`}>
                          {row.status}
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="w-4 h-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => generateReportMutation.mutate(row.id)}
                                disabled={generateReportMutation.isPending}
                              >
                                {generateReportMutation.isPending ? (
                                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Generating...</>
                                ) : (
                                  'Generate AI Report'
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500">Delete Data</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing {simulations?.length || 0} results</div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
}