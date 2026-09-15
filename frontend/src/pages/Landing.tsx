import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  FileCheck,
  Megaphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const perguntas = [
  {
    q: 'O EasyVacc emite a caderneta oficial do SUS?',
    a: 'Não. Esta é uma caderneta digital da plataforma. Os registros entram por cadastro do usuário ou do posto de saúde e não são baixados automaticamente do SI-PNI.',
  },
  {
    q: 'Quem pode usar?',
    a: 'Qualquer cidadão com CPF pode criar uma conta para si e para dependentes. Profissionais de saúde acessam o painel do posto pelo login restrito.',
  },
  {
    q: 'De onde vêm as vacinas que aparecem na tela?',
    a: 'Somente do que foi cadastrado neste sistema. Contas novas começam sem doses e não aparecem como imunizadas.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'O acesso é feito com CPF e senha. A política de privacidade explica o uso de CPF, CNS e e-mail. O aceite fica registrado com data e versão.',
  },
];

export default function Landing() {
  const [faqAberta, setFaqAberta] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-[#00a884]/20 to-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3">
            <img src="/logo.png" alt="EasyVacc" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">
              Easy<span className="text-[#00a884]">Vacc</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <a href="#o-que-e" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-200 hover:text-white">
              O que é
            </a>
            <a href="#beneficios" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-200 hover:text-white">
              Benefícios
            </a>
            <a href="#faq" className="hidden min-h-11 items-center px-2 text-sm font-semibold text-slate-200 hover:text-white sm:inline-flex">
              Dúvidas
            </a>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#00a884] px-5 text-sm font-bold text-slate-950 shadow-lg shadow-[#00a884]/20 hover:bg-[#00c49a]"
            >
              Acessar caderneta
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-[#00a884]">
                  <Sparkles size={14} />
                  Caderneta digital de vacinação
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:leading-[1.15]">
                  Organize o histórico vacinal da família em um só lugar.
                </h1>

                <p className="max-w-xl text-lg leading-relaxed text-slate-200">
                  Sua caderneta de vacinação na palma da mão. Acompanhe doses aplicadas, receba alertas de próximos retornos e emita certificados digitais de forma rápida e segura.
                </p>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                  <p className="font-bold text-amber-200">Origem das informações</p>
                  <p className="mt-1">
                    Os dados desta instância são <strong>cadastrados manualmente</strong> pelo usuário
                    ou pelo posto. Não são importados automaticamente de sistemas oficiais do SUS.
                    A prévia ao lado é apenas ilustrativa.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    to="/cadastro"
                    className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-[#00a884] to-teal-500 px-6 text-base font-bold text-slate-950 shadow-lg shadow-[#00a884]/25 hover:brightness-110"
                  >
                    Criar caderneta
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-6 text-base font-semibold text-white hover:bg-slate-900"
                  >
                    Já tenho conta
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-2xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300">
                    Prévia ilustrativa — não é um prontuário real
                  </p>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00a884]/30 bg-[#00a884]/10">
                        <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Caderneta digital</p>
                        <p className="text-base font-bold text-white">Exemplo de titular</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200">
                      Demonstração
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-[#00a884]" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-white">Influenza</p>
                          <p className="text-xs text-slate-300">Histórico de doses aplicadas</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                      <div className="flex items-center gap-3">
                        <Clock className="text-amber-400" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">Próximas doses</p>
                          <p className="text-xs text-slate-300">Alertas de retorno cadastrados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="o-que-e" className="border-t border-slate-800 bg-slate-900/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00a884]">O que é o EasyVacc</h2>
            <p className="mt-3 max-w-3xl text-2xl font-bold text-white">
              Uma plataforma para acompanhar a caderneta, não um extrato oficial do Ministério da Saúde.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="text-lg font-bold text-white">Para quem é</h3>
                <p className="mt-3 text-base leading-7 text-slate-200">
                  Pessoas com CPF que querem guardar o próprio histórico, responsáveis que gerenciam
                  dependentes, e equipes de posto que registram aplicações no painel administrativo.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="text-lg font-bold text-white">O que você encontra depois do cadastro</h3>
                <p className="mt-3 text-base leading-7 text-slate-200">
                  Painel da situação vacinal, histórico de doses, campanhas cadastradas, certificado
                  digital com QR e gestão de dependentes — sempre a partir dos registros desta base.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-sm font-bold uppercase tracking-widest text-[#00a884]">
              Principais benefícios
            </h2>
            <p className="mt-2 text-center text-2xl font-bold text-white">
              Tudo o que a caderneta digital reúne
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { icon: FileCheck, t: 'Histórico', d: 'Doses, lotes e datas em uma linha do tempo.' },
                { icon: Clock, t: 'Próximas doses', d: 'Retornos cadastrados e pendências visíveis.' },
                { icon: Users, t: 'Dependentes', d: 'Cadernetas da família no mesmo acesso.' },
                { icon: Megaphone, t: 'Campanhas', d: 'Ações de imunização cadastradas no sistema.' },
                { icon: QrCode, t: 'Certificado', d: 'Comprovante digital com o que foi registrado.' },
              ].map((item) => (
                <div key={item.t} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <item.icon className="text-[#00a884]" size={22} />
                  <h3 className="mt-3 text-lg font-bold text-white">{item.t}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-slate-800 bg-slate-900/40 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-white">Perguntas frequentes</h2>
            <div className="mt-8 space-y-3">
              {perguntas.map((item, i) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setFaqAberta(faqAberta === i ? null : i)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-white">{item.q}</span>
                    <ChevronDown className={`shrink-0 text-slate-300 ${faqAberta === i ? 'rotate-180' : ''}`} />
                  </div>
                  {faqAberta === i && (
                    <p className="mt-3 text-base leading-7 text-slate-200">{item.a}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-300 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
            <span className="font-semibold text-white">EasyVacc</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacidade" className="min-h-11 inline-flex items-center font-semibold text-[#00a884] hover:underline">
              Política de privacidade
            </Link>
            <Link to="/termos" className="min-h-11 inline-flex items-center font-semibold text-[#00a884] hover:underline">
              Termos de uso
            </Link>
          </div>
          <p className="text-slate-400">© {new Date().getFullYear()} EasyVacc</p>
        </div>
      </footer>
    </div>
  );
}
