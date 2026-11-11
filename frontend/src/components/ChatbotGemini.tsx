import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, X, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';

type Mensagem = { id: number; origem: 'usuario' | 'assistente'; texto: string };

const BOAS_VINDAS = 'Olá! Sou o EasyVacc Assistente. Posso ajudar com dúvidas sobre o EasyVacc e informações gerais sobre vacinação. Não compartilhe CPF, CNS ou dados de saúde pessoais aqui.';
const MAX_MENSAGENS_SESSAO = 15; // Limite de interface, não substitui controle no servidor.

export default function ChatbotGemini() {
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem('easyvacc-tema') === 'claro');
  useEffect(() => {
    const atualizar = () => setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    window.addEventListener('easyvacc-tema-atualizado', atualizar);
    window.addEventListener('easyvaccTemaAtualizado', atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.removeEventListener('easyvacc-tema-atualizado', atualizar);
      window.removeEventListener('easyvaccTemaAtualizado', atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ id: 0, origem: 'assistente', texto: BOAS_VINDAS }]);
  const [enviando, setEnviando] = useState(false);
  const [totalEnviadas, setTotalEnviadas] = useState(0);
  const proximoId = useRef(1);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [aberto, mensagens, enviando]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || enviando || totalEnviadas >= MAX_MENSAGENS_SESSAO) return;
    if (pergunta.length > 1000) return;
    setTexto('');
    setMensagens((lista) => [...lista, { id: proximoId.current++, origem: 'usuario', texto: pergunta }]);
    setEnviando(true);
    setTotalEnviadas((n) => n + 1);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sua sessão expirou. Entre novamente no EasyVacc.');
      const { data, error } = await supabase.functions.invoke('chatbot-gemini', {
        body: { mensagem: pergunta },
      });
      if (error) {
        let aviso = 'Não foi possível conversar agora. Tente novamente mais tarde.';
        const contexto = (error as { context?: Response }).context;
        if (contexto && typeof contexto.json === 'function') {
          const corpo = await contexto.json().catch(() => null);
          if (typeof corpo?.erro === 'string') aviso = corpo.erro;
        }
        throw new Error(aviso);
      }
      if (typeof data?.resposta !== 'string' || !data.resposta.trim()) {
        throw new Error(typeof data?.erro === 'string' ? data.erro : 'O assistente não retornou uma resposta.');
      }
      setMensagens((lista) => [...lista, { id: proximoId.current++, origem: 'assistente', texto: data.resposta.trim() }]);
    } catch (erro) {
      setMensagens((lista) => [...lista, {
        id: proximoId.current++, origem: 'assistente',
        texto: erro instanceof Error ? erro.message : 'Ocorreu um erro ao enviar sua pergunta.',
      }]);
    } finally {
      setEnviando(false);
    }
  }

  return createPortal(
    <div className="fixed bottom-28 right-4 z-[9999] sm:bottom-6 sm:right-6" aria-label="EasyVacc Assistente">
      {aberto && (
        <section role="dialog" aria-label="Conversa com EasyVacc Assistente"
          className={`mb-3 flex h-[min(65vh,520px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border shadow-2xl ${temaClaro ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-[#081629] text-slate-100'}`}>
          <header className="flex items-center gap-3 bg-[#126ca8] px-4 py-3 text-white">
            <Bot size={23} aria-hidden="true" />
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">EasyVacc Assistente</p><p className="text-xs text-blue-100">Orientações com IA</p></div>
            <button type="button" aria-label="Limpar conversa" title="Limpar conversa" onClick={() => { setMensagens([{ id: proximoId.current++, origem: 'assistente', texto: BOAS_VINDAS }]); setTexto(''); }} className="rounded-lg p-2 hover:bg-white/15"><Trash2 size={17} /></button>
            <button type="button" aria-label="Fechar assistente" onClick={() => setAberto(false)} className="rounded-lg p-2 hover:bg-white/15"><X size={19} /></button>
          </header>
          <div className={`flex-1 space-y-3 overflow-y-auto p-4 ${temaClaro ? 'bg-slate-50' : 'bg-[#071323]'}`} aria-live="polite" aria-relevant="additions text">
            {mensagens.map((m) => <div key={m.id} className={`flex ${m.origem === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.origem === 'usuario' ? 'bg-[#126ca8] text-white' : (temaClaro ? 'border border-slate-200 bg-white text-slate-800' : 'border border-slate-700 bg-slate-800 text-slate-100')}`}>{m.origem === 'assistente' ? (
                <div className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-bold">
                  <ReactMarkdown>{m.texto}</ReactMarkdown>
                </div>
              ) : m.texto}</div>
            </div>)}
            {enviando && <div className={`flex items-center gap-2 text-xs ${temaClaro ? 'text-slate-500' : 'text-slate-300'}`}><Loader2 className="animate-spin" size={15} /> Respondendo...</div>}
            <div ref={fimRef} />
          </div>
          <form onSubmit={enviar} className={`flex items-end gap-2 border-t p-3 ${temaClaro ? 'border-slate-200' : 'border-slate-700'}`}>
            <label className="sr-only" htmlFor="easyvacc-pergunta">Sua pergunta</label>
            <textarea id="easyvacc-pergunta" rows={2} maxLength={1000} value={texto} disabled={enviando || totalEnviadas >= MAX_MENSAGENS_SESSAO}
              onChange={(e) => setTexto(e.target.value)} placeholder={totalEnviadas >= MAX_MENSAGENS_SESSAO ? 'Limite desta sessão atingido' : 'Digite sua pergunta...'}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
              className={`min-h-11 max-h-24 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#126ca8] ${temaClaro ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500' : 'border-slate-600 bg-slate-900 text-white placeholder:text-slate-400'}`} />
            <button type="submit" disabled={!texto.trim() || enviando || totalEnviadas >= MAX_MENSAGENS_SESSAO} aria-label="Enviar pergunta" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#126ca8] text-white transition hover:bg-[#0e5687] disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} /></button>
          </form>
          <p className={`px-3 pb-2 text-center text-[10px] ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>IA pode errar. Confirme informações de saúde em fontes oficiais.</p>
        </section>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-label={aberto ? 'Fechar EasyVacc Assistente' : 'Abrir EasyVacc Assistente'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#126ca8] text-white shadow-xl ring-4 ring-white/20 transition hover:scale-105 hover:bg-[#0e5687] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
          {aberto ? <X size={24} /> : <MessageCircle size={26} />}
        </button>
      </div>
    </div>,
    document.body
  );
}
