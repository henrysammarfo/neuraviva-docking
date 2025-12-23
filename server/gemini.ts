import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy-load Gemini client to avoid initialization errors when API key is not set
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured. Please set the GEMINI_API_KEY secret.");
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

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
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON response from Gemini");
  }

  const parsedResult = JSON.parse(jsonMatch[0]);

  return {
    executiveSummary: parsedResult.executiveSummary || "Analysis completed successfully.",
    fullContent: parsedResult.fullContent || "Detailed report content.",
    performanceMetrics: parsedResult.performanceMetrics || {}
  };
}

export async function categorizeDockingData(params: {
  proteinTarget: string;
  ligandName: string;
  bindingAffinity: number;
}): Promise<{ tags: Array<{ type: string; value: string }> }> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
}

Based on the binding affinity:
- Strong: < -9.0 kcal/mol
- Moderate: -9.0 to -7.0 kcal/mol
- Weak: > -7.0 kcal/mol`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse JSON response from Gemini");
  }

  const parsedResult = JSON.parse(jsonMatch[0]);
  return parsedResult;
}
