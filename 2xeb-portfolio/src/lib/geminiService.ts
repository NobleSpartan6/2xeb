import { GoogleGenAI, Type } from "@google/genai";
import { PROJECTS } from '../data/projects';

export interface AIResponse {
  answer: string;
  projectSlugs: string[];
}

const getSystemPrompt = () => {
  const projectContext = PROJECTS.map(p => 
    `- Title: ${p.title} (Slug: ${p.slug})
     - Discipline: ${p.primaryDiscipline}
     - Role: ${p.role || 'N/A'}
     - Tags: ${p.tags.join(', ')}
     - Description: ${p.shortDesc}
     - Details: ${p.longDesc || ''}
     - Status: ${p.status}
     - Link: ${p.isExternal ? p.externalUrl : '/work/' + p.slug}`
  ).join('\n\n');

  return `You are a helpful AI assistant for Ebenezer Eshetu's (2xeb) portfolio website. 
  Your goal is to help visitors understand Ebenezer's work in Software Engineering, ML/AI, and Video.
  
  Here is the data about the projects in the portfolio:
  ${projectContext}

  Rules:
  1. Answer concisely and enthusiastically.
  2. If a user asks about specific skills (e.g., "Does he know Python?"), reference the specific projects that use that skill.
  3. Always reference projects by their title.
  4. If the question is unrelated to the portfolio or Ebenezer's professional skills, politely steer it back to his work.
  5. Keep answers under 100 words unless asked for details.
  `;
};

export const askPortfolioAI = async (question: string): Promise<AIResponse> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return {
        answer: "Demo mode: API Key not configured. I would normally tell you about my projects like experimental AI tools or 'Portfolio Console' here!",
        projectSlugs: ['midimix', 'portfolio-console']
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: getSystemPrompt(),
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "The natural language response to the user."
            },
            projectSlugs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of project slugs referenced in the answer or relevant to the query."
            }
          },
          required: ["answer", "projectSlugs"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response");
    
    return JSON.parse(resultText) as AIResponse;

  } catch (error) {
    console.error("AI Error:", error);
    return {
      answer: "Sorry, I'm having trouble connecting to my brain (the API). Please try again later.",
      projectSlugs: []
    };
  }
};