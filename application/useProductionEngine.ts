
import { useState, useEffect } from 'react';
import { ProductionProject, AssetStatus, ShotStatus } from '../domain/models';
import { AIAdapter, RepositoryAdapter } from '../infrastructure/adapters';

export function useProductionEngine() {
  const [project, setProject] = useState<ProductionProject | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [logs, setLogs] = useState<{ id: number, msg: string, type: string }[]>([]);

  const addLog = (msg: string, type = 'info') => 
    setLogs(prev => [...prev.slice(-20), { id: Date.now(), msg, type }]);

  useEffect(() => {
    RepositoryAdapter.loadLatestProject().then(saved => {
      if (saved) {
        setProject(saved);
        addLog("已恢复最近的生产进度", "success");
      }
    });
  }, []);

  useEffect(() => {
    if (project) RepositoryAdapter.saveProject(project);
  }, [project]);

  const startNewProject = async (scriptText: string) => {
    setIsWorking(true);
    addLog("正在启动全剧本结构化分析...", "process");
    try {
      const blueprint = await AIAdapter.parseScriptToBluePrint(scriptText);
      
      const characters = blueprint.characters.map((c: any, i: number) => ({
        id: `c_${i}_${Date.now()}`, ...c, status: AssetStatus.DRAFT
      }));
      
      const locations = blueprint.locations.map((l: any, i: number) => ({
        id: `l_${i}_${Date.now()}`, ...l, status: AssetStatus.DRAFT,
        subAreas: (l.subAreas || []).map((s: any, j: number) => ({ id: `s_${i}_${j}`, ...s }))
      }));

      const shots = blueprint.shots.map((s: any, i: number) => ({
        ...s, id: `shot_${i}`, status: ShotStatus.PENDING,
        locationId: locations[s.locationIndex]?.id || '',
        casting: (s.involvedCharacterNames || []).map((n: string) => ({
          characterId: characters.find((ch: any) => ch.name === n)?.id || '',
          action: s.action
        }))
      }));

      setProject({
        id: `p_${Date.now()}`,
        title: blueprint.title || "链家房产推介片",
        scriptText,
        characters,
        locations,
        shots,
        lastUpdated: Date.now()
      });
      addLog("剧本解析成功，资产蓝图已生成", "success");
    } catch (e) {
      addLog("解析失败：API 调用异常", "error");
    } finally {
      setIsWorking(false);
    }
  };

  const lockAsset = async (type: 'char' | 'loc', id: string) => {
    if (!project) return;
    setIsWorking(true);
    addLog(`正在固化视觉锚点: ${id.substring(0, 8)}...`, "process");
    try {
      if (type === 'char') {
        const char = project.characters.find(c => c.id === id)!;
        const prompt = `Lianjia Agent Portrait: ${char.name}, role as ${char.role}. Traits: ${char.coreTraits.join(", ")}. Vibe: ${char.vibe}.`;
        const url = await AIAdapter.generateVisualAnchor(prompt, true);
        if (url) {
          setProject({
            ...project,
            characters: project.characters.map(c => c.id === id ? { ...c, status: AssetStatus.LOCKED, refImageUrl: url } : c)
          });
          addLog(`角色 [${char.name}] 视觉锚点已固化`, "success");
        }
      } else {
        const loc = project.locations.find(l => l.id === id)!;
        const prompt = `Lianjia Property Environment: ${loc.name}. ${loc.description}. ${loc.type} setting.`;
        const url = await AIAdapter.generateVisualAnchor(prompt, false);
        if (url) {
          setProject({
            ...project,
            locations: project.locations.map(l => l.id === id ? { ...l, status: AssetStatus.LOCKED, refImageUrl: url } : l)
          });
          addLog(`空间 [${loc.name}] 视觉锚点已固化`, "success");
        }
      }
    } finally {
      setIsWorking(false);
    }
  };

  const produceShotFrame = async (shotId: string) => {
    if (!project) return;
    const shot = project.shots.find(s => s.id === shotId)!;
    setProject({
      ...project,
      shots: project.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.GENERATING } : s)
    });

    addLog(`正在生产分镜 #${shot.order} 的视觉关键帧...`, "process");
    try {
      const loc = project.locations.find(l => l.id === shot.locationId);
      const chars = project.characters.filter(c => shot.casting.some(cast => cast.characterId === c.id));
      
      const prompt = `Video Keyframe Production. 
        ACTION: ${shot.action}. 
        LOCATION: ${loc?.name} - ${loc?.description}. 
        CHARACTERS: ${chars.map(c => `${c.name} (${c.vibe})`).join(", ")}. 
        CAMERA: ${shot.camera}. Cinematic marketing style.`;

      const imageUrl = await AIAdapter.generateVisualAnchor(prompt, false);
      if (imageUrl) {
        setProject(prev => prev ? ({
          ...prev,
          shots: prev.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.COMPLETED, imageUrl } : s)
        }) : null);
        addLog(`分镜 #${shot.order} 渲染成功`, "success");
      }
    } catch (e) {
      addLog("渲染失败：模型响应超时", "error");
      setProject(prev => prev ? ({
        ...prev,
        shots: prev.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.FAILED } : s)
      }) : null);
    }
  };

  return { project, isWorking, logs, startNewProject, lockAsset, produceShotFrame, reset: RepositoryAdapter.clear };
}
