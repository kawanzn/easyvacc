// ======================================================
// PÁGINA DE NOTIFICAÇÕES
// ======================================================

// useState:
// Guarda informações que podem mudar durante o uso da página.
//
// useEffect:
// Executa uma função quando a página é carregada.
import { useState, useEffect } from 'react';

// Ícones utilizados na página.
//
// AlertCircle foi removido porque estava importado,
// mas não era utilizado. Isso causava o erro TS6133
// durante o build da Vercel.
import {
  Bell,
  CheckCircle2
} from 'lucide-react';


export default function Notificacoes() {

  // ======================================================
  // ESTADOS
  // ======================================================

  // Guarda a lista de notificações recebida do backend.
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  // Controla a mensagem "Carregando notificações..."
  const [carregando, setCarregando] = useState(true);


  // ======================================================
  // CARREGAMENTO DAS NOTIFICAÇÕES
  // ======================================================

  useEffect(() => {

    // Recupera o ID do usuário salvo após o login.
    const usuarioId = localStorage.getItem('usuarioId');


    // Só busca notificações se existir um usuário logado.
    if (usuarioId) {

      // Faz uma requisição para o backend.
      //
      // ATENÇÃO:
      // localhost funciona apenas no desenvolvimento local.
      // Depois vamos configurar a URL do backend online.
      fetch(`http://localhost:5000/api/notificacoes/${usuarioId}`)

        // Converte a resposta do servidor para JSON.
        .then((res) => res.json())

        // Recebe os dados retornados pelo backend.
        .then((data) => {

          // Se a requisição foi bem-sucedida,
          // salva as notificações no estado.
          if (data.sucesso) {
            setNotificacoes(data.dados);
          }

          // Finaliza o carregamento.
          setCarregando(false);
        })

        // Caso aconteça algum problema de conexão.
        .catch((erro) => {

          console.error(
            'Erro ao carregar notificações',
            erro
          );

          setCarregando(false);
        });

    } else {

      // Se não existe usuário logado,
      // não precisamos tentar acessar o backend.
      setCarregando(false);
    }

  }, []);


  // ======================================================
  // INTERFACE
  // ======================================================

  return (

    <div className="p-8 md:p-12 animate-fade-in max-w-4xl mx-auto pb-20">


      {/* ==================================================
          CABEÇALHO
          ================================================== */}

      <div className="mb-8 border-b border-slate-200 pb-4">

        <h1 className="text-3xl font-black text-slate-800">
          Notificações e Alertas
        </h1>

        <p className="text-slate-500 mt-2">
          Avisos e lembretes importantes sincronizados
          com a sua caderneta.
        </p>

      </div>


      {/* ==================================================
          CARREGAMENTO
          ================================================== */}

      {carregando ? (

        <div className="text-center py-16 text-slate-400 font-bold">
          Carregando notificações...
        </div>

      ) : (

        // =================================================
        // LISTA DE NOTIFICAÇÕES
        // =================================================

        <div className="space-y-4">

          {notificacoes.length > 0 ? (

            notificacoes.map((notif) => (

              <div
                key={notif.id}

                // Se a notificação já foi lida,
                // ela recebe uma aparência mais neutra.
                //
                // Caso contrário, ganha destaque em teal.
                className={`
                  p-6
                  rounded-2xl
                  border
                  transition-all
                  flex
                  items-start
                  gap-4
                  ${
                    notif.lida
                      ? 'bg-white border-slate-200 text-slate-600'
                      : 'bg-teal-50/50 border-teal-200 text-slate-800 shadow-sm'
                  }
                `}
              >

                {/* ÍCONE DA NOTIFICAÇÃO */}

                <div
                  className={`
                    p-3
                    rounded-xl
                    shrink-0
                    ${
                      notif.lida
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-teal-600 text-white'
                    }
                  `}
                >

                  {/* 
                    Se já foi lida, mostramos um check.
                    Caso contrário, mostramos o sino.
                  */}

                  {notif.lida ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Bell size={20} />
                  )}

                </div>


                {/* CONTEÚDO DA NOTIFICAÇÃO */}

                <div>

                  <h3 className="font-bold text-base mb-1">
                    {notif.titulo}
                  </h3>

                  <p className="text-sm leading-relaxed">
                    {notif.mensagem}
                  </p>

                </div>

              </div>

            ))

          ) : (

            // Caso o usuário não possua notificações.
            <div className="text-center py-16 text-slate-400 font-bold">
              Nenhuma nova notificação no momento.
            </div>

          )}

        </div>

      )}

    </div>

  );
}