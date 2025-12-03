import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client'; // Importação movida para o topo
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
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- FIREBASE CONFIG ---
// (Substitua pelos seus dados reais do Firebase se ainda não o fez)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-id-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

// --- CONFIGURAÇÃO GEMINI API ---
const apiKey = ""; 

// --- FUNÇÕES AUXILIARES ---
async function callGeminiVision(base64Image, prompt) {
  if (!apiKey) { alert("API Key não configurada."); return null; }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }] })
    });
    if (!response.ok) throw new Error('Falha API');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { console.error(error); return null; }
}

async function callGeminiText(prompt) {
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { return null; }
}

// --- DADOS ESTÁTICOS ---
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

// === COMPONENTES DO APLICATIVO ===

// ECRÃ DE LOGIN
function LoginScreen({ onSelectRole }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);

  const handleAdminLogin = () => {
    if (pin === '1234') { 
      onSelectRole('admin');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (showPinInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Coordenação</h2>
          <p className="text-gray-500 mb-6 text-sm">Insira o código PIN de segurança</p>
          
          <div className="flex justify-center mb-6">
            <input 
              type="password" 
              maxLength={4}
              className="text-center text-3xl tracking-[0.5em] w-48 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none py-2 font-mono text-gray-800"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4 animate-pulse">Código incorreto.</p>}

          <button onClick={handleAdminLogin} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mb-3 hover:bg-indigo-700 transition-colors">Entrar</button>
          <button onClick={() => {setShowPinInput(false); setPin('');}} className="text-gray-400 text-sm hover:text-gray-600">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-gray-900 flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
          <ClipboardCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Complexo CSM</h1>
        <p className="text-emerald-200/80">Gestão de Manutenção & Obras</p>
      </div>

      <div className="grid gap-4 w-full max-w-sm">
        <button 
          onClick={() => setShowPinInput(true)}
          className="bg-white text-gray-900 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-indigo-700" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">Coordenação</span>
              <span className="text-sm text-gray-500">Gestão, Vistorias, Relatórios</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button 
          onClick={() => onSelectRole('worker')}
          className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-5 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
              <Hammer className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">Equipa Técnica</span>
              <span className="text-sm text-emerald-200/70">Registo de trabalhos e fotos</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
      
      <p className="mt-12 text-xs text-white/20">v3.0 Full Integrated System</p>
    </div>
  );
}

// APP DO ADMIN
function AdminApp({ onLogout, user }) {
  const [currentView, setCurrentView] = useState('inspection'); 
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]); 
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); 
  const [reportType, setReportType] = useState('weekly'); 
  const [auditData, setAuditData] = useState({});
  const [analyzingItem, setAnalyzingItem] = useState(null); 
  const [reportSummary, setReportSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false);
  const [generatedText, setGeneratedText] = useState(null);
  const [generatedTextType, setGeneratedTextType] = useState(null);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Olá! Sou o Assistente Técnico do Marítimo.' }]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [planningTasks, setPlanningTasks] = useState([]);
  
  const [planning, setPlanning] = useState({ 
    startDate: '', 
    endDate: '', 
    teamType: 'internal', 
    teamMembers: '', 
    companyName: '',
    externalContact: '', 
    driveLink: '' 
  });

  const [newTaskInput, setNewTaskInput] = useState('');
  const [signatures, setSignatures] = useState({ responsible: null, client: null });
  const [signingRole, setSigningRole] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [estimatingTaskId, setEstimatingTaskId] = useState(null);
  
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
        setPlanningTasks(tasks);
    });
    
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning');
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) {
            setPlanning(docSnap.data());
        } else {
             setDoc(metaRef, planning, { merge: true });
        }
    });

    return () => { unsubscribe(); unsubMeta(); };
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const updatePlanningMeta = async (newData) => {
     const updated = { ...planning, ...newData };
     setPlanning(updated); 
     if (user) {
         try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning'), updated);
         } catch(e) { console.error("Error updating meta", e); }
     }
  };

  const handleAddTaskToFirestore = async (task) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { ...task, completed: false, assignedTo: 'Equipa Interna', createdAt: new Date().toISOString() }); } catch (e) { console.error("Error adding task", e); }
  };
  const handleRemoveTask = async (taskId) => { if (!user) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId)); } catch (e) { console.error(e); } };
  const handleToggleTask = async (taskId, currentStatus) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { completed: !currentStatus }); } catch (e) { console.error(e); } };

  const renderInspection = () => {
    if (!selectedBuilding) return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Manutenção</h1>
        <div className="flex justify-center items-center gap-2 mb-8"><label className="text-sm font-medium">Data da Vistoria:</label><input type="date" className="p-2 border rounded" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {BUILDINGS_DATA.map((b) => (
            <button key={b.id} onClick={() => setSelectedBuilding(b)} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 flex flex-col items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-full">{b.id === 'lar' ? <Home className="w-8 h-8 text-emerald-600" /> : <Building2 className="w-8 h-8 text-emerald-600" />}</div>
              <span className="font-semibold text-gray-700">{b.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
    return (
      <div className="flex flex-1 overflow-hidden h-full">
        <aside className="w-80 bg-white border-r hidden md:block p-4 overflow-y-auto">
          <button onClick={() => setSelectedBuilding(null)} className="mb-4 text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1">&larr; Voltar</button>
          <div className="mb-6 p-3 bg-emerald-50 rounded border border-emerald-100"><label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Data Vistoria</label><input type="date" className="w-full text-sm bg-white border rounded" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)}/></div>
          {selectedBuilding.floors.map(f => (
            <div key={f.id} className="mb-2"><button onClick={() => setSelectedFloor(f.id === selectedFloor?.id ? null : f)} className={`w-full text-left px-3 py-2 rounded flex justify-between ${selectedFloor?.id === f.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50'}`}>{f.name} <ChevronDown className="w-4 h-4"/></button>
              {selectedFloor?.id === f.id && <div className="ml-4 mt-2 border-l-2 pl-2 space-y-1">{f.zones.map(z => <button key={z} onClick={() => setSelectedZone(z)} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedZone === z ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50'}`}>{z}</button>)}</div>}
            </div>
          ))}
        </aside>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {!selectedZone ? <div className="flex flex-col items-center justify-center h-full text-gray-400"><MapPin className="w-16 h-16 mb-4" /><p>Selecione uma zona.</p></div> : (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="bg-white p-6 rounded-xl shadow-sm border flex justify-between"><div><h1 className="text-2xl font-bold">{selectedZone}</h1><p className="text-sm text-gray-500">{selectedBuilding.name}</p></div></div>
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 h-screen">
      <div className="bg-white border-b px-4 pt-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-800 mb-4"><ClipboardCheck className="w-6 h-6"/> Manutenção App 2.0 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Powered</span></div>
        <div className="flex gap-6">
          {['inspection','planning','report'].map(v => <button key={v} onClick={() => setCurrentView(v)} className={`pb-3 px-2 border-b-2 capitalize ${currentView===v?'border-emerald-500 text-emerald-600':'border-transparent'}`}>{v === 'inspection' ? 'Vistoria' : v === 'planning' ? 'Planeamento' : 'Relatório'}</button>)}
        </div>
        <button onClick={onLogout} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><LogOut className="w-5 h-5 text-gray-600"/></button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'inspection' && renderInspection()}
        {currentView === 'planning' && <div className="p-8">Módulo de Planeamento (Em construção)</div>}
        {currentView === 'report' && <div className="p-8">Módulo de Relatórios (Em construção)</div>}
      </div>
    </div>
  );
}

// APP DO TRABALHADOR
function WorkerApp({ onLogout, user }) {
  const [selectedWorker, setSelectedWorker] = useState(localStorage.getItem('workerName') || '');
  const [inputName, setInputName] = useState(''); 
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    if (!user) return;
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const q = query(tasksRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedTasks.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setTasks(fetchedTasks);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = () => { if (inputName.trim()) { const name = inputName.trim(); setSelectedWorker(name); localStorage.setItem('workerName', name); } };
  const handleLogoutWorker = () => { setSelectedWorker(''); localStorage.removeItem('workerName'); setInputName(''); };

  if (!selectedWorker) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col justify-center items-center font-sans">
        <h1 className="text-3xl font-bold mb-3 text-center">Área do Trabalhador</h1>
        <div className="w-full max-w-sm space-y-4 bg-gray-800 p-6 rounded-2xl border border-gray-700">
           <input type="text" placeholder="O teu nome" className="w-full p-4 bg-gray-900 border border-gray-600 rounded-xl text-white" value={inputName} onChange={(e) => setInputName(e.target.value)} />
           <button onClick={handleLogin} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold">Entrar</button>
        </div>
        <button onClick={onLogout} className="mt-8 text-gray-500 hover:text-white text-sm">Voltar</button>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-gray-50 pb-24 font-sans p-5">
        <header className="flex justify-between items-center mb-6">
           <h2 className="font-bold text-xl">{selectedWorker}</h2>
           <button onClick={handleLogoutWorker} className="text-gray-500"><LogOut /></button>
        </header>
        <div>Lista de Tarefas (A carregar...)</div>
     </div>
  );
}

// === COMPONENTE PRINCIPAL ===
export default function App() {
  const [role, setRole] = useState(null); 
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
         await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth falhou", e);
      }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  if (!role) return <LoginScreen onSelectRole={setRole} />;
  if (role === 'admin') return <AdminApp onLogout={() => setRole(null)} user={user} />;
  if (role === 'worker') return <WorkerApp onLogout={() => setRole(null)} user={user} />;
}

// === MONTAGEM DA APP (Isto deve estar sempre no fundo) ===
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
