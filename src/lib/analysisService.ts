import { genAI } from './gemini';

export interface AnalysisResult {
  feedback: string;
  score: number;
  accuracy: number;
  concepts: string[];
  mistakes: string[];
  mistakeCategories?: {
    conceptual: number;
    calculation: number;
    careless: number;
    timeManagement: number;
  };
  cognitiveInsights?: {
    calculationAbility: number; // 0-100 for this specific work
    thinkingAbility: number;
    conceptualStrength: number;
    reasoningAbility: number;
  };
  suggestedFlashcards?: Array<{
    front: string;
    back: string;
    category: string;
  }>;
}

export interface MacroReport {
  eri: number; // Examination Readiness Index
  heatMap: { [topic: string]: 'weak' | 'average' | 'strong' };
  recommendations: string[];
  decayAlerts: string[];
  intelligenceProfile?: {
    calculationAbility: number;
    thinkingAbility: number;
    conceptualStrength: number;
    reasoningAbility: number;
    speedAccuracyBalance: number;
    learningPersistence: number;
    cognitiveStyle: string;
  };
}

export async function analyzeStudentWork(images: string[], originalProblem?: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following student solution images for the given problem: "${originalProblem || 'General DPP/Exercise Assignment'}".
    Your task is to:
    1. Grader: Provide a score (0-100) and an accuracy percentage.
    2. Micro Analysis: Identify specific mistakes at each step. Categorize them into: conceptual, calculation, careless, or timeManagement.
    3. Cognitive Insights: Rate the student's calculation speed, depth of thinking, conceptual clarity, and logical reasoning based *only* on this work (0-100).
    4. Concept Feedback: Identify which sub-concepts were used correctly and which need work.
    
    Return a JSON object in this format:
    {
      "feedback": "A summary of the solution and tips for improvement in Hinglish.",
      "score": number,
      "accuracy": number,
      "concepts": ["concept1", "concept2"],
      "mistakes": ["specific mistake 1", "specific mistake 2"],
      "mistakeCategories": {
        "conceptual": number,
        "calculation": number,
        "careless": number,
        "timeManagement": number
      },
      "cognitiveInsights": {
        "calculationAbility": number,
        "thinkingAbility": number,
        "conceptualStrength": number,
        "reasoningAbility": number
      },
      "suggestedFlashcards": [
        {
          "front": "string",
          "back": "string",
          "category": "conceptual" | "fact" | "formula" | "mistake"
        }
      ]
    }
  `;

  // Filter out empty or invalid data URLs
  const parts = images.map(img => {
    const data = img.includes(',') ? img.split(',')[1] : img;
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data
      }
    };
  });

  const result = await (genAI as any).models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }, ...parts] }],
    config: { responseMimeType: "application/json" }
  });

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 
               result.choices?.[0]?.message?.content?.parts?.[0]?.text ||
               (typeof result.text === 'function' ? result.text() : '');

  if (!text) throw new Error("No response from AI Grader");
  return JSON.parse(text) as AnalysisResult;
}

export async function generateMacroAnalysis(pastSubmissions: any[], testResults: any[]): Promise<MacroReport> {
  const prompt = `
    Based on the following student performance data, generate a Macro Analysis Report:
    - Submissions: ${JSON.stringify(pastSubmissions)}
    - Test Results: ${JSON.stringify(testResults)}
    
    Your task is:
    1. Calculate ERI (Examination Readiness Index) from 0-100.
    2. Create a HeatMap (weak, average, strong) for each topic.
    3. Track Memory Decay: Highlight topics not touched in 15+ days.
    4. Intelligence Profiling: Derive the student's deep cognitive metrics:
       - calculationAbility: Precision in math steps.
       - thinkingAbility: Ability to tackle non-standard/HARD problems.
       - conceptualStrength: Accuracy in fundamental theory application.
       - reasoningAbility: Logical flow from hypothesis to conclusion.
       - speedAccuracyBalance: Does the student rush and fail (Too Fast), or take too long (Too Slow)?
       - learningPersistence: Based on improvement trends in weak topics.
       - cognitiveStyle: One of 'Intuitive', 'Analytical', 'Visual', 'Procedural'.
    5. Provide specific study recommendations.
    
    Return a JSON object in this format:
    {
      "eri": number,
      "heatMap": { "Topic Name": "weak" | "average" | "strong" },
      "recommendations": ["string"],
      "decayAlerts": ["Topic Name - Revision Due"],
      "intelligenceProfile": {
        "calculationAbility": number,
        "thinkingAbility": number,
        "conceptualStrength": number,
        "reasoningAbility": number,
        "speedAccuracyBalance": number,
        "learningPersistence": number,
        "cognitiveStyle": "string"
      }
    }
  `;

  const result = await (genAI as any).models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 
               result.choices?.[0]?.message?.content?.parts?.[0]?.text ||
               (typeof result.text === 'function' ? result.text() : '');

  if (!text) throw new Error("No response from Macro AI");
  return JSON.parse(text) as MacroReport;
}
