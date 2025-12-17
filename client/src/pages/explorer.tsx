import { useState } from "react";
import { Search, Filter, Download, ExternalLink, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const initialData = [
  { id: "NV-2024-001", protein: "EGFR-TK", ligand: "Gefitinib", affinity: -9.8, rmsd: 1.2, status: "Analyzed", date: "2024-12-10" },
  { id: "NV-2024-002", protein: "SARS-CoV-2 Mpro", ligand: "PF-07321332", affinity: -8.4, rmsd: 1.5, status: "Pending", date: "2024-12-11" },
  { id: "NV-2024-003", protein: "HSP90", ligand: "Geldanamycin", affinity: -7.2, rmsd: 2.1, status: "Failed", date: "2024-12-12" },
  { id: "NV-2024-004", protein: "BRD4", ligand: "JQ1", affinity: -9.1, rmsd: 0.8, status: "Analyzed", date: "2024-12-13" },
  { id: "NV-2024-005", protein: "JAK2", ligand: "Ruxolitinib", affinity: -8.9, rmsd: 1.1, status: "Analyzed", date: "2024-12-13" },
  { id: "NV-2024-006", protein: "Bcl-2", ligand: "Venetoclax", affinity: -10.2, rmsd: 1.3, status: "Processing", date: "2024-12-14" },
  { id: "NV-2024-007", protein: "CDK4/6", ligand: "Palbociclib", affinity: -8.5, rmsd: 1.4, status: "Analyzed", date: "2024-12-14" },
];

export default function Explorer() {
  const [data] = useState(initialData);

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
            <Input placeholder="Search by ID, Protein, or Ligand..." className="pl-9 bg-background/50" />
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
                    <DropdownMenuCheckboxItem checked>Analyzed</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Processing</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Failed</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background/50">
                        Affinity Range
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Binding Energy</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>{"< -9.0 kcal/mol"}</DropdownMenuItem>
                    <DropdownMenuItem>{"-7.0 to -9.0 kcal/mol"}</DropdownMenuItem>
                    <DropdownMenuItem>{"> -7.0 kcal/mol"}</DropdownMenuItem>
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
            {data.map((row) => (
              <TableRow key={row.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                <TableCell>
                  <Checkbox className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                </TableCell>
                <TableCell className="font-mono text-xs font-medium text-primary/80">{row.id}</TableCell>
                <TableCell className="font-medium">{row.protein}</TableCell>
                <TableCell>{row.ligand}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={`font-mono ${row.affinity < -9 ? "border-green-500/50 text-green-500 bg-green-500/10" : "border-border text-foreground"}`}>
                        {row.affinity} kcal/mol
                    </Badge>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{row.rmsd}</TableCell>
                <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Analyzed' ? 'bg-primary/10 text-primary' :
                        row.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-500' :
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
                            <DropdownMenuItem>Generate Report</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">Delete Data</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing 7 of 148 results</div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}