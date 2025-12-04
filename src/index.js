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

// --- CONFIGURAÇÃO GEMINI API (COLOQUE A SUA CHAVE AQUI) ---
const apiKey = "AIzaSyDxRorFcJNEUkfUlei5qx6A91IGuUekcvE";

// --- FUNÇÕES DE IA ---
async function callGeminiVision(base64Image, prompt) {
  if (!apiKey) { alert("Falta a API Key do Gemini no código!"); return null; }
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
  if (!apiKey) { alert("Falta a API Key do Gemini!"); return null; }
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

// === ADMIN APP (Lógica Principal) ===
function AdminApp({ onLogout, user }) {
  const [currentView, setCurrentView] = useState('inspection'); 
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]); 
  const [auditData, setAuditData] = useState({});
  const [analyzingItem, setAnalyzingItem] = useState(null);
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false);

  // Funções de Vistoria
  const getAuditKey = (bid, zone, iid) => `${bid}-${zone}-${iid}`;
  
  const handleCheck = (iid, s) => { 
    if (selectedBuilding && selectedZone) {
      setAuditData(p => ({ 
        ...p, 
        [getAuditKey(selectedBuilding.id, selectedZone, iid)]: { 
          ...p[getAuditKey(selectedBuilding.id, selectedZone, iid)], 
          status: s, 
          date: inspectionDate, 
          details: s === 'nok' ? { causes: '', measures: '', forecast: '' } : null 
        } 
      })); 
    }
  };

  const handleDetailChange = (iid, field, value) => {
    const key = getAuditKey(selectedBuilding.id, selectedZone, iid);
    setAuditData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        details: {
          ...prev[key].details,
          [field]: value
        }
      }
    }));
  };

  // --- FUNÇÃO: Analisar Foto com IA ---
  const handleAnalyzePhoto = async (itemId) => {
    const key = getAuditKey(selectedBuilding.id, selectedZone, itemId);
    const photoUrl = auditData[key]?.photo;
    if (!photoUrl) { alert("Primeiro tire uma foto!"); return; }
    
    setAnalyzingItem(itemId);
    // Simulação de envio de imagem (Converter URL blob para base64 seria necessário num ambiente real)
    // Aqui usamos um prompt de texto para testar a lógica
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Analisa este problema de manutenção: ${itemLabel}. Quais as causas prováveis e solução? Responde em JSON: {"causes": "...", "measures": "..."}`;
    
    // Chamada à IA
    const resultText = await callGeminiText(prompt);
    
    if (resultText) {
      try {
        const cleanJson = resultText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);
        // Atualiza os campos automaticamente
        handleDetailChange(itemId, 'causes', result.causes);
        handleDetailChange(itemId, 'measures', result.measures);
      } catch (e) {
        handleDetailChange(itemId, 'causes', "Erro ao processar IA. Tente manualmente.");
      }
    }
    setAnalyzingItem(null);
  };

  // --- FUNÇÃO: Pedir Recomendação (Botão Mágico) ---
  const handleGetRecommendationText = async (itemId, causeText) => {
    if (!causeText) { alert("Escreva a causa primeiro ou use a IA para analisar."); return; }
    setIsGettingRecommendation(true);
    const itemLabel = CHECKLIST_ITEMS.find(i => i.id === itemId)?.label;
    const prompt = `Como reparar "${itemLabel}" com o problema: "${causeText}"? Responde curto.`;
    
    const recommendation = await callGeminiText(prompt);
    if (recommendation) {
      handleDetailChange(itemId, 'measures', recommendation);
    }
    setIsGettingRecommendation(false);
  };

  const handlePhotoUpload = (iid, e) => { 
    const f = e.target.files[0]; 
    if (f) setAuditData(p => ({ ...p, [getAuditKey(selectedBuilding.id, selectedZone, iid)]: { ...p[getAuditKey(selectedBuilding.id, selectedZone, iid)], photo: URL.createObjectURL(f) } })) 
  };

  const renderInspection = () => {
    if (!selectedBuilding) return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vistorias</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {BUILDINGS_DATA.map((b) => (
            <button key={b.id} onClick={() => setSelectedBuilding(b)} className="bg-white p-6 rounded-xl shadow border hover:bg-emerald-50 flex items-center gap-4 transition-all">
              <div className="p-4 bg-emerald-100 rounded-full"><Building2 className="w-8 h-8 text-emerald-700" /></div>
              <span className="font-bold text-lg text-gray-700">{b.name}</span>
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 border-b flex justify-between items-center">
          <button onClick={() => setSelectedBuilding(null)} className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1">&larr; Voltar</button>
          <h2 className="font-bold text-lg">{selectedBuilding.name}</h2>
          <div></div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-white border-r overflow-y-auto hidden md:block">
            {selectedBuilding.floors.map(f => (
              <div key={f.id} className="mb-2">
                <button onClick={() => setSelectedFloor(f.id === selectedFloor?.id ? null : f)} className="w-full text-left px-4 py-3 font-bold hover:bg-gray-50 flex justify-between">{f.name} <ChevronDown size={16}/></button>
                {selectedFloor?.id === f.id && <div className="bg-gray-50">{f.zones.map(z => <button key={z} onClick={() => setSelectedZone(z)} className={`w-full text-left px-8 py-2 text-sm ${selectedZone === z ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-gray-100'}`}>{z}</button>)}</div>}
              </div>
            ))}
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">
            {!selectedZone ? <div className="flex flex-col items-center justify-center h-full text-gray-400"><MapPin size={48} /><p>Selecione uma zona à esquerda.</p></div> : (
              <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">{selectedZone}</h2>
                {CHECKLIST_ITEMS.map((item) => {
                  const key = getAuditKey(selectedBuilding.id, selectedZone, item.id);
                  const data = auditData[key] || {};
                  const isNok = data.status === 'nok';
                  
                  return (
                    <div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${isNok ? 'border-red-200 ring-1 ring-red-100' : 'hover:border-emerald-200'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isNok ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCheck(item.id, 'ok')} className={`px-3 py-1 rounded text-sm font-bold border ${data.status === 'ok' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-400'}`}>OK</button>
                          <button onClick={() => handleCheck(item.id, 'nok')} className={`px-3 py-1 rounded text-sm font-bold border ${data.status === 'nok' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-400'}`}>Erro</button>
                        </div>
                      </div>

                      {/* ÁREA DE DETALHES DO ERRO (COM IA) */}
                      {isNok && (
                        <div className="mt-4 pt-4 border-t border-red-50 grid gap-4 animate-in fade-in">
                          
                          {/* FOTO E ANÁLISE */}
                          <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                            <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-800">
                              <Camera size={18}/> {data.photo ? "Alterar Foto" : "Adicionar Foto"}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(item.id, e)} />
                            </label>
                            {data.photo && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Foto carregada</span>}
                            
                            {/* BOTÃO IA 1: Analisar Foto */}
                            <button 
                              onClick={() => handleAnalyzePhoto(item.id)} 
                              disabled={analyzingItem === item.id}
                              className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2 hover:bg-indigo-200"
                            >
                              {analyzingItem === item.id ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                              {analyzingItem === item.id ? "A Analisar..." : "IA: Analisar Foto"}
                            </button>
                          </div>

                          {/* CAMPOS DE TEXTO */}
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Causas</label>
                            <input 
                              type="text" 
                              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
                              placeholder="Descreva o problema..." 
                              value={data.details?.causes || ''} 
                              onChange={(e) => handleDetailChange(item.id, 'causes', e.target.value)}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-gray-500 uppercase">Medidas de Reparação</label>
                              
                              {/* BOTÃO IA 2: Pedir Solução */}
                              <button 
                                onClick={() => handleGetRecommendationText(item.id, data.details?.causes)}
                                disabled={isGettingRecommendation}
                                className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                              >
                                <Sparkles size={12}/> {isGettingRecommendation ? "A pensar..." : "IA: Pedir Solução"}
                              </button>
                            </div>
                            <textarea 
                              className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
                              rows={2}
                              placeholder="O que deve ser feito?" 
                              value={data.details?.measures || ''} 
                              onChange={(e) => handleDetailChange(item.id, 'measures', e.target.value)}
                            />
                          </div>
                          
                          {/* PREVISÃO DE DURAÇÃO */}
                          <div className="flex gap-4">
                             <div className="flex-1">
                               <label className="text-xs font-bold text-gray-500 uppercase">Previsão</label>
                               <input type="date" className="w-full border p-2 rounded mt-1" value={data.details?.forecast || ''} onChange={(e) => handleDetailChange(item.id, 'forecast', e.target.value)}/>
                             </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-800 h-screen">
      <div className="bg-white border-b px-4 py-3 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-800"><ClipboardCheck className="w-6 h-6"/> App Manutenção</div>
        <button onClick={onLogout}><LogOut size={20} className="text-gray-500 hover:text-red-500"/></button>
      </div>
      <div className="flex-1 overflow-hidden">
        {renderInspection()}
      </div>
    </div>
  );
}

// === TELA DE LOGIN & PONTO DE ENTRADA ===
function App() {
  const [role, setRole] = useState(null); 
  const [user, setUser] = useState(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    onAuthStateChanged(auth, setUser);
  }, []);

  if (!role) {
    return (
      <div className="h-screen bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center w-full max-w-sm">
          <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20"><ClipboardCheck size={40} className="text-emerald-400"/></div>
          <h1 className="text-3xl font-bold text-white mb-8">Complexo CSM</h1>
          <button onClick={() => setRole('admin')} className="bg-white text-gray-900 w-full p-5 rounded-2xl flex items-center justify-between mb-4 font-bold text-lg hover:scale-105 transition-transform shadow-lg"><div className="flex items-center gap-3"><LayoutDashboard className="text-indigo-600"/> Coordenação</div><ChevronRight className="text-gray-400"/></button>
          <button onClick={() => setRole('worker')} className="bg-white/10 backdrop-blur border border-white/20 text-white w-full p-5 rounded-2xl flex items-center justify-between font-bold text-lg hover:bg-white/20 transition-all"><div className="flex items-center gap-3"><Hammer className="text-emerald-400"/> Equipa Técnica</div><ChevronRight className="text-white/50"/></button>
        </div>
      </div>
    );
  }

  if (role === 'admin') return <AdminApp onLogout={() => setRole(null)} user={user} />;
  return <div className="p-10 text-center">Área Técnica (Em construção...) <br/><button onClick={() => setRole(null)} className="mt-4 text-blue-500 underline">Voltar</button></div>;
}

// MONTAGEM
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
