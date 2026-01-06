
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionProject, Character, LocationAsset, Shot } from "../domain/models";

/**
 * 核心韧性逻辑：指数退避重试
 * 针对 429 (Rate Limit) 和 500 (Server Error) 进行自动重试
 */
const withResilience = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || (error?.status >= 500 && error?.status < 600);
    if (retries > 0 && isRetryable) {
      console.warn(`[Resilience] 触发重试逻辑，剩余次数: ${retries}, 延迟: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withResilience(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * 视觉模型优化：图片预处理
 * 将图片等比例缩放到 1536px（视觉识别甜点区），控制 Payload 大小
 */
const getOptimizedImageBase64 = async (base64WithPrefix: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIZE = 1536;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // 使用高质量 JPEG 压缩以平衡体积和细节
      const compressed = canvas.toDataURL('image/jpeg', 0.9);
      resolve(compressed.split(',')[1]);
    };
    img.src = base64WithPrefix;
  });
};

/**
 * 延迟初始化实例：确保每次调用都获取最新的 process.env.API_KEY
 */
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AIAdapter = {
  // 解析剧本蓝图：强结构化输出
  async parseScriptToBluePrint(text: string) {
    return withResilience(async () => {
      const ai = getAIClient();
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
    });
  },

  // 辅助资产细节补全
  async suggestDetails(prompt: string, schema: any) {
    return withResilience(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      return JSON.parse(response.text.trim());
    });
  },

  // 生产视觉锚点：内置链家品牌视觉规则
  async generateVisualAnchor(prompt: string, isCharacter: boolean = false) {
    return withResilience(async () => {
      const ai = getAIClient();
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
      
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
  },

  /**
   * 图片理解与二次编辑：集成优化压缩逻辑
   */
  async editImageWithContext(base64Image: string, instruction: string) {
    return withResilience(async () => {
      const ai = getAIClient();
      const optimizedData = await getOptimizedImageBase64(base64Image);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: optimizedData, mimeType: 'image/jpeg' } },
            { text: instruction }
          ]
        }
      });
      
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
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
