import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ClipboardCheck, Building2, MapPin, CheckCircle2, XCircle, Save, 
  LayoutDashboard, ChevronRight, ChevronDown, Droplets, Lightbulb, 
  DoorOpen, Wifi, AlertTriangle, Hammer, Footprints, Square, Home, 
  Flag, Calendar, Users, FileText, Camera, Printer, Trash2, TreePine, 
  PaintBucket, Wrench, PenTool, Eraser, X, Plus, ListTodo, Image as ImageIcon, 
  Sparkles, Loader2, MessageSquare, Send, Bot, Info, Mail, Copy, Filter, Clock, 
  User, Phone, LogIn, LogOut, Lock, UploadCloud, Briefcase, Package, ExternalLink, Link as LinkIcon, Contact
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc, doc, query, setDoc, getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = { 
    apiKey: "demo", 
    projectId: "demo" 
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

// --- CONFIGURAÇÃO GEMINI API ---
const apiKey = ""; // <--- COLE A SUA CHAVE GEMINI AQUI

// --- FUNÇÕES AUXILIARES IA ---
async function callGeminiVision(base64Image, prompt) {
  if (!apiKey) { alert("API Key em falta!"); return null; }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { console.error(error); return null; }
}

async function callGeminiText(prompt) {
  if (!apiKey) { alert("API Key em falta!"); return null; }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { return null; }
}

// --- DADOS ---
const CHECKLIST_ITEMS = [
  { id: 'limpeza', label: 'Limpeza Geral / Lixo', category: 'Limpeza', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'vidros', label: 'Vidros e Fachadas', category: 'Limpeza', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'duches', label: 'Duches / Torneiras', category: 'Canalização', icon: <Droplets className="w-4 h-4" /> },
  { id: 'wc', label: 'Instalações Sanitárias', category: 'Canalização', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'iluminacao', label: 'Iluminação', category: 'Elétrica', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'eletrica', label: 'Tomadas / Rede / Wifi', category: 'Elétrica', icon: <Wifi className="w-4 h-4" /> },
  { id: 'portas', label: 'Portas / Fechaduras', category: 'Civil', icon: <DoorOpen className="w-4 h-4" /> },
  { id: 'piso', label: 'Piso / Pavimento', category: 'Civil', icon: <Footprints className="w-4 h-4" /> },
  { id: 'paredes', label: 'Paredes / Pintura', category: 'Civil', icon: <PaintBucket className="w-4 h-4" /> },
  { id: 'teto', label: 'Tetos Falsos', category: 'Civil', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'sinaletica', label: 'Sinalética', category: 'Geral', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'serralharia', label: 'Serralharia / Portões', category: 'Geral', icon: <Wrench className="w-4 h-4" /> },
  { id: 'fitness', label: 'Material Desportivo/Fitness', category: 'Equipamento', icon: <Hammer className="w-4 h-4" /> },
  { id: 'relvado_corte', label: 'Relvado (Corte)', category: 'Espaços Verdes', icon: <TreePine className="w-4 h-4" /> },
  { id: 'relvado_rega', label: 'Sistema de Rega', category: 'Espaços Verdes', icon: <Droplets className="w-4 h-4" /> },
  { id: 'relvado_adubacao', label: 'Adubação / Tratamento', category: 'Espaços Verdes', icon: <TreePine className="w-4 h-4" /> },
];

const BUILDINGS_DATA = [
  { id: 'pavilhao', name: 'Pavilhão Marítimo', floors: [ { id: 'p0', name: 'Piso 0', zones: ['Capela', 'Parque Estacionamento', 'Sintético C', 'W.C. Geral', 'Entrada Pavilhão', 'Entrada Sintético A', 'Secretaria'] }, { id: 'p1', name: 'Piso 1', zones: ['Piso Pavilhão (Campo)', 'Sala Ginástica', 'Balneários Árbitros', 'Balneários Andebol', 'Balneários Futsal', 'Balneários Visitantes', 'Gabinete Médico', 'Sala Muay Thai'] }, { id: 'p2', name: 'Piso 2', zones: ['Ginásio Principal', 'Sala Comunicação Social', 'Bancadas', 'Escadarias', 'WC Públicos'] }, { id: 'p3', name: 'Piso 3', zones: ['Tribuna Presidencial', 'Bilheteira', 'Área Técnica'] } ] },
  { id: 'futebol', name: 'Edifício do Futebol', floors: [ { id: 'fp-2', name: 'Piso -2', zones: ['Dep. Clínico', 'Gabinete Treinadores', 'Balneários Árbitros', 'Balneários Vermelhos', 'Balneários Verdes', 'Balneários Visitantes', 'Gabinete Médico'] }, { id: 'fp-1', name: 'Piso -1', zones: ['Sala de Vídeo', 'Sala de Reuniões', 'Ginásio Futebol', 'Rouparia'] }, { id: 'fp0', name: 'Piso 0', zones: ['Recepção', 'Gabinetes Administrativos', 'Zona de Acesso Principal'] } ] },
  { id: 'estadio', name: 'Estádio', floors: [ { id: 'ep-2', name: 'Piso -2 (Nascente)', zones: ['Exterior', 'Parque Estacionamento', 'Portas Acesso (Torniquetes)'] }, { id: 'ep-1', name: 'Piso -1 (Nascente)', zones: ['Salas Técnicas', 'Sala de Arrumos', 'Zona de Cargas'] }, { id: 'ep0', name: 'Piso 0 (Poente)', zones: ['Balneário Feminino', 'Balneário Masculino', 'Sala de Imprensa'] }, { id: 'bancadas', name: 'Bancadas / Acessos', zones: ['Porta 1', 'Porta 2', 'Porta 3', 'Porta 4', 'Porta 5', 'Porta 6', 'Porta 7', 'Porta 8', 'Porta 10', 'Elevadores'] } ] },
  { id: 'imaculada', name: 'C. Imaculada Conceição', floors: [ { id: 'imp-1', name: 'Piso -1', zones: ['Balneários Técnicos', 'Balneários Marítimo', 'Balneários Visitantes', 'Arrecadação', 'Corredor Acesso'] }, { id: 'imp0', name: 'Piso 0', zones: ['Departamento Clínico', 'Gabinete Treinadores', 'Balneários Árbitros', 'Balneários B', 'Sala Reuniões', 'Rouparia', 'Bar / Zona Social'] }, { id: 'imp1', name: 'Piso 1', zones: ['Bancada', 'W.C. Público', 'Camarotes/Imprensa'] } ] },
  { id: 'lar', name: 'Lar / Residência', floors: [ { id: 'lp0', name: 'Piso 0', zones: ['Sala de Convívio', 'Sala do Volante', 'Balneários', 'Quarto Serviço', 'Corredor'] }, { id: 'lp1', name: 'Piso 1', zones: ['Camarata 1', 'Camarata 2', 'Camarata 3', 'Varanda Exterior', 'Instalações Sanitárias'] }, { id: 'lp2', name: 'Piso 2', zones: ['Quartos Direção', 'Área Administrativa', 'Zona Técnica'] } ] }
];

// === ADMIN APP ===
function AdminApp({ onLogout, user }) {
  const [currentView, setCurrentView] = useState('inspection'); 
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]); 
  
  // Dados de Vistoria
  const [auditData, setAuditData] = useState({});
  const [analyzingItem, setAnalyzingItem] = useState(null);
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false);

  // Dados de Planeamento
  const [planningTasks, setPlanningTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [estimatingTaskId, setEstimatingTaskId] = useState(null);
  const [isGeneratingWhatsApp, setIsGeneratingWhatsApp] = useState(false);

  // Dados de Relatório
  const [reportSummary, setReportSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
        setPlanningTasks(tasks);
    });
    return () => unsubscribe();
  }, [user]);

  // --- FUNÇÕES DE VISTORIA (IA) ---
  const getAuditKey = (bid, zone, iid) => `${bid}-${zone}-${iid}`;
  
  const handleCheck = (iid, s) => { 
    if (selectedBuilding && selectedZone) {
      const key = getAuditKey(selectedBuilding.id, selectedZone, iid);
      setAuditData(p => ({ ...p, [key]: { ...p[key], status: s, date: inspectionDate, details: s === 'nok' ? { causes: '', measures: '', forecast: '' } : null } })); 
    }
  };

  const handleDetailChange = (iid, field, value) => {
    const key = getAuditKey(selectedBuilding.id, selectedZone, iid);
    setAuditData(p => ({ ...p, [key]: { ...p[key], details: { ...p[key].details, [field]: value } } }));
  };

  const handleAnalyzePhoto = async (itemId) => {
    const key = getAuditKey(selectedBuilding.id, selectedZone, itemId);
    const photoUrl = auditData[key]?.photo;
    if (!photoUrl) { alert("Tire uma foto primeiro."); return; }
    setAnalyzingItem(itemId);
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Analisa este problema: ${itemLabel}. Responde JSON: {"causes": "...", "measures": "..."}`;
    const resultText = await callGeminiText(prompt);
    if (resultText) {
      try {
        const res = JSON.parse(resultText.replace(/```json|```/g, '').trim());
        handleDetailChange(itemId, 'causes', res.causes);
        handleDetailChange(itemId, 'measures', res.measures);
      } catch (e) { console.error(e); }
    }
    setAnalyzingItem(null);
  };

  const handleGetRecommendationText = async (itemId, causeText) => {
    if (!causeText) { alert("Escreva a causa."); return; }
    setIsGettingRecommendation(true);
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Como reparar "${itemLabel}" com problema: "${causeText}"? Curto.`;
    const rec = await callGeminiText(prompt);
    if (rec) handleDetailChange(itemId, 'measures', rec);
    setIsGettingRecommendation(false);
  };

  const handlePhotoUpload = (iid, e) => { 
    const f = e.target.files[0]; 
    if (f) setAuditData(p => ({ ...p, [getAuditKey(selectedBuilding.id, selectedZone, iid)]: { ...p[getAuditKey(selectedBuilding.id, selectedZone, iid)], photo: URL.createObjectURL(f) } })) 
  };

  // --- FUNÇÕES DE PLANEAMENTO (IA AVANÇADA) ---
  const handleAddTask = async () => {
    if (!newTaskInput) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { 
        desc: newTaskInput, 
        completed: false, 
        assignedTo: '', // Equipa vazia inicialmente
        startDate: new Date().toISOString().split('T')[0], // Data de hoje por defeito
        duration: '',
        materials: '',
        date: new Date().toISOString()
    });
    setNewTaskInput('');
  };

  const handleUpdateTask = async (id, field, value) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id), { [field]: value });
  };

  // CÁLCULO DE TEMPO COM IA BASEADO NA EQUIPA
  const handleEstimateTask = async (task) => {
    setEstimatingTaskId(task.id);
    const equipa = task.assignedTo || "1 pessoa (padrão)";
    const prompt = `
      Sou gestor de manutenção.
      Tarefa: "${task.desc}"
      Equipa que vai executar: "${equipa}".
      
      Calcula a duração estimada considerando o tamanho desta equipa.
      Se for uma equipa grande, o tempo deve ser menor.
      
      Responde APENAS JSON: {"duration": "ex: 2 horas", "materials": "ex: Tinta, rolos"}
    `;
    
    const resultText = await callGeminiText(prompt);
    if (resultText) {
      try {
        const res = JSON.parse(resultText.replace(/```json|```/g, '').trim());
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { 
            duration: res.duration, 
            materials: res.materials 
        });
      } catch (e) { console.error(e); }
    }
    setEstimatingTaskId(null);
  };

  const handleGenerateWhatsApp = async () => {
    setIsGeneratingWhatsApp(true);
    const tasks = planningTasks.filter(t => !t.completed).map(t => `- ${t.desc} (${t.assignedTo || 'Geral'}) - Início: ${t.startDate || 'ND'}`).join('\n');
    const prompt = `Cria msg WhatsApp para equipa com estas tarefas:\n${tasks}\nUsa emojis e sê motivador.`;
    const text = await callGeminiText(prompt);
    if (text) alert("Copiado para a área de transferência:\n\n" + text);
    setIsGeneratingWhatsApp(false);
  };

  // --- FUNÇÕES DE RELATÓRIO (IA) ---
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const done = planningTasks.filter(t => t.completed).map(t => `${t.desc} (Feito por: ${t.assignedTo})`).join(', ');
    const prompt = `Cria um relatório diário de obras. Obras concluídas: ${done}. Destaca a produtividade. Tom profissional.`;
    const text = await callGeminiText(prompt);
    if (text) setReportSummary(text);
    setIsGeneratingSummary(false);
  };

  // --- RENDERERS ---
  const renderInspection = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {!selectedBuilding ? (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {BUILDINGS_DATA.map(b => (
            <button key={b.id} onClick={() => setSelectedBuilding(b)} className="bg-white p-6 rounded-xl shadow hover:bg-emerald-50 flex items-center gap-4 transition-all"><div className="p-4 bg-emerald-100 rounded-full"><Building2 className="text-emerald-700"/></div><span className="font-bold text-lg text-gray-700">{b.name}</span></button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-white border-r overflow-y-auto hidden md:block p-2">
            <button onClick={() => setSelectedBuilding(null)} className="mb-4 text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1">&larr; Voltar</button>
            {selectedBuilding.floors.map(f => (
              <div key={f.id} className="mb-2"><button onClick={() => setSelectedFloor(f.id === selectedFloor?.id ? null : f)} className="w-full text-left px-4 py-2 font-bold bg-gray-50 rounded mb-1">{f.name}</button>{selectedFloor?.id === f.id && f.zones.map(z => <button key={z} onClick={() => setSelectedZone(z)} className={`w-full text-left px-6 py-1 text-sm ${selectedZone === z ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-100'}`}>{z}</button>)}</div>
            ))}
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">
            {!selectedZone ? <p className="text-center text-gray-400 mt-10">Selecione uma zona.</p> : (
              <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl font-bold mb-4">{selectedZone}</h2>
                {CHECKLIST_ITEMS.map(item => {
                  const key = getAuditKey(selectedBuilding.id, selectedZone, item.id);
                  const data = auditData[key] || {};
                  const isNok = data.status === 'nok';
                  return (
                    <div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm ${isNok ? 'border-red-200' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 items-center"><div className="p-2 bg-gray-100 rounded">{item.icon}</div><span className="font-medium">{item.label}</span></div>
                        <div className="flex gap-2"><button onClick={() => handleCheck(item.id, 'ok')} className={`px-3 py-1 rounded font-bold border ${data.status === 'ok' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>OK</button><button onClick={() => handleCheck(item.id, 'nok')} className={`px-3 py-1 rounded font-bold border ${isNok ? 'bg-red-500 text-white' : 'bg-white'}`}>Erro</button></div>
                      </div>
                      {isNok && (
                        <div className="mt-4 pt-4 border-t border-red-50 grid gap-4">
                          <div className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                            <label className="cursor-pointer flex items-center gap-2 text-blue-600 font-bold text-sm"><Camera size={16}/> {data.photo ? "Foto OK" : "Adicionar Foto"} <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(item.id, e)}/></label>
                            <button onClick={() => handleAnalyzePhoto(item.id)} disabled={analyzingItem === item.id} className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold flex gap-2">{analyzingItem === item.id ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} IA: Analisar</button>
                          </div>
                          <input type="text" className="border p-2 rounded w-full" placeholder="Causas..." value={data.details?.causes || ''} onChange={(e) => handleDetailChange(item.id, 'causes', e.target.value)}/>
                          <div className="flex gap-2"><textarea className="border p-2 rounded w-full" rows={2} placeholder="Medidas..." value={data.details?.measures || ''} onChange={(e) => handleDetailChange(item.id, 'measures', e.target.value)}/><button onClick={() => handleGetRecommendationText(item.id, data.details?.causes)} disabled={isGettingRecommendation} className="text-indigo-600 font-bold text-xs self-start mt-2"><Sparkles size={16}/></button></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );

  const renderPlanning = () => (
    <div className="flex flex-col md:flex-row h-full bg-gray-50">
      <div className="w-full md:w-1/3 bg-white border-r p-4 flex flex-col gap-4">
        <h3 className="font-bold text-gray-700 flex gap-2 items-center"><ListTodo size={20}/> Adicionar Tarefa</h3>
        <div className="flex gap-2"><input type="text" className="border rounded p-2 flex-1 shadow-sm" placeholder="Nova tarefa..." value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)} /><button onClick={handleAddTask} className="bg-emerald-600 text-white p-2 rounded shadow-sm hover:bg-emerald-700"><Plus/></button></div>
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
            <p className="font-bold mb-1">Dica:</p>
            Defina a equipa e a data de início em cada tarefa para a IA calcular o tempo corretamente.
        </div>
        <button onClick={handleGenerateWhatsApp} disabled={isGeneratingWhatsApp} className="mt-auto bg-green-600 text-white px-4 py-3 rounded-xl flex gap-2 items-center justify-center font-bold shadow hover:bg-green-700">{isGeneratingWhatsApp ? <Loader2 className="animate-spin"/> : <MessageSquare size={18}/>} Gerar Escala (WhatsApp)</button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Quadro de Planeamento</h2>
        <div className="space-y-4">
          {planningTasks.filter(t => !t.completed).map(t => (
            <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative group hover:border-indigo-300 transition-all">
              <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id))} className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><X size={16}/></button>
              
              <div className="mb-3">
                  <span className="font-bold text-lg text-gray-800">{t.desc}</span>
              </div>

              {/* GRELHA DE DADOS DA TAREFA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  
                  {/* CAMPO 1: DATA INÍCIO */}
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={10}/> Data Início</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-gray-200 rounded p-1 text-sm mt-1" 
                        value={t.startDate || ''} 
                        onChange={(e) => handleUpdateTask(t.id, 'startDate', e.target.value)}
                      />
                  </div>

                  {/* CAMPO 2: EQUIPA (FUNCIONÁRIOS) */}
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Users size={10}/> Equipa / Funcionários</label>
                      <input 
                        type="text" 
                        placeholder="Ex: João, Maria..." 
                        className="w-full bg-white border border-gray-200 rounded p-1 text-sm mt-1" 
                        value={t.assignedTo || ''} 
                        onChange={(e) => handleUpdateTask(t.id, 'assignedTo', e.target.value)}
                      />
                  </div>

                  {/* CAMPO 3: DURAÇÃO (CALCULADA OU MANUAL) */}
                  <div className="col-span-2">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1"><Clock size={10}/> Duração / Prazo</label>
                          
                          {/* BOTÃO MÁGICO: CALCULAR TEMPO */}
                          <button 
                            onClick={() => handleEstimateTask(t)} 
                            disabled={estimatingTaskId === t.id}
                            className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-200 flex items-center gap-1"
                          >
                            {estimatingTaskId === t.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                            IA: Calcular Tempo
                          </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Ex: 2 dias (Calculado pela IA ou Manual)" 
                        className="w-full bg-white border border-indigo-100 rounded p-1 text-sm mt-1 font-medium text-indigo-900" 
                        value={t.duration || ''} 
                        onChange={(e) => handleUpdateTask(t.id, 'duration', e.target.value)}
                      />
                  </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                 <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { completed: true })} className="text-sm text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded font-bold border border-emerald-200 flex items-center gap-2"><CheckCircle2 size={14}/> Concluir</button>
              </div>
            </div>
          ))}
          {planningTasks.filter(t => !t.completed).length === 0 && <p className="text-gray-400 text-center italic mt-10">Tudo limpo! Adicione tarefas à esquerda.</p>}
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold border-b-2 border-emerald-600 pb-4 mb-6">Relatório</h1>
      <div className="bg-indigo-50 p-6 rounded-lg mb-8 border border-indigo-100">
        <div className="flex justify-between mb-2"><h3 className="font-bold text-indigo-900 flex gap-2"><Sparkles size={18}/> Resumo IA</h3><button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">{isGeneratingSummary ? "A gerar..." : "Gerar Resumo"}</button></div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reportSummary || "Clique para gerar um resumo das atividades..."}</p>
      </div>
      <h2 className="text-xl font-bold mb-4 text-emerald-600">Concluído</h2>
      <table className="w-full text-sm mb-8"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Tarefa</th><th className="p-2 text-left">Equipa</th><th className="p-2 text-left">Data</th></tr></thead><tbody>{planningTasks.filter(t => t.completed).map(t => <tr key={t.id} className="border-b"><td className="p-2">{t.desc}</td><td className="p-2 text-gray-500">{t.assignedTo}</td><td className="p-2">{t.date}</td></tr>)}</tbody></table>
    </div>
  );

  return (
    <div className="h-screen flex flex-col font-sans">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-800"><ClipboardCheck/> Manutenção App</div>
        <div className="flex gap-4">
          {['inspection', 'planning', 'report'].map(v => (
            <button key={v} onClick={() => setCurrentView(v)} className={`capitalize font-bold pb-1 border-b-2 ${currentView === v ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}>
              {v === 'inspection' ? 'Vistoria' : v === 'planning' ? 'Planeamento' : 'Relatório'}
            </button>
          ))}
        </div>
        <button onClick={onLogout}><LogOut className="text-gray-500 hover:text-red-600"/></button>
      </header>
      <div className="flex-1 overflow-hidden">
        {currentView === 'inspection' && renderInspection()}
        {currentView === 'planning' && renderPlanning()}
        {currentView === 'report' && renderReport()}
      </div>
    </div>
  );
}

// === APP & WORKER ===
function App() {
  const [role, setRole] = useState(null); 
  const [user, setUser] = useState(null);
  useEffect(() => { signInAnonymously(auth); onAuthStateChanged(auth, setUser); }, []);
  if (!role) return (
    <div className="h-screen bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center p-6">
      <div className="text-center w-full max-w-sm">
        <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20"><ClipboardCheck size={40} className="text-emerald-400"/></div>
        <h1 className="text-3xl font-bold text-white mb-8">Complexo CSM</h1>
        <button onClick={() => setRole('admin')} className="bg-white text-gray-900 w-full p-5 rounded-2xl flex items-center justify-between mb-4 font-bold text-lg hover:scale-105 transition-transform shadow-lg"><div className="flex items-center gap-3"><LayoutDashboard className="text-indigo-600"/> Coordenação</div><ChevronRight className="text-gray-400"/></button>
        <button onClick={() => setRole('worker')} className="bg-white/10 backdrop-blur border border-white/20 text-white w-full p-5 rounded-2xl flex items-center justify-between font-bold text-lg hover:bg-white/20 transition-all"><div className="flex items-center gap-3"><Hammer className="text-emerald-400"/> Equipa Técnica</div><ChevronRight className="text-white/50"/></button>
      </div>
    </div>
  );
  if (role === 'admin') return <AdminApp onLogout={() => setRole(null)} user={user} />;
  return <div className="p-10 text-center">Área do Trabalhador<br/><button onClick={() => setRole(null)} className="mt-4 underline">Voltar</button></div>;
}

const container = document.getElementById('root');
if (container) { const root = createRoot(container); root.render(<App />); }
