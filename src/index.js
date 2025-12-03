import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client'; // Importação movida para o topo (CORREÇÃO)
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
// IMPORTANTE: Se você já tinha colocado as suas chaves antes, certifique-se de as colocar aqui novamente.
const firebaseConfig = {
  // Se não tiver as chaves aqui, a app vai abrir mas não vai guardar dados.
  // Exemplo: apiKey: "AIzaSy...",
};

// Inicialização segura do Firebase
const app = initializeApp(Object.keys(firebaseConfig).length ? firebaseConfig : { apiKey: "demo" });
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

// --- CONFIGURAÇÃO GEMINI API ---
const apiKey = ""; 

// --- FUNÇÕES AUXILIARES ---
async function callGeminiVision(base64Image, prompt) {
  if (!apiKey) { alert("API Key não configurada."); return null; }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
  { id: 'estadio', name: 'Estádio', floors: [ { id: 'ep-2', name: 'Piso -2 (Nascente)', zones: ['Exterior', 'Parque Estacionamento', 'Portas Acesso (Torniquetes)'] }, { id: 'ep-1', name: 'Piso -1 (Nascente)', zones: ['Salas Técnicas', 'Sala de Arrumos', 'Zona de Cargas'] }, { id: 'ep0', name: 'Piso 0', zones: ['Balneário Feminino', 'Balneário Masculino', 'Sala de Imprensa'] }, { id: 'bancadas', name: 'Bancadas / Acessos', zones: ['Porta 1', 'Porta 2', 'Porta 3', 'Porta 4', 'Porta 5', 'Porta 6', 'Porta 7', 'Porta 8', 'Porta 10', 'Elevadores'] } ] },
  { id: 'imaculada', name: 'C. Imaculada Conceição', floors: [ { id: 'imp-1', name: 'Piso -1', zones: ['Balneários Técnicos', 'Balneários Marítimo', 'Balneários Visitantes', 'Arrecadação', 'Corredor Acesso'] }, { id: 'imp0', name: 'Piso 0', zones: ['Departamento Clínico', 'Gabinete Treinadores', 'Balneários Árbitros', 'Balneários B', 'Sala Reuniões', 'Rouparia', 'Bar / Zona Social'] }, { id: 'imp1', name: 'Piso 1', zones: ['Bancada', 'W.C. Público', 'Camarotes/Imprensa'] } ] },
  { id: 'lar', name: 'Lar / Residência', floors: [ { id: 'lp0', name: 'Piso 0', zones: ['Sala de Convívio', 'Sala do Volante', 'Balneários', 'Quarto Serviço', 'Corredor'] }, { id: 'lp1', name: 'Piso 1', zones: ['Camarata 1', 'Camarata 2', 'Camarata 3', 'Varanda Exterior', 'Instalações Sanitárias'] }, { id: 'lp2', name: 'Piso 2', zones: ['Quartos Direção', 'Área Administrativa', 'Zona Técnica'] } ] }
];

// === PONTO DE ENTRADA PRINCIPAL ===
function App() {
  const [role, setRole] = useState(null); 
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
         await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth falhou, tentando anónimo", e);
      }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  if (!role) return <LoginScreen onSelectRole={setRole} />;
  if (role === 'admin') return <AdminApp onLogout={() => setRole(null)} user={user} />;
  if (role === 'worker') return <WorkerApp onLogout={() => setRole(null)} user={user} />;
}

// === ECRÃ DE LOGIN ===
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
            <input type="password" maxLength={4} className="text-center text-3xl tracking-[0.5em] w-48 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none py-2 font-mono text-gray-800" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} autoFocus />
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
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20"><ClipboardCheck className="w-10 h-10 text-emerald-400" /></div>
        <h1 className="text-4xl font-bold mb-2">Complexo CSM</h1>
        <p className="text-emerald-200/80">Gestão de Manutenção & Obras</p>
      </div>
      <div className="grid gap-4 w-full max-w-sm">
        <button onClick={() => setShowPinInput(true)} className="bg-white text-gray-900 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all shadow-lg group">
          <div className="flex items-center gap-4"><div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors"><LayoutDashboard className="w-6 h-6 text-indigo-700" /></div><div className="text-left"><span className="block font-bold text-lg">Coordenação</span><span className="text-sm text-gray-500">Gestão, Vistorias, Relatórios</span></div></div><ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button onClick={() => onSelectRole('worker')} className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-5 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-lg group">
          <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors"><Hammer className="w-6 h-6 text-emerald-400" /></div><div className="text-left"><span className="block font-bold text-lg">Equipa Técnica</span><span className="text-sm text-emerald-200/70">Registo de trabalhos e fotos</span></div></div><ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
      <p className="mt-12 text-xs text-white/20">v3.0 Full Integrated System</p>
    </div>
  );
}

// === ADMIN APP ===
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
  const [planningTasks, setPlanningTasks] = useState([]);
  const [planning, setPlanning] = useState({ startDate: '', endDate: '', teamType: 'internal', teamMembers: '', companyName: '', externalContact: '', driveLink: '' });
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
        setPlanningTasks(tasks);
    });
    
    // Configurações de Planeamento
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning');
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) { setPlanning(docSnap.data()); } else { setDoc(metaRef, planning, { merge: true }); }
    });
    return () => { unsubscribe(); unsubMeta(); };
  }, [user]);

  const updatePlanningMeta = async (newData) => {
     const updated = { ...planning, ...newData };
     setPlanning(updated); 
     if (user) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning'), updated); } catch(e) { console.error(e); } }
  };

  const handleAddTaskToFirestore = async (task) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { ...task, completed: false, assignedTo: 'Equipa Interna', createdAt: new Date().toISOString() }); } catch (e) { console.error(e); }
  };
  const handleRemoveTask = async (taskId) => { if (!user) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId)); } catch (e) { console.error(e); } };
  const handleToggleTask = async (taskId, currentStatus) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { completed: !currentStatus }); } catch (e) { console.error(e); } };

  // Funções de Vistoria
  const getAuditKey = (bid, zone, iid) => `${bid}-${zone}-${iid}`;
  const handleCheck = (iid, s) => { if (selectedBuilding && selectedZone) setAuditData(p => ({ ...p, [getAuditKey(selectedBuilding.id, selectedZone, iid)]: { ...p[getAuditKey(selectedBuilding.id, selectedZone, iid)], status: s, date: inspectionDate, details: s === 'nok' ? { causes: '', measures: '', forecast: '' } : null } })); };
  const handleDetailChange = (iid, f, v) => setAuditData(p => ({ ...p, [getAuditKey(selectedBuilding.id, selectedZone, iid)]: { ...p[getAuditKey(selectedBuilding.id, selectedZone, iid)].details, [f]: v } } ));

  // Função Importar CSV
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
            const separator = line.includes(';') ? ';' : ',';
            const cols = line.split(separator);
            if (cols.length >= 2) {
                const desc = cols[1].trim().replace(/^"|"$/g, '');
                if (desc) {
                    await handleAddTaskToFirestore({ desc: desc, cat: cols[2] ? cols[2].trim() : 'Importado', date: cols[0].trim() || new Date().toISOString().split('T')[0] });
                    count++;
                }
            }
        }
        setIsImporting(false);
        alert(`${count} tarefas importadas!`);
    };
    reader.readAsText(file);
  };

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
          {selectedBuilding.floors.map(f => (
            <div key={f.id} className="mb-2"><button
