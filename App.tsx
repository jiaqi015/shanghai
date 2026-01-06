
import React, { useState } from 'react';
import { useProductionEngine } from './application/useProductionEngine';
import { 
  MonitorPlay, Sparkles, Terminal, 
  Camera, Play, UserCheck, 
  RefreshCw, Building2, ChevronRight, HardDriveDownload,
  Layout, Layers, Settings
} from 'lucide-react';
import { AssetStatus, ShotStatus } from './domain/models';

const App: React.FC = () => {
  const { project, isWorking, logs, startNewProject, lockAsset, produceShotFrame, reset } = useProductionEngine();
  const [activeTab, setActiveTab] = useState<'blueprint' | 'production'>('blueprint');
  const [scriptInput, setScriptInput] = useState('');

  const SCRIPT_TEMPLATES = [
    { title: "新房推介", content: "经纪人小王带客户参观滨江壹号院。镜头从小王在门口迎接开始，然后是客厅全景，展示无敌江景。小王详细讲解智能家居系统。" },
    { title: "服务日常", content: "清晨，经纪人张姐走进绿城门店。她整理领带，拿起iPad查看新房源。随后她在会议室与团队讨论最新市场数据。" }
  ];

  // 1. 欢迎页渲染
  if (!project) return (
    <div className="h-full w-full bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-slate-900 overflow-hidden">
      <div className="w-24 h-24 bg-lianjia rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200/50 mb-10">
        <MonitorPlay size={44} strokeWidth={2.5} />
      </div>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-[900] tracking-tighter mb-4">Lianjia <span className="text-lianjia">AI</span> Studio</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Industrial Video Asset Consistency Center</p>
      </div>
      
      <div className="w-full max-w-2xl bg-white border border-slate-200/60 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/20">
        <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {SCRIPT_TEMPLATES.map((t, i) => (
            <button 
              key={i} 
              onClick={() => setScriptInput(t.content)} 
              className="flex-1 py-3 px-4 rounded-xl text-[11px] font-black transition-all hover:bg-white hover:text-lianjia text-slate-400 uppercase tracking-wider"
            >
              {t.title}
            </button>
          ))}
        </div>

        <div className="relative mb-8">
          <textarea 
            className="w-full h-48 p-8 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] focus:border-lianjia/20 focus:bg-white text-slate-700 text-base font-medium leading-relaxed transition-all outline-none resize-none placeholder:text-slate-200"
            placeholder="在此粘贴剧本或使用上方模板..."
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
          />
        </div>

        <button 
          onClick={() => startNewProject(scriptInput)}
          disabled={!scriptInput || isWorking}
          className="w-full py-5 bg-lianjia text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-200 hover:bg-lianjia-dark transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
        >
          {isWorking ? <RefreshCw className="animate-spin" size={20}/> : <Sparkles size={20}/>}
          解析剧本蓝图
        </button>
      </div>
      <p className="mt-12 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Professional Workflow Architecture</p>
    </div>
  );

  return (
    <div className="flex h-full w-full bg-[#F8F9FA] overflow-hidden text-slate-900">
      {/* 侧边导航 */}
      <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 shrink-0">
        <div className="w-12 h-12 bg-lianjia rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-100 mb-8">
          <Layout size={24} strokeWidth={2.5}/>
        </div>
        <div className="flex flex-col gap-8">
          <SideBtn icon={<Layers size={20}/>} active={activeTab === 'blueprint'} onClick={() => setActiveTab('blueprint')} label="资产" />
          <SideBtn icon={<MonitorPlay size={20}/>} active={activeTab === 'production'} onClick={() => setActiveTab('production')} label="排产" />
        </div>
        <div className="mt-auto">
          <SideBtn icon={<Settings size={20}/>} active={false} onClick={() => {}} label="设置" />
        </div>
      </aside>

      {/* 主工作区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 px-10 flex items-center justify-between bg-white border-b border-slate-100 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-lianjia rounded-full animate-pulse shadow-[0_0_8px_#00AE66]" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">
                {activeTab === 'blueprint' ? 'Visual Asset Blueprint' : 'Production Pipeline'}
              </h2>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-[10px] font-black text-lianjia bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
              {project.title}
            </span>
          </div>
          <button 
            onClick={() => {reset(); window.location.reload();}} 
            className="flex items-center gap-2 text-[9px] font-black text-slate-300 hover:text-rose-500 transition-all uppercase tracking-widest"
          >
            <RefreshCw size={12} />
            Reset Session
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-[#FBFBFB]">
          {activeTab === 'blueprint' ? (
            <div className="max-w-7xl mx-auto space-y-20">
              <section>
                <div className="flex items-center gap-3 mb-10">
                  <UserCheck className="text-lianjia" size={22}/>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Character Consistency</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {project.characters.map(c => (
                    <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm group">
                      <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden">
                        {c.refImageUrl ? (
                          <img src={c.refImageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                            <UserCheck size={48} strokeWidth={1}/>
                          </div>
                        )}
                        <button onClick={() => lockAsset('char', c.id)} className="absolute bottom-6 right-6 p-4 bg-lianjia text-white rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Camera size={20}/>
                        </button>
                      </div>
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-4 font-black text-slate-900">{c.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.coreTraits.map((t, i) => (
                            <span key={i} className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-10">
                  <Building2 className="text-lianjia" size={22}/>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Spatial Modeling</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {project.locations.map(l => (
                    <div key={l.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm group">
                      <div className="aspect-video bg-slate-50 relative overflow-hidden">
                        {l.refImageUrl ? (
                          <img src={l.refImageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <Building2 size={48} strokeWidth={1}/>
                          </div>
                        )}
                        <button onClick={() => lockAsset('loc', l.id)} className="absolute inset-0 m-auto w-14 h-14 bg-white/95 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 text-lianjia flex items-center justify-center">
                          <Camera size={22}/>
                        </button>
                      </div>
                      <div className="p-10">
                        <h4 className="font-black text-lg text-slate-900 mb-5">{l.name}</h4>
                        <div className="space-y-2.5">
                          {l.subAreas.map(sa => (
                            <div key={sa.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-emerald-50/30 transition-all cursor-pointer group/item">
                              <span>{sa.name}</span>
                              <ChevronRight size={14} className="text-slate-200 group-hover/item:text-lianjia transition-all"/>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-12 pb-48">
              {project.shots.map(s => (
                <div key={s.id} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col lg:flex-row h-[460px] group">
                  <div className="w-full lg:w-3/5 bg-slate-900 relative">
                    {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/5 uppercase tracking-[0.5em] text-[10px] font-black">Frame Pending</div>
                    )}
                    {s.status === ShotStatus.GENERATING && (
                      <div className="absolute inset-0 bg-lianjia/90 backdrop-blur-xl flex flex-col items-center justify-center text-white z-20">
                        <RefreshCw size={48} className="animate-spin opacity-40 mb-4" />
                        <span className="font-black text-[11px] uppercase tracking-[0.4em]">Rendering...</span>
                      </div>
                    )}
                    <div className="absolute top-8 left-8 z-10 px-5 py-2.5 bg-black/40 backdrop-blur-md text-white text-[10px] font-black rounded-2xl border border-white/10 uppercase tracking-widest">
                      Shot {s.order.toString().padStart(2, '0')}
                    </div>
                    <button onClick={() => produceShotFrame(s.id)} className="absolute top-8 right-8 p-6 bg-lianjia text-white rounded-[2rem] shadow-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                      <Play size={20} fill="currentColor"/>
                      Render
                    </button>
                  </div>
                  <div className="flex-1 p-12 flex flex-col justify-between">
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 font-black text-[11px] text-lianjia uppercase tracking-widest">
                        <div className="w-2.5 h-2.5 rounded-full bg-lianjia shadow-[0_0_15px_rgba(0,174,102,0.6)]" />
                        {s.marketingPoint}
                      </div>
                      <p className="text-xl font-bold text-slate-800 italic border-l-4 border-emerald-500/20 pl-6 leading-relaxed">"{s.dialogue}"</p>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">Visual Action</span>
                        <p className="text-[11px] font-bold text-slate-500 leading-loose uppercase tracking-wide">{s.action}</p>
                      </div>
                    </div>
                    <button className="w-full bg-slate-900 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                      <HardDriveDownload size={18} /> Export Frame
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 日志监控 */}
      <aside className="w-80 bg-[#0F1110] flex flex-col shrink-0 border-l border-white/5">
        <div className="h-20 px-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-lianjia">
            <Terminal size={16}/>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Engine Monitor</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isWorking ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-800'}`} />
        </div>
        <div className="flex-1 overflow-y-auto p-8 font-mono text-[10px] space-y-5 bg-black/10">
          {logs.map((log) => (
            <div key={log.id} className={`flex gap-4 leading-relaxed ${log.type === 'process' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-white' : 'text-slate-500'}`}>
              <span className="opacity-30 shrink-0 font-bold">[{new Date(log.id).toLocaleTimeString([], {minute:'2-digit', second:'2-digit'})}]</span>
              <span className="break-words font-medium">{log.msg}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* 全局 Loading */}
      {isWorking && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center pointer-events-none">
           <div className="p-10 bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white flex flex-col items-center gap-6">
             <RefreshCw className="animate-spin text-lianjia" size={48} strokeWidth={2.5}/>
             <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Processing Blueprint</span>
           </div>
        </div>
      )}
    </div>
  );
};

const SideBtn: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, label: string }> = ({ icon, active, onClick, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-3 group transition-colors ${active ? 'text-lianjia' : 'text-slate-300 hover:text-slate-500'}`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-emerald-50' : 'bg-transparent group-hover:bg-slate-50'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: active ? 2.5 : 2 }) : icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.15em]">{label}</span>
  </button>
);

export default App;
