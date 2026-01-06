
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Film, 
  Plus, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Send, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Database,
  Image as ImageIcon,
  Layout
} from 'lucide-react';
import { 
  Character, 
  Shot, 
  Project, 
  AssetStatus, 
  ShotStatus, 
  Scene 
} from './types';
import * as gemini from './services/geminiService';

const MOCK_SCRIPT = `（场景：豪华别墅 室内 日）
业主李先生焦急地在客厅踱步。
经纪人小王推门而入，手里拿着一份秘密报价单。
小王：（低声）“有人在暗中竞价，我们要快。”
李先生皱起眉头，看着窗外的草坪。`;

const App: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'casting' | 'production'>('script');
  const [scriptInput, setScriptInput] = useState(MOCK_SCRIPT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence (Simulated)
  useEffect(() => {
    const saved = localStorage.getItem('current_project');
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load project", e);
      }
    }
  }, []);

  useEffect(() => {
    if (project) {
      localStorage.setItem('current_project', JSON.stringify(project));
    }
  }, [project]);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: '未命名项目',
      scriptText: '',
      characters: [],
      shots: [],
      scenes: []
    };
    setProject(newProject);
    setActiveTab('script');
  };

  const handleAnalyzeScript = async () => {
    if (!project) return;
    setIsProcessing(true);
    setError(null);
    try {
      const charData = await gemini.extractCharacters(scriptInput);
      const characters: Character[] = charData.map((c, idx) => ({
        id: `char_${Date.now()}_${idx}`,
        name: c.name || 'Unknown',
        roleInStory: c.roleInStory || '',
        coreTraits: c.coreTraits || [],
        taboos: c.taboos || [],
        look: {
          status: AssetStatus.DRAFT,
          seedPrompt: '',
          consistencyTags: []
        }
      }));

      const { shots, scenes } = await gemini.breakdownShots(scriptInput, characters);
      
      const domainShots: Shot[] = shots.map((s: any, idx: number) => ({
        ...s,
        id: `shot_${Date.now()}_${idx}`,
        status: ShotStatus.PENDING
      }));

      setProject({
        ...project,
        scriptText: scriptInput,
        characters,
        shots: domainShots,
        scenes: scenes as Scene[]
      });
      setActiveTab('casting');
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLockCharacter = async (charId: string) => {
    if (!project) return;
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

    setIsProcessing(true);
    try {
      const imageUrl = await gemini.generateCharacterLook(char);
      const updatedChars = project.characters.map(c => 
        c.id === charId 
          ? { 
              ...c, 
              look: { 
                ...c.look, 
                status: AssetStatus.LOCKED, 
                refImageUrl: imageUrl,
                seedPrompt: `Consistent visual identity for ${c.name}: ${c.coreTraits.join(", ")}, strictly following: ${c.taboos.join(", ")}`
              } 
            } 
          : c
      );
      setProject({ ...project, characters: updatedChars });
    } catch (err: any) {
      setError(`锁定形象失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateShot = async (shotId: string) => {
    if (!project) return;
    const shot = project.shots.find(s => s.id === shotId);
    if (!shot) return;

    // 检查角色是否锁定
    const allLocked = shot.casting.every(cast => {
      const char = project.characters.find(c => c.id === cast.characterId);
      return char?.look.status === AssetStatus.LOCKED;
    });

    if (!allLocked && !confirm("部分角色尚未锁定视觉身份，生成结果可能不一致。是否继续？")) return;

    // 更新状态为生成中
    setProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        shots: prev.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.GENERATING } : s)
      };
    });

    try {
      const scene = project.scenes.find(sc => sc.id === shot.sceneId) || { id: 'unknown', type: '室内', description: '未知场景' };
      const imageUrl = await gemini.generateShotImage(shot, scene, project.characters);
      
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shots: prev.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.COMPLETED, imageUrl } : s)
        };
      });
    } catch (err: any) {
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shots: prev.shots.map(s => s.id === shotId ? { ...s, status: ShotStatus.FAILED } : s)
        };
      });
      setError(`镜头生成失败: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Film className="w-6 h-6 text-indigo-400" />
          <h1 className="font-bold text-lg">剧本一致性系统</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={handleCreateProject}
            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </button>
          
          <div className="pt-6">
            <p className="text-xs uppercase text-slate-500 font-bold mb-3 px-4">项目列表</p>
            {project && (
              <button className="w-full text-left px-4 py-3 bg-slate-800 rounded-xl border-l-4 border-indigo-500 flex items-center justify-between group">
                <span className="truncate">{project.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 bg-slate-800/50">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Database className="w-4 h-4" />
            <span>存储: LocalStorage</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {!project ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              {/* Fix: Changed localized string 'फिल्म' to imported component 'Film' */}
              <Film className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">欢迎使用一致性创作系统</h2>
            <p className="text-slate-500 max-w-md mb-8">
              锁定角色身份，确保跨镜头视觉统一。支持 Gemini 驱动的精准提取与高质量出图。
            </p>
            <button 
              onClick={handleCreateProject}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-semibold"
            >
              点击此处开始第一个项目
            </button>
          </div>
        ) : (
          <>
            {/* Header Tabs */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <TabButton 
                  active={activeTab === 'script'} 
                  onClick={() => setActiveTab('script')}
                  icon={<Send className="w-4 h-4" />}
                  label="1. 剧本输入"
                />
                <TabButton 
                  active={activeTab === 'casting'} 
                  onClick={() => setActiveTab('casting')}
                  icon={<Users className="w-4 h-4" />}
                  label="2. 选角锁定"
                />
                <TabButton 
                  active={activeTab === 'production'} 
                  onClick={() => setActiveTab('production')}
                  icon={<Layout className="w-4 h-4" />}
                  label="3. 镜头生产"
                />
              </div>
              
              <div className="flex items-center gap-4">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI 处理中...</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Viewport */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'script' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                      导入创作剧本 (Markdown 或 文本)
                    </label>
                    <textarea 
                      value={scriptInput}
                      onChange={(e) => setScriptInput(e.target.value)}
                      placeholder="输入一段剧本文字，AI 将自动分析角色与镜头..."
                      className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={handleAnalyzeScript}
                        disabled={isProcessing || !scriptInput.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all font-bold shadow-md shadow-indigo-100"
                      >
                        <Play className="w-4 h-4" />
                        分析角色与镜头链
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FeatureCard 
                      icon={<Users className="w-6 h-6 text-blue-500" />}
                      title="角色管线"
                      desc="自动识别剧中人物，提取特质，生成定妆照并锁定视觉锚点。"
                    />
                    <FeatureCard 
                      icon={<Layout className="w-6 h-6 text-emerald-500" />}
                      title="镜头管线"
                      desc="剧本拆解为结构化镜头，自动关联角色状态与场景环境。"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'casting' && (
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">角色大厅 (Casting Board)</h2>
                      <p className="text-slate-500">点击“锁定形象”为角色生成视觉统一锚点</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {project.characters.map(char => (
                      <CharacterCard 
                        key={char.id} 
                        character={char} 
                        onLock={() => handleLockCharacter(char.id)}
                        loading={isProcessing}
                      />
                    ))}
                    {project.characters.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">暂未识别到角色，请先分析剧本</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'production' && (
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">分镜生产 (Production List)</h2>
                      <p className="text-slate-500">根据锁定的角色锚点生产各镜头画面</p>
                    </div>
                  </div>

                  <div className="space-y-6 pb-20">
                    {project.shots.map(shot => (
                      <ShotItem 
                        key={shot.id} 
                        shot={shot} 
                        scene={project.scenes.find(s => s.id === shot.sceneId)!}
                        characters={project.characters}
                        onGenerate={() => handleGenerateShot(shot.id)}
                      />
                    ))}
                    {project.shots.length === 0 && (
                      <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">暂未识别到分镜，请先分析剧本</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-semibold ${
      active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="mb-4">{icon}</div>
    <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const CharacterCard: React.FC<{ character: Character, onLock: () => void, loading: boolean }> = ({ character, onLock, loading }) => {
  const isLocked = character.look.status === AssetStatus.LOCKED;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-200 transition-all">
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {character.look.refImageUrl ? (
          <img src={character.look.refImageUrl} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Users className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">定妆照未生成</p>
          </div>
        )}
        <div className="absolute top-4 right-4">
          {isLocked ? (
            <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur text-slate-400 p-2 rounded-full shadow-lg">
              <Unlock className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">{character.name}</h3>
          <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold">{character.roleInStory}</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-2">特质锚点</span>
            <div className="flex flex-wrap gap-2">
              {character.coreTraits.map((t, i) => (
                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{t}</span>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-2">不可变禁忌</span>
            <div className="flex flex-wrap gap-2">
              {character.taboos.map((t, i) => (
                <span key={i} className="px-2 py-1 bg-red-50 text-red-500 text-xs rounded-md">不可变: {t}</span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={onLock}
          disabled={loading || isLocked}
          className={`mt-6 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
            isLocked 
              ? 'bg-slate-100 text-slate-400 cursor-default' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
          }`}
        >
          {isLocked ? (
            <><CheckCircle2 className="w-4 h-4" /> 形象已锁定</>
          ) : (
            <><ImageIcon className="w-4 h-4" /> 生成定妆照并锁定</>
          )}
        </button>
      </div>
    </div>
  );
};

const ShotItem: React.FC<{ shot: Shot, scene: Scene, characters: Character[], onGenerate: () => void }> = ({ shot, scene, characters, onGenerate }) => {
  const isLoading = shot.status === ShotStatus.GENERATING;
  const isCompleted = shot.status === ShotStatus.COMPLETED;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all">
      <div className="w-full md:w-80 aspect-video md:aspect-auto bg-slate-100 relative group overflow-hidden shrink-0">
        {shot.imageUrl ? (
          <img src={shot.imageUrl} alt={`Shot ${shot.order}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-100 border-r border-slate-200">
            {isLoading ? (
              <div className="space-y-4 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-indigo-500 animate-pulse">正在绘制分镜图...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 mb-4 opacity-20" />
                <p className="text-sm font-medium">等待生成画面</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-200 tracking-tighter">SHOT #{shot.order}</span>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{shot.camera}</span>
            </div>
            <p className="font-bold text-slate-800">{shot.beatPurpose}</p>
          </div>
          
          {!isCompleted && !isLoading && (
            <button 
              onClick={onGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all"
            >
              <ImageIcon className="w-3 h-3" />
              渲染分镜
            </button>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              已出图
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex gap-2 text-sm">
            <span className="text-slate-400 font-bold shrink-0">动作:</span>
            <span className="text-slate-600">{shot.action}</span>
          </div>
          {shot.dialogue && (
            <div className="flex gap-2 text-sm italic">
              <span className="text-indigo-400 font-bold shrink-0">台词:</span>
              <span className="text-slate-500">“{shot.dialogue}”</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">场景:</span>
            <span className="text-xs font-medium text-slate-600">{scene?.type} - {scene?.description}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">出镜:</span>
            {shot.casting.map(cast => {
              const char = characters.find(c => c.id === cast.characterId);
              const isLocked = char?.look.status === AssetStatus.LOCKED;
              return (
                <div key={cast.characterId} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span className={`text-xs font-bold ${isLocked ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {char?.name || '未知'}
                  </span>
                  {isLocked ? <Lock className="w-2.5 h-2.5 text-indigo-400" /> : <Unlock className="w-2.5 h-2.5 text-slate-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
