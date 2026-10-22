# EasyVacc

O **EasyVacc** é uma plataforma web desenvolvida para facilitar a organização e o acompanhamento de informações relacionadas à vacinação. O sistema reúne recursos voltados ao cidadão, aos profissionais autorizados e à administração da plataforma.

> Projeto acadêmico desenvolvido com foco em organização da caderneta de vacinação, acesso a informações e segurança dos dados.

## Funcionalidades

### Área do cidadão

- Cadastro e autenticação de usuários;
- Confirmação de e-mail e recuperação de senha;
- Dashboard do usuário;
- Caderneta e histórico de vacinação;
- Gerenciamento de dependentes;
- Perfil do usuário;
- Consulta de campanhas de vacinação;
- Busca de postos e estabelecimentos de saúde;
- Localização e direcionamento para unidades próximas;
- Notificações internas;
- Emissão e consulta de certificados;
- Validação de certificados por código;
- Política de Privacidade e Termos de Uso.

### Área profissional

- Login específico para profissionais;
- Acesso restrito a profissionais autorizados;
- Consulta do cidadão;
- Registro de informações de vacinação;
- Controle de dados como dose, data de aplicação, lote e fabricante;
- Registro de operações para segurança, rastreabilidade e auditoria.

### Área administrativa

- Autenticação específica para administradores;
- Área protegida por verificação de autorização;
- Recursos administrativos para gerenciamento da plataforma.

## Segurança e privacidade

O EasyVacc possui mecanismos voltados à proteção das informações tratadas pela plataforma, incluindo:

- autenticação de usuários;
- controle de acesso por perfil;
- políticas de acesso ao banco de dados;
- proteção de informações vinculadas ao titular e aos dependentes;
- mascaramento de identificadores pessoais quando aplicável;
- rastreabilidade e auditoria de alterações em registros de vacinação;
- Política de Privacidade e Termos de Uso;
- tratamento de dados considerando os princípios e direitos previstos na LGPD.

O EasyVacc é uma plataforma independente. Os registros individuais apresentados na caderneta correspondem às informações cadastradas na própria plataforma pelo usuário ou por profissionais autorizados e não substituem documentos oficiais emitidos pelo SUS ou por outras autoridades de saúde.

## Fontes de informação

Algumas funcionalidades informativas utilizam dados provenientes de fontes públicas oficiais:

- **Ministério da Saúde** — informações relacionadas a campanhas de vacinação;
- **CNES (Cadastro Nacional de Estabelecimentos de Saúde)** — informações de postos e estabelecimentos de saúde.

Essas fontes são utilizadas para complementar funcionalidades da plataforma e não representam acesso automático ao histórico individual de vacinação mantido pelo SUS.

## Tecnologias

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend

- Laravel
- PHP
- API REST

### Banco de dados e autenticação

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

### Hospedagem

- Vercel — frontend
- Render — backend
- Supabase — banco de dados e autenticação

## Estrutura do projeto

```text
easyvacc/
├── backend/      # API e serviços do backend
├── frontend/     # Aplicação web React
└── supabase/     # Configurações e recursos relacionados ao Supabase
```

## Principais áreas da aplicação

```text
/
├── cadastro
├── login
├── recuperar-senha
├── confirmar-email
├── dashboard
├── historico
├── perfil
├── certificado
├── dependentes
├── notificacoes
├── campanhas
├── postos
├── profissional/
└── admin/
```

Rotas inexistentes são tratadas por uma página de erro **404** própria.

## Executando o frontend localmente

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente necessárias ao Supabase no ambiente local.

Depois, execute:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

## Build

Para gerar uma versão de produção do frontend:

```bash
npm run build
```

## Documentos legais

A plataforma disponibiliza:

- Política de Privacidade;
- Termos de Uso.

Os documentos apresentam informações sobre tratamento de dados, direitos dos usuários, responsabilidades e regras de utilização da plataforma.

## Observação

O EasyVacc não substitui sistemas oficiais de saúde nem documentos oficiais de vacinação. Os certificados emitidos pela plataforma são baseados nos registros existentes no próprio EasyVacc.

## Contato

Para dúvidas relacionadas ao projeto, privacidade ou proteção de dados:

**easyvacc.contato@gmail.com**

---

**EasyVacc — sua vacinação organizada de forma simples e acessível.**
