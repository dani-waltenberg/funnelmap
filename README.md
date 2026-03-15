# 🗺️ FunnelMap — Deploy em Produção

## Passo a Passo Completo

---

## 1. Configurar o Supabase (banco de dados + auth)

### 1.1 Criar conta e projeto
1. Acesse **https://supabase.com** e clique em **Start your project**
2. Faça login com GitHub ou e-mail
3. Clique em **New project**
4. Escolha um nome (ex: `funnelmap`), defina uma senha forte e clique **Create new project**
5. Aguarde ~2 minutos enquanto o projeto inicializa

### 1.2 Criar as tabelas
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Copie e cole **todo o conteúdo** do arquivo `supabase/schema.sql`
4. Clique em **Run** (ou Ctrl+Enter)
5. Você verá a mensagem `Success. No rows returned`

### 1.3 Pegar as chaves da API
1. No menu lateral, clique em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (a chave longa que começa com `eyJ...`)

---

## 2. Configurar o projeto local

```bash
# Clone ou descompacte este projeto
cd funnelmap-project

# Instalar dependências
npm install

# Criar arquivo .env com suas chaves
cp .env.example .env
```

Abra o arquivo `.env` e preencha:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY_AQUI
```

```bash
# Rodar localmente
npm run dev
# Acesse http://localhost:5173
```

---

## 3. Deploy na Vercel (gratuito)

### Opção A — Via GitHub (recomendado)

1. Crie uma conta em **https://github.com** (se não tiver)
2. Crie um repositório novo chamado `funnelmap`
3. Suba o projeto:
```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USUARIO/funnelmap.git
git push -u origin main
```

4. Acesse **https://vercel.com** e faça login com GitHub
5. Clique em **New Project** → importe o repositório `funnelmap`
6. Na tela de configuração, clique em **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua chave anon
7. Clique em **Deploy**
8. Em ~1 minuto seu app estará em `https://funnelmap-XXXXX.vercel.app`

### Opção B — Via CLI da Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
# Siga as instruções e adicione as variáveis de ambiente quando solicitado
```

---

## 4. Configurar autenticação no Supabase

### Permitir cadastro e login
1. No Supabase, vá em **Authentication** → **Providers**
2. Certifique-se que **Email** está ativado
3. Em **Authentication** → **Settings**:
   - Desative "Confirm email" se quiser login imediato (recomendado para teste)
   - Ou mantenha ativado para confirmar e-mail (mais seguro)

### Adicionar URL do seu app
1. Em **Authentication** → **URL Configuration**
2. Em **Site URL** coloque: `https://SEU-APP.vercel.app`
3. Em **Redirect URLs** coloque: `https://SEU-APP.vercel.app/**`
4. Clique **Save**

---

## 5. Estrutura do projeto

```
funnelmap-project/
├── src/
│   ├── App.jsx          ← Aplicação completa (FunnelMap)
│   ├── main.jsx         ← Entry point React
│   └── supabase.js      ← Cliente Supabase
├── supabase/
│   └── schema.sql       ← SQL para criar as tabelas
├── public/
├── index.html
├── vite.config.js
├── package.json
├── .env.example         ← Template de variáveis de ambiente
├── .env                 ← Suas chaves (NÃO commitar no git!)
└── README.md
```

---

## Custos

| Serviço | Plano Gratuito |
|---------|---------------|
| **Vercel** | Projetos ilimitados, 100GB bandwidth/mês |
| **Supabase** | 500MB banco, 50.000 usuários, 2GB storage |
| **Total** | **R$ 0** |

---

## Problemas comuns

**"Invalid API key"** → Verifique se copiou a chave `anon public` (não a `service_role`)

**"relation does not exist"** → Execute novamente o `schema.sql` no SQL Editor

**Usuário criado mas não consegue logar** → Verifique se "Confirm email" está desativado em Authentication → Settings

**Deploy falha na Vercel** → Confirme que adicionou as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do projeto na Vercel
