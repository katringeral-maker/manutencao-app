import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ClipboardCheck, Building2, MapPin, CheckCircle2, XCircle, Save, 
  LayoutDashboard, ChevronRight, ChevronDown, Droplets, Lightbulb, 
  DoorOpen, Wifi, AlertTriangle, Hammer, Footprints, Square, Home, 
  Flag, Calendar, Users, FileText, Camera, Printer, Trash2, TreePine, 
  PaintBucket, Wrench, PenTool, Eraser, X, Plus, ListTodo, Image as ImageIcon, 
  Sparkles, Loader2, MessageSquare, Send, Bot, Info, Mail, Copy, Filter, Clock, 
  User, Phone, LogIn, LogOut, Lock, UploadCloud, Briefcase, Package, ExternalLink, Link as LinkIcon, Contact,
  RefreshCw
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc, doc, query, setDoc, getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO FIREBASE ---
// Mantenha "demo" se não tiver as chaves do Firebase, mas para guardar dados reais precisa delas.
const firebaseConfig = { 
    apiKey: "demo", 
    projectId: "demo" 
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

// --- CONFIGURAÇÃO GEMINI API (Inserida) ---
const apiKey = "AIzaSyDxRorFcJNEUkfUlei5qx6A91IGuUekcvE"; 

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
  { id: 'limpeza', label: 'Limpeza Geral / Lixo', category: 'Limpeza', icon: <ClipboardCheck size={16} /> },
  { id: 'vidros', label: 'Vidros e Fachadas', category: 'Limpeza', icon: <ClipboardCheck size={16} /> },
  { id: 'duches', label: 'Duches / Torneiras', category: 'Canalização', icon: <Droplets size={16} /> },
  { id: 'wc', label: 'Instalações Sanitárias', category: 'Canalização', icon: <CheckCircle2 size={16} /> },
  { id: 'iluminacao', label: 'Iluminação', category: 'Elétrica', icon: <Lightbulb size={16} /> },
  { id: 'eletrica', label: 'Tomadas / Rede / Wifi', category: 'Elétrica', icon: <Wifi size={16} /> },
  { id: 'portas', label: 'Portas / Fechaduras', category: 'Civil', icon: <DoorOpen size={16} /> },
  { id: 'piso', label: 'Piso / Pavimento', category: 'Civil', icon: <Footprints size={16} /> },
  { id: 'paredes', label: 'Paredes / Pintura', category: 'Civil', icon: <PaintBucket size={16} /> },
  { id: 'teto', label: 'Tetos Falsos', category: 'Civil', icon: <LayoutDashboard size={16} /> },
  { id: 'sinaletica', label: 'Sinalética', category: 'Geral', icon: <AlertTriangle size={16} /> },
  { id: 'serralharia', label: 'Serralharia / Portões', category: 'Geral', icon: <Wrench size={16} /> },
  { id: 'fitness', label: 'Material Desportivo/Fitness', category: 'Equipamento', icon: <Hammer size={16} /> },
  { id: 'relvado_corte', label: 'Relvado (Corte)', category: 'Espaços Verdes', icon: <TreePine size={16} /> },
  { id: 'relvado_rega', label: 'Sistema de Rega', category: 'Espaços Verdes', icon: <Droplets size={16} /> },
  { id: 'relvado_adubacao', label: 'Adubação / Tratamento', category: 'Espaços Verdes', icon: <TreePine size={16} /> },
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
  
  // Vistoria
  const [auditData, setAuditData] = useState({});
  const [analyzingItem, setAnalyzingItem] = useState(null);
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false);

  // Planeamento
  const [planningTasks, setPlanningTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [estimatingTaskId, setEstimatingTaskId] = useState(null);
  const [isGeneratingWhatsApp, setIsGeneratingWhatsApp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Relatório
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

  // --- FUNÇÕES DE VISTORIA (SYNC COM PLANEAMENTO) ---
  const getAuditKey = (bid, zone, iid) => `${bid}-${zone}-${iid}`;
  
  const handleCheck = async (iid, s) => { 
    if (selectedBuilding && selectedZone) {
      const key = getAuditKey(selectedBuilding.id, selectedZone, iid);
      setAuditData(p => ({ ...p, [key]: { ...p[key], status: s, date: inspectionDate, details: s === 'nok' ? { causes: '', measures: '', forecast: '' } : null } })); 
      
      // *** AUTOMATIZAÇÃO: SE FOR ERRO, CRIA TAREFA NO PLANEAMENTO ***
      if (s === 'nok') {
          const itemLabel = CHECKLIST_ITEMS.find(i => i.id === iid)?.label;
          const taskDesc = `Reparar ${itemLabel} em ${selectedBuilding.name} - ${selectedZone}`;
          // Verifica se já existe para não duplicar
          const exists = planningTasks.find(t => t.desc === taskDesc && !t.completed);
          if (!exists) {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { 
                  desc: taskDesc, 
                  completed: false, 
                  assignedTo: '', 
                  startDate: '',
                  duration: '',
                  materials: '',
                  cat: 'Vistoria',
                  date: inspectionDate
              });
          }
      }
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

  // --- FUNÇÕES DE PLANEAMENTO ---
  const handleAddTask = async () => {
    if (!newTaskInput) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { 
        desc: newTaskInput, 
        completed: false, 
        assignedTo: '', 
        startDate: new Date().toISOString().split('T')[0], 
        duration: '',
        materials: '',
        cat: 'Manual',
        date: new Date().toISOString()
    });
    setNewTaskInput('');
  };

  const handleUpdateTask = async (id, field, value) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id), { [field]: value });
  };

  // IMPORTAR CSV
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(line.includes(';') ? ';' : ',');
            if (cols.length >= 1) {
                const desc = cols[0].trim().replace(/^"|"$/g, '');
                if (desc) {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { desc, cat: 'Importado', completed: false, date: new Date().toISOString() });
                    count++;
                }
            }
        }
        setIsImporting(false);
        alert(`${count} tarefas importadas!`);
    };
    reader.readAsText(file);
  };

  // IA: CALCULA TEMPO E MATERIAIS
  const handleEstimateTask = async (task) => {
    setEstimatingTaskId(task.id);
    const equipa = task.assignedTo || "1 pessoa";
    const prompt = `Tarefa: "${task.desc}". Equipa: "${equipa}". Calcula duração e materiais. JSON: {"duration": "...", "materials": "..."}`;
    const resultText = await callGeminiText(prompt);
    if (resultText) {
      try {
        const res = JSON.parse(resultText.replace(/```json|```/g, '').trim());
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { duration: res.duration, materials: res.materials });
      } catch (e) { console.error(e); }
    }
    setEstimatingTaskId(null);
  };

  const handleGenerateWhatsApp = async () => {
    setIsGeneratingWhatsApp(true);
    const tasks = planningTasks.filter(t => !t.completed).map(t => `- ${t.desc} (${t.assignedTo || '?'})`).join('\n');
    const prompt = `Cria msg WhatsApp para equipa:\n${tasks}`;
    const text = await callGeminiText(prompt);
    if (text) alert("Copiado:\n\n" + text);
    setIsGeneratingWhatsApp(false);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const done = planningTasks.filter(t => t.completed).map(t => `${t.desc} (${t.duration})`).join(', ');
    const prompt = `Relatório obras: ${done}.`;
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
        
        {/* BOTÃO IMPORTAR EXCEL/CSV */}
        <label className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-2 rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100 font-bold text-sm">
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileImport} disabled={isImporting} />
            {isImporting ? <Loader2 className="animate-spin" size={16}/> : <UploadCloud size={16}/>} Importar Excel/CSV
        </label>

        <div className="flex-1 overflow-y-auto space-y-2">
          {planningTasks.map(t => (
            <div key={t.id} className="p-3 border rounded bg-white relative group">
              <div className="flex justify-between"><span className="font-medium">{t.desc}</span><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id))}><X size={14} className="text-gray-400"/></button></div>
              <div className="text-xs text-gray-500 mt-1 flex flex-col gap-1">
                 <span className="flex items-center gap-1"><Users size={10}/> {t.assignedTo || 'Sem equipa'}</span>
                 <span className="bg-yellow-50 text-yellow-700 px-1 rounded inline-block">{t.cat || 'Geral'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Quadro de Planeamento</h2>
        <div className="space-y-4">
          {planningTasks.filter(t => !t.completed).map(t => (
            <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-3 font-bold text-lg text-gray-800">{t.desc}</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={10}/> Início</label>
                      <input type="date" className="w-full bg-white border border-gray-200 rounded p-1 text-sm mt-1" value={t.startDate || ''} onChange={(e) => handleUpdateTask(t.id, 'startDate', e.target.value)}/>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Users size={10}/> Equipa</label>
                      <input type="text" placeholder="Quem faz?" className="w-full bg-white border border-gray-200 rounded p-1 text-sm mt-1" value={t.assignedTo || ''} onChange={(e) => handleUpdateTask(t.id, 'assignedTo', e.target.value)}/>
                  </div>
                  <div className="col-span-2">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1"><Clock size={10}/> Duração</label>
                          <button onClick={() => handleEstimateTask(t)} disabled={estimatingTaskId === t.id} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-200 flex items-center gap-1">
                            {estimatingTaskId === t.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} IA: Calcular
                          </button>
                      </div>
                      <input type="text" placeholder="Tempo estimado..." className="w-full bg-white border border-indigo-100 rounded p-1 text-sm mt-1 font-medium text-indigo-900" value={t.duration || ''} onChange={(e) => handleUpdateTask(t.id, 'duration', e.target.value)}/>
                  </div>
                  <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Package size={10}/> Materiais</label>
                      <input type="text" placeholder="Materiais..." className="w-full bg-white border border-gray-200 rounded p-1 text-sm mt-1" value={t.materials || ''} onChange={(e) => handleUpdateTask(t.id, 'materials', e.target.value)}/>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="max-w-5xl mx-auto p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold border-b-2 border-emerald-600 pb-4 mb-6">Relatório Detalhado</h1>
      <div className="bg-indigo-50 p-6 rounded-lg mb-8 border border-indigo-100">
        <div className="flex justify-between mb-2"><h3 className="font-bold text-indigo-900 flex gap-2"><Sparkles size={18}/> Resumo IA</h3><button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">{isGeneratingSummary ? "A gerar..." : "Gerar Resumo"}</button></div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reportSummary || "Clique para gerar um resumo..."}</p>
      </div>
      <h2 className="text-xl font-bold mb-4 text-emerald-600">Trabalhos Concluídos</h2>
      <table className="w-full text-sm border-collapse"><thead className="bg-gray-100"><tr><th className="p-2 text-left border">Tarefa</th><th className="p-2 text-left border">Equipa</th><th className="p-2 text-left border">Tempo</th><th className="p-2 text-left border">Materiais</th><th className="p-2 text-center border">Fim</th></tr></thead><tbody>{planningTasks.filter(t => t.completed).map(t => <tr key={t.id} className="border-b"><td className="p-2 border">{t.desc}</td><td className="p-2 border">{t.assignedTo}</td><td className="p-2 border">{t.duration}</td><td className="p-2 border">{t.materials}</td><td className="p-2 border text-center text-xs">{t.completedAt ? t.completedAt.split('T')[0] : 'Hoje'}</td></tr>)}</tbody></table>
    </div>
  );

  return (
    <div className="h-screen flex flex-col font-sans">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-800"><ClipboardCheck/> Manutenção App</div>
        <div className="flex gap-4">{['inspection', 'planning', 'report'].map(v => (<button key={v} onClick={() => setCurrentView(v)} className={`capitalize font-bold pb-1 border-b-2 ${currentView === v ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}>{v === 'inspection' ? 'Vistoria' : v === 'planning' ? 'Planeamento' : 'Relatório'}</button>))}</div>
        <button onClick={onLogout}><LogOut className="text-gray-500 hover:text-red-600"/></button>
      </header>
      <div className="flex-1 overflow-hidden">{currentView === 'inspection' && renderInspection()}{currentView === 'planning' && renderPlanning()}{currentView === 'report' && renderReport()}</div>
    </div>
  );
}

// === WORKER APP ===
function WorkerApp({ onLogout, user }) {
  const [selectedWorker, setSelectedWorker] = useState(localStorage.getItem('workerName') || '');
  const [inputName, setInputName] = useState(''); 
  const [tasks, setTasks] = useState([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newReportPhoto, setNewReportPhoto] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedTasks.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setTasks(fetchedTasks);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = () => { if (inputName.trim()) { const name = inputName.trim(); setSelectedWorker(name); localStorage.setItem('workerName', name); } };
  
  // NOVA FUNÇÃO: REPORTAR PROBLEMA
  const handleReportIssue = async () => {
      if(!newTaskDesc) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { 
          desc: newTaskDesc, 
          cat: 'Detetado em Obra', 
          date: new Date().toISOString().split('T')[0],
          completed: false,
          initialPhoto: newReportPhoto
      });
      setNewTaskDesc('');
      setNewReportPhoto(null);
      alert("Reportado!");
  };

  // NOVA FUNÇÃO: CONCLUIR COM FOTO OBRIGATÓRIA
  const handleCompleteWithPhoto = async (task, file) => {
      if(!file) return;
      const photoUrl = URL.createObjectURL(file); // Em produção, upload para storage real
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { 
          completed: true, 
          completionPhoto: photoUrl,
          completedAt: new Date().toISOString()
      });
  };

  if (!selectedWorker) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-6"><div className="bg-white p-8 rounded-2xl w-full max-w-sm text-center"><h1 className="text-3xl font-bold mb-3">Área Técnica</h1><input type="text" placeholder="O teu nome" className="w-full p-4 border rounded-xl mb-4" value={inputName} onChange={(e) => setInputName(e.target.value)} /><button onClick={handleLogin} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold">Entrar</button></div></div>
    );
  }

  const myTasks = tasks.filter(t => !t.completed);
  return (
     <div className="min-h-screen bg-gray-50 pb-24 font-sans p-5">
        <header className="flex justify-between items-center mb-6"><h2 className="font-bold text-xl">{selectedWorker}</h2><button onClick={onLogout} className="text-gray-500"><LogOut /></button></header>
        
        {/* ÁREA DE REPORTAR NOVO PROBLEMA */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 mb-6 shadow-sm">
            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Detetou algo errado?</h3>
            <input type="text" className="w-full border p-2 rounded mb-2" placeholder="Descreva o problema..." value={newTaskDesc} onChange={e=>setNewTaskDesc(e.target.value)} />
            <div className="flex gap-2">
                <label className="bg-gray-100 text-gray-600 px-3 py-2 rounded flex-1 text-center cursor-pointer flex items-center justify-center gap-2 text-sm font-bold"><Camera size={16}/> {newReportPhoto ? "Foto OK" : "Foto"} <input type="file" className="hidden" onChange={e => setNewReportPhoto(URL.createObjectURL(e.target.files[0]))} /></label>
                <button onClick={handleReportIssue} className="bg-emerald-600 text-white px-4 py-2 rounded flex-1 font-bold">Reportar</button>
            </div>
        </div>

        <div className="space-y-4">
           {myTasks.map(task => (
             <div key={task.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                <div className="flex justify-between mb-2"><span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold uppercase text-gray-500">{task.cat || 'Geral'}</span><span className="text-xs text-gray-400">{task.date}</span></div>
                <h4 className="font-bold text-lg mb-2">{task.desc}</h4>
                
                {/* DADOS PARA O TRABALHADOR VER */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-4 grid grid-cols-2 gap-2">
                    <div><span className="block text-[10px] font-bold uppercase text-gray-400">Início</span>{task.startDate || '--'}</div>
                    <div><span className="block text-[10px] font-bold uppercase text-gray-400">Duração</span>{task.duration || '--'}</div>
                    <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Materiais</span>{task.materials || '--'}</div>
                </div>

                <label className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-200 transition-colors">
                    <Camera size={18}/> Foto Final & Concluir
                    <input type="file" className="hidden" onChange={(e) => handleCompleteWithPhoto(task, e.target.files[0])} />
                </label>
             </div>
           ))}
        </div>
     </div>
  );
}

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
  return <WorkerApp onLogout={() => setRole(null)} user={user} />;
}

const container = document.getElementById('root');
if (container) { const root = createRoot(container); root.render(<App />); }
