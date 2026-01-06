
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionProject, Character, LocationAsset, Shot } from "../domain/models";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AIAdapter = {
  // Parse project script into a production blueprint with structured data
  async parseScriptToBluePrint(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一名链家市场部高级导演。请将以下剧本拆解为标准的视频生产资产清单。
      重点识别：经纪人角色、门店/室内空间、关键服务动作。
      剧本内容：${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  vibe: { type: Type.STRING, description: "视觉风格，如：专业、热情、稳重" },
                  coreTraits: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            locations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  subAreas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { name: { type: Type.STRING }, description: { type: Type.STRING } }
                    }
                  }
                }
              }
            },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.NUMBER },
                  camera: { type: Type.STRING },
                  action: { type: Type.STRING },
                  dialogue: { type: Type.STRING },
                  marketingPoint: { type: Type.STRING },
                  locationIndex: { type: Type.NUMBER },
                  involvedCharacterNames: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  },

  // Suggest details or completion for specific assets based on a schema
  async suggestDetails(prompt: string, schema: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(response.text.trim());
  },

  // Generate a base64 visual anchor image for characters or locations
  async generateVisualAnchor(prompt: string, isCharacter: boolean = false) {
    // 强制注入链家品牌视觉规则
    const enhancedPrompt = isCharacter 
      ? `Professional Lianjia Real Estate Agent portrait. ${prompt}. Wearing official green-themed business suit, friendly smile, clean indoor office background, 8k resolution.`
      : `High-end real estate environment. ${prompt}. Modern interior design, bright lighting, architectural photography style, 16:9 aspect ratio.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: enhancedPrompt }] },
      config: {
        imageConfig: { aspectRatio: isCharacter ? "3:4" : "16:9" }
      }
    });
    // Iterate parts to find the image data
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  }
};

export const RepositoryAdapter = {
  async saveProject(project: ProductionProject) {
    localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
    localStorage.setItem('latest_project_id', project.id);
  },
  async loadLatestProject(): Promise<ProductionProject | null> {
    const id = localStorage.getItem('latest_project_id');
    if (!id) return null;
    const data = localStorage.getItem(`project_${id}`);
    return data ? JSON.parse(data) : null;
  },
  clear() {
    localStorage.clear();
  }
};
