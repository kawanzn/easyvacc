import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Background Decorativo HealthTech (Gradientes Suaves) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-[#00a884]/20 to-cyan-500/10 blur-3xl" />
      </div>

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Oficial */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="EasyVacc Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-white">
              Easy<span className="text-[#00a884]">Vacc</span>
            </span>
          </Link>

          {/* Navegação / Ações */}
          <div className="flex items-center gap-6">
            <a
              href="#como-funciona"
              className="hidden text-xs font-medium text-slate-400 transition-colors hover:text-white sm:block"
            >
              Como Funciona
            </a>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-[#00a884]/20 transition-all hover:bg-[#00c49a]"
            >
              Acessar Caderneta
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              
              {/* Lado Esquerdo: Chamada Principal */}
              <div className="space-y-6 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
                  <Sparkles size={13} />
                  <span>Plataforma Digital de Saúde Vacinal</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.15]">
                  Seu histórico vacinal na <span className="bg-gradient-to-r from-[#00a884] to-cyan-400 bg-clip-text text-transparent">palma da mão.</span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                  Acompanhe imunizações, gerencie os registros da sua família e tenha comprovantes válidos sempre disponíveis de forma prática e segura.
                </p>

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#00a884] to-teal-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-[#00a884]/25 transition-all hover:brightness-110"
                  >
                    Entrar com CPF
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Métricas / Badges de Confiança */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-6">
                  <div>
                    <p className="text-xl font-bold text-white">100%</p>
                    <p className="text-xs text-slate-400">Digital & Sem papel</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Seguro</p>
                    <p className="text-xs text-slate-400">Validação via QR Code</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Familiar</p>
                    <p className="text-xs text-slate-400">Gestão de dependentes</p>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Preview Interativo do Cartão Vacinal */}
              <div className="lg:col-span-6">
                <div className="relative mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
                  
                  {/* Topo do Cartão de Prévia */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 border border-[#00a884]/30">
                        <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">CADERNETA DIGITAL</p>
                        <p className="text-sm font-bold text-white">João Victor Gentil</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-[#00a884] border border-emerald-500/20">
                      <CheckCircle2 size={12} /> Atualizado
                    </span>
                  </div>

                  {/* Lista de Doses em Destaque */}
                  <div className="mt-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Últimas Aplicações
                    </p>

                    {/* Vacina 1 */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-[#00a884]">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Influenza Tetravalente</p>
                          <p className="text-[10px] text-slate-400">Aplicada em 12/04/2026 • Dose Única</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">Concluída</span>
                    </div>

                    {/* Vacina 2 */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-[#00a884]">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Covid-19 Bivalente</p>
                          <p className="text-[10px] text-slate-400">Aplicada em 18/01/2026 • Reforço</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">Concluída</span>
                    </div>

                    {/* Vacina Futura */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/30 p-3 opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Tétano / dTPa</p>
                          <p className="text-[10px] text-slate-500">Próxima dose prevista para Nov/2026</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-400">Pendente</span>
                    </div>
                  </div>

                  {/* Rodapé da Prévia com QR Code fictício */}
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <div className="flex items-center gap-2">
                      <QrCode size={24} className="text-[#00a884]" />
                      <div className="text-left">
                        <p className="text-[10px] font-semibold text-white">Validação Oficial</p>
                        <p className="text-[9px] text-slate-500">Código verificável via leitor</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">EV-8942-2026</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= SEÇÃO BENTO GRID (RECURSOS DO SISTEMA) ================= */}
        <section id="como-funciona" className="border-t border-slate-800/80 bg-slate-900/40 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00a884]">
                Funcionalidades do Sistema
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Tudo o que você precisa para o seu controle vacinal
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              
              {/* Card 1 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 text-[#00a884]">
                  <FileCheck size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Histórico Unificado</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Consulte doses registradas, lotes e estabelecimentos de vacinação em uma linha do tempo clara.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 text-[#00a884]">
                  <Users size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Painel da Família</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Adicione e acompanhe a situação vacinal dos seus filhos e dependentes no mesmo perfil.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 text-[#00a884]">
                  <QrCode size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Comprovante Digital</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Gere comprovantes instantâneos para viagens, matrículas escolares ou requisitos de trabalho.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="EasyVacc" className="h-5 w-5 object-contain" />
            <span className="font-semibold text-slate-300">EasyVacc</span>
            <span>— Sistema de Gestão Vacinal</span>
          </div>
          <p>© {new Date().getFullYear()} EasyVacc. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}