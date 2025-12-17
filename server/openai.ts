import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ReportGenerationParams {
  proteinTarget: string;
  ligandName: string;
  bindingAffinity: number;
  rmsd: number;
  ligandEfficiency?: number;
  inhibitionConstant?: number;
  interactionData?: any;
}

export async function generateDockingReport(params: ReportGenerationParams): Promise<{
  executiveSummary: string;
  fullContent: string;
  performanceMetrics: any;
}> {
  const prompt = `You are a molecular biology AI agent generating a comprehensive docking analysis report for NeuraViva Research.

SIMULATION DATA:
- Target Protein: ${params.proteinTarget}
- Ligand: ${params.ligandName}
- Binding Affinity: ${params.bindingAffinity} kcal/mol
- RMSD: ${params.rmsd} Å
- Ligand Efficiency: ${params.ligandEfficiency || "N/A"} kcal/mol/HA
- Inhibition Constant (Ki): ${params.inhibitionConstant || "N/A"} nM
${params.interactionData ? `- Interaction Data: ${JSON.stringify(params.interactionData)}` : ""}

Generate a detailed scientific report in JSON format with the following structure:
{
  "executiveSummary": "A 2-3 sentence summary of the key findings and binding efficacy. Be specific about the binding affinity, stability, and drug potential.",
  "fullContent": "A comprehensive analysis covering: (1) Binding characteristics, (2) Interaction profile analysis, (3) Drug efficacy predictions, (4) Recommendations for lead optimization. Use scientific terminology appropriate for grant proposals and research papers.",
  "performanceMetrics": {
    "bindingEnergy": number,
    "ligandEfficiency": number,
    "inhibitionConstant": number,
    "stabilityScore": number (0-100),
    "drugLikenessScore": number (0-100),
    "toxicityRisk": "low" | "medium" | "high"
  }
}

Make this sound professional, data-driven, and suitable for stakeholder presentations and research publications.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert molecular biologist and computational chemist generating professional docking simulation reports. Your reports are used in grant proposals, research papers, and stakeholder presentations."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    executiveSummary: result.executiveSummary || "Analysis completed successfully.",
    fullContent: result.fullContent || "Detailed report content.",
    performanceMetrics: result.performanceMetrics || {}
  };
}

export async function categorizeDockingData(params: {
  proteinTarget: string;
  ligandName: string;
  bindingAffinity: number;
}): Promise<{ tags: Array<{ type: string; value: string }> }> {
  const prompt = `Analyze this molecular docking simulation and generate categorization tags:
  
Protein: ${params.proteinTarget}
Ligand: ${params.ligandName}
Binding Affinity: ${params.bindingAffinity} kcal/mol

Generate tags in JSON format:
{
  "tags": [
    { "type": "protein_family", "value": "..." },
    { "type": "therapeutic_area", "value": "..." },
    { "type": "binding_strength", "value": "strong" | "moderate" | "weak" },
    { "type": "drug_class", "value": "..." }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a data categorization AI for molecular docking simulations. Generate relevant tags for organization and retrieval."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result;
}
