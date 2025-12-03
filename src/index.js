import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ClipboardCheck, Building2, MapPin, CheckCircle2, XCircle, 
  LayoutDashboard, ChevronRight, ChevronDown, Droplets, Lightbulb, 
  DoorOpen, Wifi, AlertTriangle, Hammer, Footprints, Home, 
  TreePine, PaintBucket, Wrench, Plus, UploadCloud, X, Lock, LogOut,
  Sparkles, Loader2, Send, MessageSquare, Bot
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, deleteDoc, updateDoc, doc, query, setDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO ---
// Se não tiver chaves reais, o sistema usa o modo "demo" para não bloquear a compilação.
const firebaseConfig = { apiKey: "demo", projectId: "demo" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DADOS ---
const CHECKLIST_ITEMS = [
  { id: 'limpeza', label: 'Limpeza Geral', category: 'Limpeza', icon: <ClipboardCheck size={16} /> },
  { id: 'vidros', label: 'Vidros', category: 'Limpeza', icon: <ClipboardCheck size={16} /> },
  { id: 'luz', label: 'Iluminação', category: 'Elétrica', icon: <Lightbulb size={16} /> },
  { id: 'agua', label: 'Torneiras/Duches', category: 'Canalização', icon: <Droplets size={16} /> },
  { id: 'portas', label: 'Portas/Fechaduras', category: 'Civil', icon: <DoorOpen size={16} /> },
  { id: 'piso', label: 'Piso', category: 'Civil', icon: <Footprints size={16} /> },
  { id: 'paredes', label: 'Paredes/Pintura', category: 'Civil', icon: <PaintBucket size={16} /> },
  { id: 'ext', label: 'Exterior/Relva', category: 'Ext', icon: <TreePine size={16} /> },
];

const BUILDINGS = [
  { id: 'pavilhao', name: 'Pavilhão', floors: [{id:'p0', name:'Piso 0', zones:['Entrada','WC','Balneários']}] },
  { id: 'campo', name: 'Campo Futebol', floors: [{id:'c0', name:'Piso 0', zones:['Bancada','Relvado']}] },
  { id: 'sede', name: 'Sede Social', floors: [{id:'s0', name:'Piso 0', zones:['Secretaria','Sala Reunião']}] }
];

// --- COMPONENTES ---

function Login({ onRole }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  if (showPin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4 font-sans">
        <div className="bg-white p-8 rounded-xl w-full max-w-sm text-center shadow-2xl">
          <Lock className="w-12 h-12 mx-auto mb-4 text-emerald-600"/>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Acesso Coordenação</h2>
          <p className="text-gray-500 mb-6">Insira o código PIN (1234)</p>
          <input 
            type="password" 
            value={pin} 
            onChange={e=>setPin(e.target.value)} 
            className="text-center text-3xl border-b-2 border-emerald-200 w-full mb-8 p-2 focus:outline-none focus:border-emerald-600 font-mono" 
            maxLength={4} 
            autoFocus
          />
          <button onClick={() => pin === '1234' ? onRole('admin') : alert('Código incorreto!')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold mb-4 transition-all">Entrar</button>
          <button onClick={() => setShowPin(false)} className="text-gray-400 text-sm hover:text-gray-600">Voltar</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-emerald-900 to-gray-900 text-white p-6 font-sans">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
          <ClipboardCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Manutenção App</h1>
        <p className="text-emerald-200/80">Gestão de Obras & Vistorias</p>
      </div>
      
      <div className="w-full max-w-sm space-y-4">
        <button onClick={() => setShowPin(true)} className="bg-white text-gray-900 p-6 rounded-2xl w-full flex items-center justify-between hover:bg-gray-50 transition-all shadow-lg group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl"><LayoutDashboard className="w-6 h-6 text-indigo-700"/></div>
            <div className="text-left"><span className="block font-bold text-lg">Coordenação</span><span className="text-sm text-gray-500">Gestão e Relatórios</span></div>
          </div>
          <ChevronRight className="text-gray-400"/>
        </button>

        <button onClick={() => onRole('worker')} className="bg-white/10 backdrop-blur-md border border-white/10 text-white p-6 rounded-2xl w-full flex items-center justify-between hover:bg-white/20 transition-all shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl"><Hammer className="w-6 h-6 text-emerald-400"/></div>
            <div className="text-left"><span className="block font-bold text-lg">Equipa Técnica</span><span className="text-sm text-emerald-200/70">Registar Trabalho</span></div>
          </div>
          <ChevronRight className="text-white/50"/>
        </button>
      </div>
      <p className="mt-12 text-xs text-white/20">v3.5 System Online</p>
    </div>
  );
}

function AdminView({ onExit, user }) {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, 'tasks'));
    const unsub = onSnapshot(q, snap => setTasks(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => unsub();
  }, [user]);

  const addTask = async () => {
    if(!taskInput) return;
    try { await addDoc(collection(db, 'tasks'), { desc: taskInput, completed: false, date: new Date().toISOString() }); setTaskInput(''); } catch(e) { console.error(e); }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white p-4 border-b flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h2 className="font-bold text-xl text-emerald-900 flex gap-2 items-center"><LayoutDashboard className="text-emerald-600"/> Painel de Gestão</h2>
        <button onClick={onExit} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><LogOut size={20} className="text-gray-600"/></button>
      </header>
      <div className="p-6 flex-1 overflow-y-auto max-w-3xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-3 flex gap-2 items-center"><Plus className="w-5 h-5 text-emerald-600"/> Nova Tarefa</h3>
          <div className="flex gap-3">
            <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} className="border-2 border-gray-200 p-3 rounded-xl flex-1 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Descreva a tarefa..." />
            <button onClick={addTask} className="bg-emerald-600 text-white px-6 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Adicionar</button>
          </div>
        </div>
        
        <h3 className="font-bold text-gray-500 uppercase text-sm mb-4 tracking-wider">Tarefas em Curso</h3>
        <div className="space-y-3">
           {tasks.map(t => (
             <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
               <span className={t.completed ? "text-gray-400 line-through" : "text-gray-800 font-medium"}>{t.desc}</span>
               {t.completed ? <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 size={16}/> Feito</div> : <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">Pendente</span>}
             </div>
           ))}
           {tasks.length === 0 && <div className="text-center text-gray-400 py-10 italic">Nenhuma tarefa registada.</div>}
        </div>
      </div>
    </div>
  );
}

