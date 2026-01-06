
import { useState, useEffect, useCallback } from 'react';
// Fix: Use ProductionProject and RepositoryAdapter correctly
import { ProductionProject as Project, Character, LocationAsset, Shot, AssetStatus, ShotStatus } from '../domain/models';
import { AIAdapter, RepositoryAdapter as StorageAdapter } from '../infrastructure/adapters';
import { Type } from "@google/genai";

export function useStudio() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: string}[]>([]);

  const addLog = (msg: string, type = 'info') => setLogs(prev => [...prev.slice(-20), { msg, type }]);

  // 初始化加载 - Fix: loadLatestProject is now async
  useEffect(() => {
    StorageAdapter.loadLatestProject().then(p => p && setProject(p));
  }, []);

  // 自动保存 - Fix: saveProject is used instead of save
  useEffect(() => {
    if (project) StorageAdapter.saveProject(project);
  }, [project]);

  // 1. 初始化项目
  const initProject = () => {
    // Added lastUpdated to match ProductionProject interface
    setProject({ id: Date.now().toString(), title: '新企划', scriptText: '', characters: [], locations: [], shots: [], lastUpdated: Date.now() });
    addLog("工作台初始化完成");
  };

  // 2. 深度解析剧本 (Domain Action)
  const parseScript = async (text: string) => {
    if (!project) return;
    setLoading(true);
    addLog("AI 正在解析剧本结构...", "process");
    try {
      // Fix: analyzeScript -> parseScriptToBluePrint
      const data = await AIAdapter.parseScriptToBluePrint(text);
      // 这里本应有更复杂的领域转换逻辑
      setProject({ ...project, scriptText: text, ...data });
      addLog("剧本解析成功", "success");
    } catch (e) { addLog("解析失败", "error"); }
    setLoading(false);
  };

  // 3. AI 启发式资产补全
  const aiSparkleAsset = async (type: 'char' | 'loc', id: string) => {
    if (!project) return;
    setLoading(true);
    try {
      if (type === 'char') {
        const char = project.characters.find(c => c.id === id)!;
        // Fix: suggestDetails is now implemented in AIAdapter
        const res = await AIAdapter.suggestDetails(`建议角色特征: ${char.name}`, {
           type: Type.OBJECT,
           properties: { vibe: {type: Type.STRING}, coreTraits: {type: Type.ARRAY, items: {type: Type.STRING}}}
        });
        setProject({...project, characters: project.characters.map(c => c.id === id ? {...c, ...res} : c)});
      } else {
        const loc = project.locations.find(l => l.id === id)!;
        // Fix: suggestDetails is now implemented in AIAdapter
        const res = await AIAdapter.suggestDetails(`建议空间子区域: ${loc.name}`, {
           type: Type.ARRAY,
           items: { type: Type.OBJECT, properties: {name: {type: Type.STRING}, description: {type: Type.STRING}}}
        });
        setProject({...project, locations: project.locations.map(l => l.id === id ? {...l, subAreas: [...l.subAreas, ...res]} : l)});
      }
      addLog("AI 补全完成", "success");
    } finally { setLoading(false); }
  };

  // 4. 渲染关键帧
  const renderShot = async (id: string) => {
    if (!project) return;
    const shot = project.shots.find(s => s.id === id)!;
    setProject(p => p ? {...p, shots: p.shots.map(s => s.id === id ? {...s, status: ShotStatus.GENERATING} : s)} : null);
    
    try {
      const prompt = `Lianjia style shot: ${shot.action}. Camera: ${shot.camera}.`;
      // Fix: generateImage -> generateVisualAnchor, and use boolean for aspect ratio logic
      const url = await AIAdapter.generateVisualAnchor(prompt, false);
      if (url) {
        setProject(p => p ? {...p, shots: p.shots.map(s => s.id === id ? {...s, status: ShotStatus.COMPLETED, imageUrl: url} : s)} : null);
        addLog(`分镜 #${shot.order} 生产完毕`, "success");
      }
    } catch (e) {
      addLog("生产失败", "error");
    }
  };

  return { project, setProject, loading, logs, initProject, parseScript, aiSparkleAsset, renderShot, reset: StorageAdapter.clear };
}
