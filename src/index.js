/* eslint-disable no-undef */
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client'; // ✅ Única importação necessária para React 18
import { 
  ClipboardCheck, Building2, MapPin, CheckCircle2, XCircle, Save, 
  LayoutDashboard, ChevronRight, ChevronDown, Droplets, Lightbulb, 
  DoorOpen, Wifi, AlertTriangle, Hammer, Footprints, Square, Home, 
  Flag, Calendar, Users, FileText, Camera, Printer, Trash2, TreePine, 
  PaintBucket, Wrench, PenTool, Eraser, X, Plus, ListTodo, Image as ImageIcon, 
  Sparkles, Loader2, MessageSquare, Send, Bot, Info, Mail, Copy, Filter, Clock, 
  User, Phone, LogIn, LogOut, Lock, UploadCloud, Briefcase, Package, ExternalLink, Link as LinkIcon, Contact,
  RefreshCw, FileSpreadsheet, Edit3, Eye, FileCheck, ClipboardList, AlertCircle
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc, doc, query, setDoc, getDoc, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO MANUAL DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAo6MPtHy6b-n0rKvZtuy_TCJPG8qye7oU", 
  authDomain: "manutencaoappcsm.firebaseapp.com", 
  projectId: "manutencaoappcsm", 
  storageBucket: "manutencaoappcsm.firebasestorage.app",
  messagingSenderId: "109430393454",
  appId: "1:109430393454:web:f2a56b08e2ff9ad755f47f"
};

// Inicialização Segura do Firebase
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Erro Crítico Firebase:", e);
}

// --- CONFIGURAÇÃO GEMINI API ---
const apiKey = "AIzaSyDxRorFcJNEUkfUlei5qx6A91IGuUekcvE"; 
const appId = 'default-app-id'; 

// Funções da IA
async function callGeminiVision(base64Image, prompt) {
  if (!apiKey) { alert("API Key não configurada."); return null; }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { console.error("Erro Visão:", error); return null; }
}

async function callGeminiText(prompt) {
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { console.error("Erro Texto:", error); return null; }
}

// Dados Estáticos
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

// === COMPONENTE PRINCIPAL ===
export default function App() {
  const [role, setRole] = useState(null); 
  const [user, setUser] = useState(null);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    if (auth) {
        signInAnonymously(auth)
            .then(() => {
                setDbError(null);
            })
            .catch(e => {
                console.error("Erro Detalhado:", e);
                setDbError(`ERRO: ${e.code} - ${e.message}. Verifique 'Authorized Domains' no Firebase.`);
            });
        onAuthStateChanged(auth, setUser);
    }
  }, []);

  if (!auth) return <div className="p-10 text-center text-red-600 font-bold">Erro Crítico: Configuração do Firebase não encontrada.</div>;

  return (
    <>
        {dbError && (
            <div className="bg-red-600 text-white p-4 text-center text-sm font-bold fixed top-0 w-full z-[100] flex flex-col gap-2">
                <span>{dbError}</span>
                <span className="text-xs font-normal opacity-80">Dica: Adicione 'vercel.app' em Authentication {'>'} Settings {'>'} Authorized domains</span>
            </div>
        )}
        
        {!role ? <LoginScreen onSelectRole={setRole} /> : 
         role === 'admin' ? <AdminApp onLogout={() => setRole(null)} user={user} setDbError={setDbError} /> : 
         <WorkerApp onLogout={() => setRole(null)} user={user} />}
    </>
  );
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
            <input type="password" maxLength={4} className="text-center text-3xl tracking-[0.5em] w-48 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none py-2 font-mono text-gray-800"
              value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} autoFocus />
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
        <button onClick={() => setShowPinInput(true)} className="bg-white text-gray-900 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all shadow-lg group">
          <div className="flex items-center gap-4"><div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors"><LayoutDashboard className="w-6 h-6 text-indigo-700" /></div><div className="text-left"><span className="block font-bold text-lg">Coordenação</span><span className="text-sm text-gray-500">Gestão, Vistorias, Relatórios</span></div></div><ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button onClick={() => onSelectRole('worker')} className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-5 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-lg group">
          <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors"><Hammer className="w-6 h-6 text-emerald-400" /></div><div className="text-left"><span className="block font-bold text-lg">Equipa Técnica</span><span className="text-sm text-emerald-200/70">Registo de trabalhos e fotos</span></div></div><ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
      <p className="mt-12 text-xs text-white/20">v3.14 Full Integrated System</p>
    </div>
  );
}

