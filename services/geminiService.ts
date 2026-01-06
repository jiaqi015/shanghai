
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Shot, Scene, AssetStatus, ShotStatus } from "../types";

// Always use a named parameter and exclusively obtain API_KEY from process.env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractCharacters = async (scriptText: string): Promise<Partial<Character>[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请从以下剧本片段中提取出所有主要角色，并输出 JSON 数组。
    每个角色包含：name (名字), roleInStory (故事角色), coreTraits (核心特质数组), taboos (禁忌/不可变特征数组)。
    
    剧本内容：
    ${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            roleInStory: { type: Type.STRING },
            coreTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
            taboos: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "roleInStory", "coreTraits", "taboos"]
        }
      }
    }
  });
  
  // Directly access the .text property from GenerateContentResponse.
  const text = response.text || "[]";
  return JSON.parse(text.trim());
};

export const breakdownShots = async (scriptText: string, characters: Character[]): Promise<{shots: any[], scenes: any[]}> => {
  const charMap = characters.map(c => `${c.name} (ID: ${c.id})`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请将以下剧本拆解为连续的镜头列表(Shot List)和场景列表(Scene List)。
    
    角色池：${charMap}
    
    输出 JSON 格式：
    {
      "scenes": [{"id": "s1", "type": "室内/室外", "description": "描述"}],
      "shots": [
        {
          "order": 1,
          "beatPurpose": "镜头功能描述",
          "camera": "全景/中景等",
          "action": "动作描述",
          "dialogue": "台词内容",
          "sceneId": "引用场景ID",
          "casting": [{"characterId": "引用角色ID", "expression": "表情", "action": "具体动作"}]
        }
      ]
    }

    剧本内容：
    ${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["id", "type", "description"]
            }
          },
          shots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                order: { type: Type.NUMBER },
                beatPurpose: { type: Type.STRING },
                camera: { type: Type.STRING },
                action: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                sceneId: { type: Type.STRING },
                casting: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterId: { type: Type.STRING },
                      expression: { type: Type.STRING },
                      action: { type: Type.STRING }
                    },
                    required: ["characterId", "expression", "action"]
                  }
                }
              },
              required: ["order", "beatPurpose", "camera", "action", "sceneId", "casting"]
            }
          }
        },
        required: ["scenes", "shots"]
      }
    }
  });

  const text = response.text || '{"scenes":[], "shots":[]}';
  return JSON.parse(text.trim());
};

export const generateCharacterLook = async (character: Character): Promise<string> => {
  const prompt = `A detailed concept character portrait for a movie production. 
    Character Name: ${character.name}. 
    Role: ${character.roleInStory}. 
    Traits: ${character.coreTraits.join(", ")}. 
    Visual Requirements: ${character.taboos.join(", ")}. 
    Cinematic style, high quality, consistent character design reference.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  // Iterate through parts to find the image part (inlineData).
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image generated");
};

export const generateShotImage = async (shot: Shot, scene: Scene, characters: Character[]): Promise<string> => {
  const characterDescriptions = shot.casting.map(cast => {
    const char = characters.find(c => c.id === cast.characterId);
    if (!char) return "";
    const lookPrompt = char.look.status === AssetStatus.LOCKED ? `Visual reference: ${char.look.seedPrompt}.` : "";
    return `Character ${char.name} is present. ${lookPrompt} Current action: ${cast.action}. Expression: ${cast.expression}.`;
  }).join(" ");

  const prompt = `Movie storyboard frame. 
    Scene: ${scene.description} (${scene.type}). 
    Shot details: ${shot.camera} view, ${shot.action}. 
    Characters: ${characterDescriptions}. 
    Beat purpose: ${shot.beatPurpose}. 
    Dialogue context: ${shot.dialogue || 'None'}. 
    Cinematic photography, master lighting, matching the established visual style.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No shot image generated");
};
