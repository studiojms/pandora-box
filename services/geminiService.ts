
import { GoogleGenAI, Type } from "@google/genai";
import { Idea, BusinessAnalysis, Language, IdeaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageInstruction = (lang: Language) => {
  switch(lang) {
    case 'pt': return "IMPORTANT: Provide all text fields specifically in Portuguese (pt-BR).";
    case 'es': return "IMPORTANT: Provide all text fields specifically in Spanish.";
    default: return "IMPORTANT: Provide all text fields in English.";
  }
}

export const analyzeBusinessPotential = async (idea: Idea, lang: Language): Promise<BusinessAnalysis> => {
  const langInstruction = getLanguageInstruction(lang);

  const prompt = `
    Act as "The Forge", an expert business incubation AI module for Pandora Box.
    Analyze the following ${idea.type.toLowerCase()} for startup viability.
    
    Title: ${idea.title}
    Description: ${idea.description}
    
    ${langInstruction}
    
    Provide a JSON response containing:
    1. Scores (0-100): viabilityScore, marketSizeScore, complexityScore, veracityScore (scientific plausibility).
    2. SWOT: strengths, weaknesses, opportunities, threats.
    3. Business Canvas: valueProposition, customerSegments, revenueStreams, costStructure.
    4. Competitors: Array of real-world competitors.
    5. Suggested Team: roles needed.
    6. Summary: A short encouraging summary.
    7. MermaidDiagram: A Mermaid.js flowchart syntax describing the logic or process of this idea.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viabilityScore: { type: Type.INTEGER },
            marketSizeScore: { type: Type.INTEGER },
            complexityScore: { type: Type.INTEGER },
            veracityScore: { type: Type.INTEGER },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
              }
            },
            canvas: {
                type: Type.OBJECT,
                properties: {
                    valueProposition: { type: Type.STRING },
                    customerSegments: { type: Type.STRING },
                    revenueStreams: { type: Type.STRING },
                    costStructure: { type: Type.STRING },
                }
            },
            competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTeam: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            mermaidDiagram: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text!) as BusinessAnalysis;
  } catch (error) {
    console.error("The Forge Analysis Error:", error);
    throw error;
  }
};

export const refineIdeaDraft = async (rawInput: string, type: IdeaType, lang: Language) => {
  const langInstruction = getLanguageInstruction(lang);
  const prompt = `
    Refine the following raw idea input into a professional, structured Pandora Box Node.
    Input: "${rawInput}"
    Type: ${type}
    
    ${langInstruction}
    
    Return JSON with:
    - title: Catchy but descriptive title.
    - description: Clear, well-written text explaining the concept.
    - tags: Array of 4-5 technical/business tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text!);
  } catch (error) {
    console.error("Refinement error", error);
    return null;
  }
};

export const analyzePrototypeImage = async (base64Image: string, lang: Language) => {
  const langInstruction = getLanguageInstruction(lang);
  const prompt = `
    Analyze this prototype/drawing/concept image for a new invention or problem for the Pandora Box platform.
    Explain what you see technically and suggest how to improve the design.
    ${langInstruction}
    Return JSON with: title, description, technicalInsights (array), improvementSuggestions (array).
  `;

  try {
    // Fix: Wrap multiple parts into a contents object as per SDK requirements.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            technicalInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text!);
  } catch (error) {
    console.error("Vision Analysis error", error);
    return null;
  }
};

export const findBrainstormConnections = async (idea: Idea, lang: Language): Promise<string[]> => {
  const langInstruction = getLanguageInstruction(lang);
  const prompt = `
    I have an idea on Pandora Box: "${idea.title}".
    Generate 3 proactive connections.
    If it's a PROBLEM, suggest 3 technical approaches to solve it.
    If it's a SOLUTION, suggest 3 real-world massive problems it could address.
    ${langInstruction}
    Return JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text!);
  } catch (error) {
    return ["Could not connect concepts."];
  }
};