// === ADMIN APP ===
function AdminApp({ onLogout, user, setDbError }) {
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
  
  const [planning, setPlanning] = useState({ startDate: '', endDate: '', teamType: 'internal', teamMembers: '', companyName: '', externalContact: '', driveLink: '' });
  const [newTaskInput, setNewTaskInput] = useState('');
  const [signatures, setSignatures] = useState({ responsible: null, client: null });
  const [signingRole, setSigningRole] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [estimatingTaskId, setEstimatingTaskId] = useState(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const chatEndRef = useRef(null);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    if (!user) return;
    
    // Ler Tarefas com Ordem
    const tasksQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), orderBy('date', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlanningTasks(tasks);
        setDbError(null);
    }, (err) => {
        console.error("Erro Tasks:", err);
        setDbError("Erro ao ler tarefas: Base de dados não encontrada ou permissões insuficientes.");
    });

    // Ler Vistorias
    const inspectionRef = doc(db, 'artifacts', appId, 'public', 'data', 'inspection', 'current');
    const unsubscribeInspection = onSnapshot(inspectionRef, (docSnap) => {
        if (docSnap.exists()) setAuditData(docSnap.data().data || {});
    });

    // Ler Settings
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning');
    const unsubscribeMeta = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) setPlanning(docSnap.data());
    });

    return () => { unsubscribeTasks(); unsubscribeMeta(); unsubscribeInspection(); };
  }, [user]);

  // Função Auxiliar para criar tarefa
  const createPlanningTask = async (taskData) => {
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
              ...taskData,
              assignedTo: 'Equipa Interna',
              completed: false,
              createdAt: new Date().toISOString()
          });
      } catch (e) {
          alert("Erro ao criar tarefa. Tente novamente.");
          console.error(e);
      }
  };

  const saveInspectionToFirestore = async (newData) => {
      setAuditData(newData); 
      if(user) {
          try {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inspection', 'current'), { data: newData }, { merge: true });
          } catch(e) { console.error("Erro save vistoria:", e); }
      }
  };

  const handleFinishInspection = async () => {
      if(!window.confirm("Pretende terminar a vistoria e arquivar?")) return;
      const reportId = new Date().toISOString().split('T')[0];
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inspection_reports', reportId), { date: inspectionDate, data: auditData, closedAt: new Date().toISOString() });
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inspection', 'current'), { data: {} });
          setAuditData({});
          alert("Vistoria arquivada!");
      } catch(e) { alert("Erro ao arquivar."); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const getAuditKey = (bid, zone, iid) => `${bid}-${zone}-${iid}`;

  const handleCheck = async (itemId, status) => { 
      if (!selectedBuilding || !selectedZone) return;
      const key = getAuditKey(selectedBuilding.id, selectedZone, itemId);
      
      const newItem = { 
          ...auditData[key], 
          status: status, 
          date: inspectionDate, 
          details: auditData[key]?.details || (status === 'nok' ? { causes: '', measures: '', forecast: '' } : null)
      };

      const newAuditData = { ...auditData, [key]: newItem };
      saveInspectionToFirestore(newAuditData);

      // --- CRIAÇÃO IMEDIATA DE TAREFA ---
      if (status === 'nok') {
          const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
          createPlanningTask({
              desc: `Reparar ${itemLabel} em ${selectedBuilding.name} - ${selectedZone}`,
              cat: 'Vistoria',
              date: inspectionDate,
              originId: `auto_${key}_${Date.now()}` // ID único garantido
          });
      }
  };

  const handleDetailChange = (itemId, field, value) => {
      if (!selectedBuilding || !selectedZone) return;
      const key = getAuditKey(selectedBuilding.id, selectedZone, itemId);
      const newAuditData = { ...auditData, [key]: { ...auditData[key], details: { ...auditData[key].details, [field]: value } } };
      saveInspectionToFirestore(newAuditData);
  };

  const handlePhotoUpload = (itemId, e) => { 
      const f = e.target.files[0]; 
      if (f) {
          const key = getAuditKey(selectedBuilding.id, selectedZone, itemId);
          const reader = new FileReader();
          reader.onloadend = () => {
              const newAuditData = { ...auditData, [key]: { ...auditData[key], photo: reader.result } };
              saveInspectionToFirestore(newAuditData);
          };
          reader.readAsDataURL(f);
      }
  };

  const updatePlanningMeta = async (newData) => {
     const updated = { ...planning, ...newData };
     setPlanning(updated); 
     if (user) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'planning'), updated); } catch(e) {} }
  };

  const handleCreateNewTask = () => { 
      if (!newTaskInput.trim()) return; 
      createPlanningTask({ desc: newTaskInput, cat: 'Manual', date: new Date().toISOString().split('T')[0] });
      setNewTaskInput(''); 
  };

  const handleRemoveTask = async (taskId) => { if (!user) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId)); } catch (e) {} };
  const handleToggleTask = async (taskId, currentStatus) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { completed: !currentStatus }); } catch (e) {} };

  const handleEstimateTaskDetails = async (task) => {
    setEstimatingTaskId(task.id);
    const staffCount = planning.teamType === 'internal' ? 'equipa interna atual' : 'empresa externa';
    const prompt = `És um perito em manutenção. Tarefa: "${task.desc}". Baseado em ${staffCount}, estima: 1. Tempo de execução. 2. Materiais. 3. Medidas. Responde JSON: {"duration": "...", "materials": "...", "measures": "..."}`;
    const resultText = await callGeminiText(prompt);
    if (resultText) { 
        try { 
            const cleanJson = resultText.replace(/```json|```/g, '').trim(); 
            const result = JSON.parse(cleanJson); 
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { duration: result.duration, materials: result.materials, measures: result.measures }); 
        } catch (e) { alert("Erro ao processar IA. Tente novamente."); } 
    }
    setEstimatingTaskId(null);
  };

  const handleAnalyzePhoto = async (itemId, buildingId, zoneName) => {
    const key = getAuditKey(buildingId, zoneName, itemId);
    const photoUrl = auditData[key]?.photo;
    if (!photoUrl) { alert("Adicione foto primeiro."); return; }
    const base64Data = photoUrl.split(',')[1];
    setAnalyzingItem(itemId);
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Analisa esta foto de manutenção (${itemLabel} em ${zoneName}). Identifica a Causa provável e Medidas de Reparação. Responde APENAS JSON: {"causes": "...", "measures": "..."}`;
    const resultText = await callGeminiVision(base64Data, prompt);
    if (resultText) { try { const cleanJson = resultText.replace(/```json|```/g, '').trim(); const result = JSON.parse(cleanJson); handleDetailChange(itemId, 'causes', result.causes); handleDetailChange(itemId, 'measures', result.measures); } catch (e) {} }
    setAnalyzingItem(null);
  };

  const handleGetRecommendationText = async (itemId, buildingId, zoneName, causeText) => {
    if (!causeText) { alert("Descreva o problema primeiro."); return; }
    const key = getAuditKey(buildingId, zoneName, itemId);
    setIsGettingRecommendation(true);
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Dá uma solução técnica curta para reparar: ${itemLabel} em ${zoneName}. Problema: "${causeText}".`;
    const recommendation = await callGeminiText(prompt);
    if (recommendation) handleDetailChange(itemId, 'measures', recommendation);
    setIsGettingRecommendation(false);
  };

  const handleExportToSheets = (tasks) => {
    const headers = ["Data", "Tarefa", "Categoria", "Estado", "Responsável", "Tempo", "Quem Executou", "Observações"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + tasks.map(t => [t.date, `"${(t.desc||"").replace(/"/g, '""')}"`, t.cat, t.completed ? "Concluído" : "Pendente", t.assignedTo, t.duration||"-", t.completedBy||"-", `"${(t.observations||"")}"`].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `relatorio_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click();
  };

  const handleGenerateReportEmail = async (nokEntries, completedTasks) => {
    setIsGeneratingText(true); setGeneratedTextType('email');
    const period = getPeriodLabel();
    const nokText = nokEntries.map(e => `- ${e.zone}: ${e.item?.label}`).join('\n');
    const taskText = completedTasks.map(t => `- ${t.desc}`).join('\n');
    const prompt = `Email formal para a Administração. Relatório Manutenção (${period}). Destaques: ${nokEntries.length} anomalias, ${completedTasks.length} conclusões.\nLista Anomalias:\n${nokText}\nLista Concluídos:\n${taskText}`;
    const content = await callGeminiText(prompt);
    setGeneratedText(content); setIsGeneratingText(false);
  };

  const handleGenerateReportSummary = async (nokEntries, completedTasks) => {
    setIsGeneratingSummary(true);
    const nokText = nokEntries.map(e => `- ${e.zone}: ${e.item?.label}`).join('\n');
    const taskText = completedTasks.map(t => `- ${t.desc}`).join('\n');
    const prompt = `Resumo Executivo manutenção. Problemas: ${nokEntries.length}. Resolvidos: ${completedTasks.length}.\n${nokText}\n${taskText}`;
    const summary = await callGeminiText(prompt);
    if (summary) setReportSummary(summary);
    setIsGeneratingSummary(false);
  };

  const handleGenerateWhatsApp = async () => {
    setIsGeneratingText(true); setGeneratedTextType('whatsapp');
    const tasksToSend = planningTasks.filter(t => !t.completed);
    const taskList = tasksToSend.map(t => `👉 ${t.desc} (${t.assignedTo})`).join('\n');
    const prompt = `Mensagem WhatsApp para equipa com tarefas pendentes:\n${taskList}`;
    const content = await callGeminiText(prompt);
    setGeneratedText(content); setIsGeneratingText(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    setChatMessages(p => [...p, { role: 'user', text: chatInput }]); setChatInput(""); setIsChatLoading(true);
    const response = await callGeminiText(`Especialista manutenção: "${chatInput}"`);
    setChatMessages(p => [...p, { role: 'assistant', text: response || "Erro IA." }]); setIsChatLoading(false);
  };

  const handleFileImport = (e) => { const file = e.target.files[0]; if (!file) return; setIsImporting(true); const reader = new FileReader(); reader.readAsText(file, 'ISO-8859-1'); reader.onload = async (event) => { const text = event.target.result; const lines = text.split('\n'); let count = 0; for (let i = 0; i < lines.length; i++) { const line = lines[i].trim(); if (!line) continue; const separator = line.includes(';') ? ';' : ','; const cols = line.split(separator); if (cols.length >= 2) { const desc = cols[1].trim().replace(/^"|"$/g, ''); if (desc) { createPlanningTask({ desc: desc, cat: cols[2]?.trim() || 'Importado', date: cols[0].trim() || new Date().toISOString().split('T')[0] }); count++; } } } setIsImporting(false); alert(`${count} tarefas importadas!`); }; reader.readAsText(f); };

  const getWeekRange = (dateString) => { const d = new Date(dateString); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d); m.setDate(diff); const s = new Date(m); s.setDate(m.getDate() + 6); return `${m.toLocaleDateString('pt-PT')} a ${s.toLocaleDateString('pt-PT')}`; };
  const getPeriodLabel = () => { const d = new Date(reportDate); if (reportType === 'daily') return d.toLocaleDateString('pt-PT'); if (reportType === 'weekly') return getWeekRange(reportDate); if (reportType === 'monthly') return d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }); return `Ano ${d.getFullYear()}`; };
  const filterByPeriod = (dateStr) => { if (!dateStr) return false; const itemDate = new Date(dateStr); const refDate = new Date(reportDate); if (reportType === 'daily') return itemDate.toDateString() === refDate.toDateString(); if (reportType === 'weekly') { const day = refDate.getDay(); const diff = refDate.getDate() - day + (day === 0 ? -6 : 1); const monday = new Date(refDate); monday.setDate(diff); monday.setHours(0,0,0,0); const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23,59,59,999); return itemDate >= monday && itemDate <= sunday; } else if (reportType === 'monthly') return itemDate.getMonth() === refDate.getMonth() && itemDate.getFullYear() === refDate.getFullYear(); else return itemDate.getFullYear() === refDate.getFullYear(); };

  const startDrawing = (e) => { isDrawing.current = true; draw(e); };
  const draw = (e) => { if (!isDrawing.current) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const rect = canvasRef.current.getBoundingClientRect(); const x = (e.clientX||e.touches?.[0].clientX)-rect.left; const y = (e.clientY||e.touches?.[0].clientY)-rect.top; ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineTo(x,y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y); };
  const stopDrawing = () => { isDrawing.current = false; canvasRef.current?.getContext('2d').beginPath(); };
  const clearSignature = () => canvasRef.current.getContext('2d').clearRect(0,0,460,200);
  const saveSignature = () => { if (signingRole) setSignatures(p => ({...p, [signingRole]: canvasRef.current.toDataURL()})); setSigningRole(null); };
  const handlePrint = () => window.print();

  const renderInspection = () => {
    if (!selectedBuilding) return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Manutenção</h1>
        <div className="flex justify-center items-center gap-2 mb-8"><label className="text-sm font-medium">Data da Vistoria:</label><input type="date" className="p-2 border rounded" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {BUILDINGS_DATA.map((b) => (<button key={b.id} onClick={() => setSelectedBuilding(b)} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 flex flex-col items-center gap-4"><div className="p-4 bg-emerald-50 rounded-full">{b.id === 'lar' ? <Home className="w-8 h-8 text-emerald-600" /> : <Building2 className="w-8 h-8 text-emerald-600" />}</div><span className="font-semibold text-gray-700">{b.name}</span></button>))}
        </div>
      </div>
    );
    return (
      <div className="flex flex-1 overflow-hidden h-full">
        <aside className="w-80 bg-white border-r hidden md:block p-4 overflow-y-auto">
          <button onClick={() => setSelectedBuilding(null)} className="mb-4 text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1">&larr; Voltar</button>
          <div className="mb-6 p-3 bg-emerald-50 rounded border border-emerald-100"><label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Data Vistoria</label><input type="date" className="w-full text-sm bg-white border rounded" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)}/></div>
          <button onClick={handleFinishInspection} className="w-full mt-4 bg-green-600 text-white p-3 rounded shadow hover:bg-green-700 flex items-center justify-center gap-2"><FileCheck className="w-4 h-4"/> Finalizar e Arquivar</button>
          <div className="mt-6 border-t pt-4"><p className="text-xs text-gray-400">Selecione o piso:</p></div>
          {selectedBuilding.floors.map(f => (
            <div key={f.id} className="mb-2"><button onClick={() => setSelectedFloor(f.id === selectedFloor?.id ? null : f)} className={`w-full text-left px-3 py-2 rounded flex justify-between ${selectedFloor?.id === f.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50'}`}>{f.name} <ChevronDown className="w-4 h-4"/></button>{selectedFloor?.id === f.id && <div className="ml-4 mt-2 border-l-2 pl-2 space-y-1">{f.zones.map(z => <button key={z} onClick={() => setSelectedZone(z)} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedZone === z ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50'}`}>{z}</button>)}</div>}</div>
          ))}
        </aside>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {!selectedZone ? <div className="flex flex-col items-center justify-center h-full text-gray-400"><MapPin className="w-16 h-16 mb-4" /><p>Selecione uma zona.</p></div> : (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="bg-white p-6 rounded-xl shadow-sm border flex justify-between"><div><h1 className="text-2xl font-bold">{selectedZone}</h1><p className="text-sm text-gray-500">{selectedBuilding.name}</p></div></div>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden divide-y">
                {CHECKLIST_ITEMS.map((item) => {
                  const key = getAuditKey(selectedBuilding.id, selectedZone, item.id); const data = auditData[key] || {}; const isNok = data.status === 'nok'; const isAnalyzing = analyzingItem === item.id;
                  return (
                    <div key={item.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3"><div className="p-2 bg-gray-100 rounded">{item.icon}</div><div><span className="font-medium block">{item.label}</span><span className="text-xs text-gray-400">{item.category}</span></div></div>
                        <div className="flex items-center gap-2"><label className={`p-2 rounded cursor-pointer border ${data.photo ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-400'}`}><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(item.id, e)} /><Camera className="w-5 h-5" /></label><button onClick={() => handleCheck(item.id, 'ok')} className={`px-3 py-2 rounded border flex gap-2 ${data.status === 'ok' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400'}`}><CheckCircle2 className="w-5 h-5"/> OK</button><button onClick={() => handleCheck(item.id, 'nok')} className={`px-3 py-2 rounded border flex gap-2 ${data.status === 'nok' ? 'bg-red-500 text-white' : 'bg-white text-gray-400'}`}><XCircle className="w-5 h-5"/> Erro</button></div>
                      </div>
                      {(isNok || data.photo) && (
                        <div className="mt-4 pl-12 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                          {data.photo && (<div className="col-span-2 relative group"><img src={data.photo} className="h-40 object-cover rounded border" alt="Anomalia" /><div className="absolute top-2 left-2 flex gap-2"><button onClick={() => setAuditData(p => ({...p, [key]: {...p[key], photo: null}}))} className="bg-red-500 text-white p-1 rounded opacity-80 hover:opacity-100"><Trash2 className="w-4 h-4" /></button>{isNok && (<button onClick={() => handleAnalyzePhoto(item.id, selectedBuilding.id, selectedZone)} disabled={isAnalyzing} className="bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm shadow-md hover:bg-indigo-700 disabled:opacity-50">{isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-yellow-300"/>}{isAnalyzing ? 'A Analisar...' : 'Analisar com IA'}</button>)}</div></div>)}
                          {isNok && (
                            <>
                                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Causas (IA ou Manual)</label><input type="text" className="w-full p-2 border rounded text-sm" placeholder="Ex: Desgaste..." value={data.details?.causes || ''} onChange={(e) => handleDetailChange(item.id, 'causes', e.target.value)}/></div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-semibold text-gray-500">Medidas (IA ou Manual)</label>
                                        <button onClick={() => handleGetRecommendationText(item.id, selectedBuilding.id, selectedZone, data.details?.causes)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] border px-1 rounded bg-indigo-50"><Sparkles className="w-3 h-3"/> Pedir Solução</button>
                                    </div>
                                    <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Ex: Substituir..." value={data.details?.measures || ''} onChange={(e) => handleDetailChange(item.id, 'measures', e.target.value)}/>
                                </div>
                                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Previsão</label><input type="date" className="w-full p-2 border rounded text-sm" value={data.details?.forecast || ''} onChange={(e) => handleDetailChange(item.id, 'forecast', e.target.value)}/></div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderPlanning = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = planningTasks.filter(t => t.date === today);
    return (
      <div className="h-full flex flex-col md:flex-row bg-gray-50 relative">
        {generatedText && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600"/> {generatedTextType === 'whatsapp' ? 'Mensagem WhatsApp' : 'Email Gerado'}</h3><button onClick={() => setGeneratedText(null)}><X className="w-6 h-6 text-gray-400"/></button></div>
                  <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded border whitespace-pre-wrap text-sm font-mono text-gray-800">{generatedText}</div>
                  <div className="mt-4 flex justify-end gap-3"><button onClick={() => navigator.clipboard.writeText(generatedText)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded border bg-white"><Copy className="w-4 h-4"/> Copiar</button>{generatedTextType === 'email' && <a href={`mailto:?subject=Relatório Manutenção&body=${encodeURIComponent(generatedText)}`} className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-emerald-700"><Mail className="w-4 h-4"/> Abrir no Email</a>}</div>
              </div>
          </div>
        )}
        <div id="print-planning" className="hidden print:block absolute inset-0 bg-white z-50 p-8">
          <h1 className="text-2xl font-bold mb-4">Folha de Obra</h1>
          <table className="w-full border-collapse mb-8 text-sm"><thead><tr className="border-b-2"><th className="text-left py-2">Data</th><th className="text-left">Tarefa</th><th className="text-left">Responsável</th><th className="text-center w-20">Feito</th></tr></thead><tbody>{planningTasks.map((t, i) => (<tr key={i} className="border-b"><td className="py-3 w-24">{t.date}</td><td><div className="font-bold">{t.desc}</div>{t.recommendation && <div className="text-xs italic bg-gray-50 p-1 mt-1">{t.recommendation}</div>}</td><td>{t.assignedTo}</td><td className="border-l"></td></tr>))}</tbody></table>
        </div>
        <div className="w-full md:w-1/3 bg-white border-r flex flex-col print:hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col gap-2">
             <div className="flex gap-2"><input type="text" className="flex-1 border rounded px-2 text-sm" placeholder="Nova tarefa..." value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)} /><button onClick={handleCreateNewTask} className="bg-emerald-600 text-white p-1 rounded"><Plus className="w-5 h-5"/></button></div>
             <label className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-2 rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium"><input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileImport} disabled={isImporting} />{isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>} Importar Ficheiro (Drive/CSV)</label>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {planningTasks.map(t => (
                <div key={t.id} className="p-3 border rounded bg-white hover:bg-gray-50">
                    <div className="flex justify-between items-start"><div className="text-sm flex-1"><span className="px-1 rounded text-xs bg-gray-100">{t.cat}</span><p className="font-medium mt-1">{t.desc}</p><span className="text-xs text-gray-400">{t.date}</span></div><button onClick={() => handleRemoveTask(t.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button></div>
                    <div className="mt-2 pt-2 border-t flex gap-2"><div className="flex-1"><input type="text" className="text-xs border rounded p-1 w-full mb-1" placeholder="Nome funcionário..." value={t.assignedTo || ''} onChange={(e) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { assignedTo: e.target.value })} /></div></div>
                    <div className="mt-1 grid grid-cols-2 gap-2 relative">
                        <button onClick={() => handleEstimateTaskDetails(t)} disabled={estimatingTaskId === t.id} className="absolute -top-2 right-0 bg-indigo-50 text-indigo-600 p-1 rounded-full hover:bg-indigo-100 shadow-sm" title="IA: Calcular Tempo, Material e Medidas">{estimatingTaskId === t.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}</button>
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Duração</label><input type="text" className="w-full text-xs border rounded p-1" placeholder="Ex: 2h" defaultValue={t.duration || ''} onBlur={(e) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { duration: e.target.value })}/></div>
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Package className="w-3 h-3"/> Material</label><input type="text" className="w-full text-xs border rounded p-1" placeholder="Ex: Tinta..." defaultValue={t.materials || ''} onBlur={(e) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { materials: e.target.value })}/></div>
                        <div className="col-span-2"><label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"> Observações (Coordenação)</label><textarea className="w-full text-xs border rounded p-1" rows={1} placeholder="Atualizações..." defaultValue={t.observations || ''} onBlur={(e) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { observations: e.target.value })}/></div>
                    </div>
                </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto print:hidden flex flex-col gap-6">
          <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Planeamento & Execução</h2><div className="flex gap-2"><button onClick={handleGenerateWhatsApp} disabled={isGeneratingText} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm disabled:opacity-50">{isGeneratingText ? <Loader2 className="w-4 h-4 animate-spin"/> : <MessageSquare className="w-4 h-4" />}{isGeneratingText ? '...' : 'Gerar WhatsApp'}</button><button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Printer className="w-4 h-4"/> Imprimir</button></div></div>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex flex-col gap-4">
            <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Início</label><input type="datetime-local" className="border rounded p-2 w-full" value={planning.startDate || ''} onChange={e => updatePlanningMeta({ startDate: e.target.value })} /></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fim</label><input type="datetime-local" className="border rounded p-2 w-full" value={planning.endDate || ''} onChange={e => updatePlanningMeta({ endDate: e.target.value })} /></div></div>
            <div className="border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Equipa Responsável</label>
                <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="teamType" value="internal" checked={planning.teamType === 'internal'} onChange={() => updatePlanningMeta({ teamType: 'internal' })} /><span className="text-sm font-medium">Equipa Interna</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="teamType" value="external" checked={planning.teamType === 'external'} onChange={() => updatePlanningMeta({ teamType: 'external' })} /><span className="text-sm font-medium">Empresa Externa</span></label>
                </div>
                {planning.teamType === 'internal' ? (
                    <div><label className="block text-xs text-gray-500 mb-1">Nomes dos Trabalhadores</label><textarea className="border rounded p-2 w-full text-sm" rows={2} placeholder="Ex: João Silva, Maria Santos, Carlos..." value={planning.teamMembers || ''} onChange={e => updatePlanningMeta({ teamMembers: e.target.value })}/></div>
                ) : (
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">Nome da Empresa</label><input type="text" className="border rounded p-2 w-full text-sm" placeholder="Ex: Limpezas Madeira Lda" value={planning.companyName || ''} onChange={e => updatePlanningMeta({ companyName: e.target.value })}/></div><div><label className="block text-xs text-gray-500 mb-1">Pessoa de Contacto</label><div className="flex items-center gap-2"><Contact className="w-4 h-4 text-gray-400"/><input type="text" className="border rounded p-2 w-full text-sm" placeholder="Ex: Sr. António (Gerente)" value={planning.externalContact || ''} onChange={e => updatePlanningMeta({ externalContact: e.target.value })}/></div></div></div>
                )}
            </div>
            <div className="border-t pt-4"><label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><LinkIcon className="w-3 h-3"/> Link do Plano (Drive)</label><div className="flex gap-2"><input type="text" className="border rounded p-2 w-full text-sm" placeholder="https://docs.google.com/..." value={planning.driveLink || ''} onChange={e => updatePlanningMeta({ driveLink: e.target.value })} />{planning.driveLink && (<a href={planning.driveLink} target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 p-2 rounded border text-gray-600" title="Abrir Link"><ExternalLink className="w-5 h-5"/></a>)}</div></div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-4 z-10 relative"><div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Clock className="w-6 h-6"/></div><h3 className="text-xl font-bold text-blue-900">Tarefas do Dia ({today})</h3></div>
             {todaysTasks.length === 0 ? <div className="text-blue-400 text-sm italic py-4">Sem tarefas para hoje.</div> : (
                 <div className="grid grid-cols-1 gap-3">
                     {todaysTasks.map(t => (
                         <div key={t.id} className={`bg-white p-4 rounded-lg shadow-sm border ${t.completed ? 'border-emerald-200 bg-emerald-50' : 'border-blue-100'} flex justify-between items-center transition-all`}>
                             <div>
                                 <p className={`font-bold ${t.completed ? 'text-emerald-800 line-through' : 'text-gray-800'}`}>{t.desc}</p>
                                 <div className="flex gap-2 mt-1">
                                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block">{t.cat}</span>
                                     <div className="text-sm font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100"><User className="w-3 h-3"/> {t.assignedTo || 'Por atribuir'}</div>
                                 </div>
                                 {(t.duration || t.materials) && (
                                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                         {t.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {t.duration}</span>}
                                         {t.materials && <span className="flex items-center gap-1"><Package className="w-3 h-3"/> {t.materials}</span>}
                                    </div>
                                 )}
                             </div>
                             <div className="flex items-center gap-3">
                                 {t.completed && <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Concluído</span>}
                                 <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id, t.completed)} className="w-6 h-6 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
                             </div>
                          </div>
                     ))}
                 </div>
             )}
          </div>
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2"><ListTodo className="w-5 h-5"/> Lista Completa de Tarefas</h3>
            {planningTasks.map(t => (
                <div key={t.id} className={`p-4 border rounded ${t.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id, t.completed)} className="mt-1 w-5 h-5" />
                            <div>
                                <div className={t.completed ? 'line-through text-emerald-700' : 'font-medium'}>{t.desc} <span className="text-gray-400 text-xs font-normal ml-2">({t.date})</span></div>
                                <div className="text-sm text-indigo-600 mt-1"><User className="w-3 h-3 inline mr-1"/>{t.assignedTo || 'Por atribuir'}</div>
                                {t.recommendation && <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-200 flex items-start gap-2"><Info className="w-4 h-4 text-indigo-500 flex-shrink-0" /><span>{t.recommendation}</span></div>}
                                
                                {/* AQUI: Mostrar Observações dos Trabalhadores para a Coordenação */}
                                {t.observations && (
                                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                                    <strong className="flex items-center gap-1 mb-1 text-yellow-700 uppercase text-xs"><Clock className="w-3 h-3"/> Ponto de Situação (Obra):</strong>
                                    <div className="whitespace-pre-wrap font-mono text-xs">{t.observations}</div>
                                  </div>
                                )}

                                {(t.duration || t.materials) && (
                                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                         {t.duration && <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><Clock className="w-3 h-3"/> {t.duration}</span>}
                                         {t.materials && <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><Package className="w-3 h-3"/> {t.materials}</span>}
                                    </div>
                                 )}
                            </div>
                        </div>
                        <button onClick={() => handleRemoveTask(t.id)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500"/></button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const filteredAnomalies = Object.entries(auditData).filter(([, v]) => v.status === 'nok' && filterByPeriod(v.date)).map(([k, v]) => ({ ...v, ...{ building: BUILDINGS_DATA.find(b => b.id === k.split('-')[0]), zone: k.split('-')[1], item: CHECKLIST_ITEMS.find(i => i.id === k.split('-')[2]) } }));
    const filteredTasks = planningTasks.filter(t => t.completed && filterByPeriod(t.date));
    return (
      <div className="max-w-6xl mx-auto p-8 bg-white min-h-screen relative">
        {signingRole && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded shadow-xl"><canvas ref={canvasRef} width={460} height={200} className="border border-dashed bg-gray-50" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} /><div className="flex justify-between mt-4"><button onClick={clearSignature} className="px-4 py-2 bg-gray-100 rounded">Limpar</button><button onClick={saveSignature} className="px-4 py-2 bg-emerald-600 text-white rounded">Guardar</button></div></div></div>}
        <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 mb-8">
          <div><h1 className="text-3xl font-bold uppercase">Relatório</h1><div className="mt-2 flex items-center gap-4 print:hidden"><select value={reportType} onChange={e => setReportType(e.target.value)} className="border rounded p-1 text-sm"><option value="daily">Diário</option><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="annual">Anual</option></select><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="border rounded p-1 text-sm"/></div><p className="text-emerald-700 font-semibold mt-2">{getPeriodLabel()}</p></div>
          <div className="flex gap-2">
              <button onClick={() => handleGenerateReportEmail(filteredAnomalies, filteredTasks)} disabled={isGeneratingText} className="print:hidden bg-indigo-600 text-white px-4 py-2 rounded flex gap-2 items-center hover:bg-indigo-700">{isGeneratingText ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>} Gerar Email</button>
              <button onClick={() => handleExportToSheets(filteredTasks)} className="print:hidden bg-green-600 text-white px-4 py-2 rounded flex gap-2 items-center hover:bg-green-700"><FileSpreadsheet className="w-4 h-4"/> Exportar Sheets</button>
              <button onClick={handlePrint} className="print:hidden bg-emerald-600 text-white px-4 py-2 rounded flex gap-2 items-center hover:bg-emerald-700"><Printer className="w-4 h-4"/> Imprimir</button>
          </div>
        </div>
        <section className="mb-8 bg-indigo-50 p-6 rounded-lg border border-indigo-100 print:bg-white print:border-gray-200"><div className="flex justify-between items-start mb-2"><h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><Sparkles className="w-5 h-5"/> Resumo Executivo (IA)</h2><button onClick={() => handleGenerateReportSummary(filteredAnomalies, filteredTasks)} disabled={isGeneratingSummary} className="print:hidden text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">{isGeneratingSummary ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}{isGeneratingSummary ? 'A Gerar...' : 'Gerar Resumo'}</button></div><p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-line">{reportSummary || "Clique em 'Gerar Resumo' para que a IA analise os dados deste período."}</p></section>
        <section className="mb-10"><h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5"/> Anomalias Detetadas ({filteredAnomalies.length})</h2><table className="w-full text-sm border-collapse"><thead className="bg-gray-100"><tr><th className="p-2 border text-left">Data</th><th className="p-2 border text-left">Local</th><th className="p-2 border text-left">Problema</th><th className="p-2 border text-left">Medidas</th><th className="p-2 border text-center">Foto</th></tr></thead><tbody>{filteredAnomalies.length === 0 ? <tr><td colSpan="5" className="p-4 text-center text-gray-500 italic">Sem anomalias.</td></tr> : filteredAnomalies.map((e, i) => (<tr key={i} className="border-b"><td className="p-2 border font-medium text-xs">{e.date}</td><td className="p-2 border"><strong>{e.building?.name}</strong><br/>{e.zone}</td><td className="p-2 border">{e.item?.label} <br/> <span className="text-xs text-gray-500">{e.details?.causes}</span></td><td className="p-2 border">{e.details?.measures}</td><td className="p-2 border text-center">{e.photo ? <img src={e.photo} className="h-12 w-12 object-cover mx-auto rounded border"/> : '-'}</td></tr>))}</tbody></table></section>
        <section className="mb-10"><h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-5 h-5"/> Trabalhos Concluídos ({filteredTasks.length})</h2>
        <table className="w-full text-sm border-collapse"><thead className="bg-gray-100"><tr><th className="p-2 border text-left">Data</th><th className="p-2 border text-left">Tarefa</th><th className="p-2 border text-left">Executado Por</th><th className="p-2 border text-left">Tempo</th><th className="p-2 border text-left">Observações</th><th className="p-2 border text-center">Foto</th></tr></thead><tbody>{filteredTasks.length === 0 ? <tr><td colSpan="6" className="p-4 text-center text-gray-500 italic">Sem tarefas concluídas.</td></tr> : filteredTasks.map((t, i) => (<tr key={i} className="border-b"><td className="p-2 border text-xs">{t.date}</td><td className="p-2 border font-medium">{t.desc}</td><td className="p-2 border text-gray-600">{t.completedBy || t.assignedTo}</td><td className="p-2 border">{t.duration || '-'}</td><td className="p-2 border text-xs italic">{t.observations} {t.workerObservations}</td><td className="p-2 border text-center">{t.completionPhoto ? <img src={t.completionPhoto} className="h-12 w-12 object-cover mx-auto rounded border"/> : '-'}</td></tr>))}</tbody></table></section>
        <div className="mt-16 grid grid-cols-2 gap-20"><div className="text-center">{signatures.responsible ? <img src={signatures.responsible} className="h-24 mx-auto object-contain" /> : <button onClick={() => setSigningRole('responsible')} className="print:hidden border px-3 py-1 rounded text-sm mb-4">Assinar</button>}<div className="border-t border-black pt-2 text-sm font-bold">Responsável Manutenção</div></div><div className="text-center">{signatures.client ? <img src={signatures.client} className="h-24 mx-auto object-contain" /> : <button onClick={() => setSigningRole('client')} className="print:hidden border px-3 py-1 rounded text-sm mb-4">Assinar</button>}<div className="border-t border-black pt-2 text-sm font-bold">Administração</div></div></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 h-screen">
      <style>{`@media print { header, nav, aside, .print\\:hidden, .chat-widget { display: none !important; } #print-planning, #print-planning * { visibility: visible; } }`}</style>
      <div className="bg-white border-b px-4 pt-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-800 mb-4"><ClipboardCheck className="w-6 h-6"/> Manutenção App 3.13 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Powered</span></div>
        <div className="flex gap-6">{['inspection','planning','report'].map(v => <button key={v} onClick={() => setCurrentView(v)} className={`pb-3 px-2 border-b-2 capitalize ${currentView===v?'border-emerald-500 text-emerald-600':'border-transparent'}`}>{v === 'inspection' ? 'Vistoria' : v === 'planning' ? 'Planeamento' : 'Relatório'}</button>)}</div>
        <button onClick={onLogout} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><LogOut className="w-5 h-5 text-gray-600"/></button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'inspection' && renderInspection()}
        {currentView === 'planning' && renderPlanning()}
        {currentView === 'report' && <div className="h-full overflow-y-auto">{renderReport()}</div>}
      </div>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 chat-widget print:hidden">
        {isChatOpen && (<div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 h-96 flex flex-col animate-in fade-in slide-in-from-bottom-4"><div className="bg-indigo-600 text-white p-3 rounded-t-xl flex justify-between items-center"><span className="font-bold flex items-center gap-2"><Bot className="w-5 h-5"/> Assistente Técnico</span><button onClick={() => setIsChatOpen(false)}><X className="w-4 h-4 hover:text-indigo-200"/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">{chatMessages.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'}`}>{msg.text}</div></div>)}{isChatLoading && <div className="flex justify-start"><div className="bg-white border p-3 rounded-lg"><Loader2 className="w-4 h-4 animate-spin text-indigo-600"/></div></div>}<div ref={chatEndRef}></div></div><form onSubmit={handleChatSubmit} className="p-3 border-t bg-white rounded-b-xl flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Dúvida técnica..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /><button type="submit" disabled={isChatLoading} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Send className="w-4 h-4"/></button></form></div>)}<button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105">{isChatOpen ? <X className="w-6 h-6"/> : <MessageSquare className="w-6 h-6"/>}</button>
      </div>
    </div>
  );
}

// === MONTAGEM DO APP (MODO AUTOMÁTICO) ===
// A inicialização manual com ReactDOM foi removida para evitar conflitos com React 18.
// O sistema de build injeta a raiz automaticamente.
export { App };