function WorkerView({ onExit, user }) {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, 'tasks'));
    const unsub = onSnapshot(q, snap => setTasks(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => unsub();
  }, [user]);

  const toggle = async (id, status) => {
    await updateDoc(doc(db, 'tasks', id), { completed: !status });
  };

  if (!name) return (
    <div className="h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Hammer className="w-8 h-8 text-emerald-600"/>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Área Técnica</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">Identifique-se para começar</p>
        <input value={name} onChange={e=>setName(e.target.value)} className="border-2 border-gray-200 w-full p-4 mb-4 rounded-xl focus:outline-none focus:border-emerald-500 text-lg" placeholder="O seu nome..." />
        <button onClick={()=>name && localStorage.setItem('worker', name)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full p-4 rounded-xl font-bold text-lg transition-colors">Entrar</button>
        <button onClick={onExit} className="mt-4 w-full text-gray-400 text-sm hover:text-gray-600">Cancelar</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white p-5 border-b flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-2xl text-gray-800">{name}</h2>
          <div className="flex items-center gap-2 mt-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-xs text-emerald-600 font-bold uppercase">Online</span></div>
        </div>
        <button onClick={()=>{setName(''); onExit();}} className="bg-gray-100 p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
      </header>
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        <h3 className="font-bold text-gray-500 uppercase text-sm tracking-wider ml-1">As tuas tarefas de hoje</h3>
        {tasks.map(t => (
          <div key={t.id} className={`p-5 rounded-2xl border shadow-sm flex justify-between items-center transition-all ${t.completed ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-emerald-100 ring-1 ring-emerald-50'}`}>
            <span className={t.completed ? "line-through text-gray-400 font-medium" : "font-bold text-gray-800 text-lg"}>{t.desc}</span>
            <button onClick={()=>toggle(t.id, t.completed)} className={`p-4 rounded-xl transition-all flex items-center gap-2 font-bold ${t.completed ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95'}`}>
              {t.completed ? <X size={20}/> : <CheckCircle2 size={24}/>}
            </button>
          </div>
        ))}
        {tasks.length === 0 && <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-gray-300 text-gray-400">Sem tarefas pendentes. Bom trabalho!</div>}
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    onAuthStateChanged(auth, setUser);
  }, []);

  if (!role) return <LoginScreen onRole={setRole} />;
  return role === 'admin' ? <AdminView onExit={()=>setRole(null)} user={user}/> : <WorkerView onExit={()=>setRole(null)} user={user}/>;
}

// === MONTAGEM ===
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
