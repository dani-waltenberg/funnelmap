import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "./supabase.js";

// ─── THEME ───────────────────────────────────────────────────────────
function makeTheme(dark) {
  return dark ? {
    bg:"#080b12", surface:"#10131c", surface2:"#161a27", surface3:"#232840",
    border:"#252c40", border2:"#2e3650",
    accent:"#4f8ef7", accent2:"#8b5cf6",
    green:"#10b981", orange:"#f97316", text:"#e2e8f8",
    muted:"#5a6480", muted2:"#8896b4",
    canvasBg:"#0d1018", canvasGrid:"rgba(79,142,247,0.06)",
    connLine:"#3a4460", nodeLabel:"#c8d0e8",
  } : {
    bg:"#ffffff", surface:"#f8f9fb", surface2:"#f0f2f7", surface3:"#e8eaf0",
    border:"#dde1ec", border2:"#c8cedf",
    accent:"#4f8ef7", accent2:"#8b5cf6",
    green:"#10b981", orange:"#f97316", text:"#1a1f36",
    muted:"#7b88a8", muted2:"#9aa3bb",
    canvasBg:"#f0f2f7", canvasGrid:"rgba(180,190,210,0.5)",
    connLine:"#9aa3bb", nodeLabel:"#1a1f36",
  };
}

const ThemeCtx = createContext(makeTheme(false));
function useT() { return useContext(ThemeCtx); }

// ─── SUPABASE DATA LAYER ─────────────────────────────────────────────
// Funis
async function dbGetFunnels(userId) {
  const { data, error } = await supabase
    .from("funnels")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) { console.error("dbGetFunnels:", error); return []; }
  return data || [];
}
async function dbSaveFunnel(userId, funnel) {
  const { error } = await supabase
    .from("funnels")
    .upsert({
      id:          funnel.id,
      owner_id:    userId,
      name:        funnel.name,
      nodes:       funnel.nodes       || {},
      connections: funnel.connections || [],
      members:     funnel.members     || [],
      updated_at:  new Date().toISOString(),
    });
  if (error) console.error("dbSaveFunnel:", error);
  return !error;
}
async function dbDeleteFunnel(funnelId) {
  const { error } = await supabase
    .from("funnels")
    .delete()
    .eq("id", funnelId);
  if (error) console.error("dbDeleteFunnel:", error);
  return !error;
}
// Perfil
async function dbGetProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

// ─── NODE DEFINITIONS ────────────────────────────────────────────────
const NODE_DEFS = {
  // ── Pages ────────────────────────────────────────────────────────────
  landing:      { label:"Pág. Genérica",    iconType:"page", pageIcon:"generic",   accent:"#4f8ef7",  isTraffic:false },
  download:     { label:"Download",         iconType:"page", pageIcon:"download",  accent:"#4f8ef7",  isTraffic:false },
  optin_page:   { label:"Opt In",           iconType:"page", pageIcon:"optin",     accent:"#4f8ef7",  isTraffic:false },
  order:        { label:"Pág. de Pedido",   iconType:"page", pageIcon:"order",     accent:"#4f8ef7",  isTraffic:false },
  sales:        { label:"Pág. de Vendas",   iconType:"page", pageIcon:"sales",     accent:"#4f8ef7",  isTraffic:false },
  salesv:       { label:"Pág. de Vendas V...","iconType":"page", pageIcon:"salesv",accent:"#4f8ef7",  isTraffic:false },
  calendar:     { label:"Calendário",       iconType:"page", pageIcon:"calendar",  accent:"#4f8ef7",  isTraffic:false },
  survey:       { label:"Pesquisa",         iconType:"page", pageIcon:"survey",    accent:"#4f8ef7",  isTraffic:false },
  upsell:       { label:"Upsell / OTO",     iconType:"page", pageIcon:"upsell",    accent:"#4f8ef7",  isTraffic:false },
  webinar:      { label:"Webinar Ao Vivo",  iconType:"page", pageIcon:"webinar",   accent:"#4f8ef7",  isTraffic:false },
  webinarrep:   { label:"Webinar Replay",   iconType:"page", pageIcon:"webinarrep",accent:"#4f8ef7",  isTraffic:false },
  blogpost:     { label:"Blog / Artigo",    iconType:"page", pageIcon:"blog",      accent:"#4f8ef7",  isTraffic:false },
  members:      { label:"Área de Membros",  iconType:"page", pageIcon:"members",   accent:"#4f8ef7",  isTraffic:false },
  thankyou:     { label:"Obrigado",         iconType:"page", pageIcon:"thankyou",  accent:"#4f8ef7",  isTraffic:false },
  popup:        { label:"Popup",            iconType:"page", pageIcon:"popup",     accent:"#4f8ef7",  isTraffic:false },
  checkout:     { label:"Checkout",         iconType:"page", pageIcon:"checkout",  accent:"#4f8ef7",  isTraffic:false },
  vsl:          { label:"VSL",              iconType:"page", pageIcon:"vsl",       accent:"#4f8ef7",  isTraffic:false },
  "ad-fb":         { label:"Facebook Ads",       icon:"f",  bg:"#1877f2", accent:"#1877f2", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "ad-ig":         { label:"Instagram Ads",      icon:"📸", bg:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", accent:"#e1306c", isTraffic:true },
  "ad-tiktok":     { label:"TikTok Ads",         icon:"♪",  bg:"#010101", accent:"#ee1d52", isTraffic:true, iconType:"text", iconColor:"#ee1d52" },
  "ad-google":     { label:"Google Ads",         icon:"G",  bg:"#fff",    accent:"#4285f4", isTraffic:true, iconType:"text", iconColor:"#ea4335" },
  "ad-youtube":    { label:"YouTube Ads",        icon:"▶",  bg:"#ff0000", accent:"#ff0000", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "ad-linkedin":   { label:"LinkedIn Ads",       icon:"in", bg:"#0a66c2", accent:"#0a66c2", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "ad-x":          { label:"X Ads",              icon:"𝕏",  bg:"#000",    accent:"#1d9bf0", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "ad-pinterest":  { label:"Pinterest Ads",      icon:"P",  bg:"#e60023", accent:"#e60023", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "ad-reddit":     { label:"Reddit Ads",         icon:"👾", bg:"#ff4500", accent:"#ff4500", isTraffic:true },
  "ad-snapchat":   { label:"Snapchat Ads",       icon:"👻", bg:"#fffc00", accent:"#cccc00", isTraffic:true },
  "org-fb":        { label:"Facebook Orgânico",  icon:"f",  bg:"#1877f2", accent:"#1877f2", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "org-ig":        { label:"Instagram Orgânico", icon:"📷", bg:"linear-gradient(135deg,#f09433,#dc2743,#bc1888)", accent:"#e1306c", isTraffic:true },
  "org-tiktok":    { label:"TikTok Orgânico",    icon:"♪",  bg:"#010101", accent:"#ee1d52", isTraffic:true, iconType:"text", iconColor:"#ee1d52" },
  "org-x":         { label:"X Orgânico",         icon:"𝕏",  bg:"#000",    accent:"#1d9bf0", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "org-linkedin":  { label:"LinkedIn Orgânico",  icon:"in", bg:"#0a66c2", accent:"#0a66c2", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "org-pinterest": { label:"Pinterest Orgânico", icon:"P",  bg:"#e60023", accent:"#e60023", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "org-reddit":    { label:"Reddit",             icon:"👾", bg:"#ff4500", accent:"#ff4500", isTraffic:true },
  "search-all":    { label:"Todas as Buscas",    icon:"🔍", bg:"#ea4335", accent:"#ea4335", isTraffic:true },
  "search-google": { label:"Google Orgânico",    icon:"G",  bg:"#fff",    accent:"#4285f4", isTraffic:true, iconType:"text", iconColor:"#4285f4" },
  "search-bing":   { label:"Bing",               icon:"B",  bg:"#00809d", accent:"#00809d", isTraffic:true, iconType:"text", iconColor:"#fff" },
  "search-yt":     { label:"YouTube",            icon:"▶",  bg:"#ff0000", accent:"#ff0000", isTraffic:true, iconType:"text", iconColor:"#fff" },
  email:           { label:"E-mail",             icon:"✉",  bg:"#4f8ef7", accent:"#4f8ef7", isTraffic:true, iconType:"text", iconColor:"#fff" },
  gmail:           { label:"Gmail",              icon:"M",  bg:"#fff",    accent:"#ea4335", isTraffic:true, iconType:"text", iconColor:"#ea4335" },
  whatsapp:        { label:"WhatsApp",           icon:"whatsapp-svg", bg:"#25d366", accent:"#25d366", isTraffic:true, iconType:"svg" },
  // ── Ações de Conversão ───────────────────────────────────────────────
  "ac-compra":      { label:"Comprar",           isTraffic:false, iconType:"action", actionIcon:"purchase",      actionBg:"#22c55e", actionShape:"diamond" },
  "ac-formulario":  { label:"Formulário p...",   isTraffic:false, iconType:"action", actionIcon:"form",          actionBg:"#f59e0b", actionShape:"diamond" },
  "ac-agendar":     { label:"Agendar reu...",    isTraffic:false, iconType:"action", actionIcon:"schedule",      actionBg:"#3b5fc0", actionShape:"diamond" },
  "ac-negocio":     { label:"Negócio fec...",    isTraffic:false, iconType:"action", actionIcon:"deal",          actionBg:"#22c55e", actionShape:"diamond" },
  // ── Ações de Engajamento ─────────────────────────────────────────────
  "ae-video":       { label:"Assistir ao vi...", isTraffic:false, iconType:"action", actionIcon:"video",         actionBg:"#ef4444", actionShape:"diamond" },
  "ae-link":        { label:"Clique no link",   isTraffic:false, iconType:"action", actionIcon:"linkclick",     actionBg:"#0d9488", actionShape:"diamond" },
  "ae-scroll":      { label:"Rolar",            isTraffic:false, iconType:"action", actionIcon:"scroll",        actionBg:"#3b82f6", actionShape:"diamond" },
  "ae-botao":       { label:"Clique no bo...",  isTraffic:false, iconType:"action", actionIcon:"buttonclick",   actionBg:"#8b5cf6", actionShape:"diamond" },
  "ae-status":      { label:"Status do ne...",  isTraffic:false, iconType:"action", actionIcon:"dealstatus",    actionBg:"#f97316", actionShape:"diamond" },
  // ── Ações de Integração ──────────────────────────────────────────────
  "ai-ghl-appoint": { label:"Nomeação GHL",     isTraffic:false, iconType:"action", actionIcon:"ghl-appoint",  actionBg:"#3b5fc0", actionShape:"diamond" },
  "ai-ghl-order":   { label:"Ordem GHL",        isTraffic:false, iconType:"action", actionIcon:"ghl-order",    actionBg:"#22c55e", actionShape:"diamond" },
  "ai-ghl-oport1":  { label:"Oportunida...",    isTraffic:false, iconType:"action", actionIcon:"ghl-opport",   actionBg:"#f97316", actionShape:"diamond" },
  "ai-ghl-oport2":  { label:"Oportunida...",    isTraffic:false, iconType:"action", actionIcon:"ghl-opport2",  actionBg:"#f97316", actionShape:"diamond" },
  "ai-hs-deal":     { label:"Oferta da H...",   isTraffic:false, iconType:"action", actionIcon:"hs-deal",      actionBg:"#f97316", actionShape:"diamond" },
  "ai-hs-deal2":    { label:"Negócio fec...",   isTraffic:false, iconType:"action", actionIcon:"hs-deal2",     actionBg:"#22c55e", actionShape:"diamond" },
  // ── Ações Personalizadas ─────────────────────────────────────────────
  "ap-lista":       { label:"Adicionar à l...",  isTraffic:false, iconType:"action", actionIcon:"addlist",      actionBg:"#1e293b", actionShape:"diamond" },
  "ap-contato":     { label:"Contato",           isTraffic:false, iconType:"action", actionIcon:"contact",      actionBg:"#1e293b", actionShape:"diamond" },
  "ap-reqcon":      { label:"Solicitar con...",  isTraffic:false, iconType:"action", actionIcon:"reqcontent",   actionBg:"#a855f7", actionShape:"diamond" },
  "ap-reqinfo":     { label:"Solicitar info...", isTraffic:false, iconType:"action", actionIcon:"reqinfo",      actionBg:"#06b6d4", actionShape:"diamond" },
  "ap-popup":       { label:"Aparecer",          isTraffic:false, iconType:"action", actionIcon:"popup",        actionBg:"#ec4899", actionShape:"diamond" },
  "ap-carrinho":    { label:"Adicionar ao...",   isTraffic:false, iconType:"action", actionIcon:"addcart",      actionBg:"#14b8a6", actionShape:"diamond" },
  "ap-tag":         { label:"Adicionar eti...",  isTraffic:false, iconType:"action", actionIcon:"addtag",       actionBg:"#f97316", actionShape:"diamond" },
  // ── Pessoas ──────────────────────────────────────────────────────────
  "p-seller":     { label:"Seller",            isTraffic:false, iconType:"pessoa", pessoaIcon:"seller",    pessoaBg:"#6366f1" },
  "p-cs":         { label:"Customer Success",  isTraffic:false, iconType:"pessoa", pessoaIcon:"cs",        pessoaBg:"#0ea5e9" },
  "p-pm":         { label:"Gest. de Projeto",  isTraffic:false, iconType:"pessoa", pessoaIcon:"pm",        pessoaBg:"#f59e0b" },
  "p-traffic":    { label:"Gest. de Tráfego",  isTraffic:false, iconType:"pessoa", pessoaIcon:"traffic",   pessoaBg:"#ef4444" },
  "p-designer":   { label:"Designer",          isTraffic:false, iconType:"pessoa", pessoaIcon:"designer",  pessoaBg:"#ec4899" },
  "p-dev":        { label:"Desenvolvedor",     isTraffic:false, iconType:"pessoa", pessoaIcon:"dev",       pessoaBg:"#10b981" },
  "p-copywriter": { label:"Copywriter",        isTraffic:false, iconType:"pessoa", pessoaIcon:"copy",      pessoaBg:"#8b5cf6" },
  "p-analyst":    { label:"Analista",          isTraffic:false, iconType:"pessoa", pessoaIcon:"analyst",   pessoaBg:"#14b8a6" },
  "p-socialmedia":{ label:"Social Media",      isTraffic:false, iconType:"pessoa", pessoaIcon:"socialmedia", pessoaBg:"#e11d48" },
  "p-videoeditor":{ label:"Editor de Vídeo",   isTraffic:false, iconType:"pessoa", pessoaIcon:"videoeditor", pessoaBg:"#7c3aed" },
  "p-expert":     { label:"Expert",            isTraffic:false, iconType:"pessoa", pessoaIcon:"expert",    pessoaBg:"#d97706" },
  // ── Formas de Fluxograma ─────────────────────────────────────────────
  "f-processo":    { label:"Processo",          isTraffic:false, iconType:"forma", formaShape:"processo",    formaBg:"#3b82f6", formaColor:"white" },
  "f-decisao":     { label:"Decisão",           isTraffic:false, iconType:"forma", formaShape:"decisao",     formaBg:"#f59e0b", formaColor:"white" },
  "f-inicio":      { label:"Início / Fim",      isTraffic:false, iconType:"forma", formaShape:"inicio",      formaBg:"#10b981", formaColor:"white" },
  "f-dados":       { label:"Dados (E/S)",        isTraffic:false, iconType:"forma", formaShape:"dados",       formaBg:"#8b5cf6", formaColor:"white" },
  "f-documento":   { label:"Documento",         isTraffic:false, iconType:"forma", formaShape:"documento",   formaBg:"#0ea5e9", formaColor:"white" },
  "f-multidoc":    { label:"Multi-documento",   isTraffic:false, iconType:"forma", formaShape:"multidoc",    formaBg:"#0ea5e9", formaColor:"white" },
  "f-bdados":      { label:"Banco de Dados",    isTraffic:false, iconType:"forma", formaShape:"bdados",      formaBg:"#6366f1", formaColor:"white" },
  "f-manual":      { label:"Op. Manual",        isTraffic:false, iconType:"forma", formaShape:"manual",      formaBg:"#ef4444", formaColor:"white" },
  "f-preparacao":  { label:"Preparação",        isTraffic:false, iconType:"forma", formaShape:"preparacao",  formaBg:"#f97316", formaColor:"white" },
  "f-conector":    { label:"Conector",          isTraffic:false, iconType:"forma", formaShape:"conector",    formaBg:"#64748b", formaColor:"white" },
  "f-display":     { label:"Display",           isTraffic:false, iconType:"forma", formaShape:"display",     formaBg:"#06b6d4", formaColor:"white" },
  "f-atraso":      { label:"Atraso",            isTraffic:false, iconType:"forma", formaShape:"atraso",      formaBg:"#dc2626", formaColor:"white" },
  "f-nota":        { label:"Nota / Comentário", isTraffic:false, iconType:"forma", formaShape:"nota",        formaBg:"#fbbf24", formaColor:"#1e293b" },
  "f-ou":          { label:"Ou (OR)",           isTraffic:false, iconType:"forma", formaShape:"ou",          formaBg:"#ec4899", formaColor:"white" },
  "f-e":           { label:"E (AND)",           isTraffic:false, iconType:"forma", formaShape:"e",           formaBg:"#14b8a6", formaColor:"white" },
  // ── Produtos ─────────────────────────────────────────────────────────
  "prod-curso":     { label:"Curso",             isTraffic:false, iconType:"produto", produtoIcon:"curso",     produtoBg:"#6366f1" },
  "prod-mentoria":  { label:"Mentoria",          isTraffic:false, iconType:"produto", produtoIcon:"mentoria",  produtoBg:"#f59e0b" },
  "prod-webinario": { label:"Webinário",         isTraffic:false, iconType:"produto", produtoIcon:"webinario", produtoBg:"#ef4444" },
  "prod-workshop":  { label:"Workshop",          isTraffic:false, iconType:"produto", produtoIcon:"workshop",  produtoBg:"#10b981" },
  "prod-ebook":     { label:"Ebook",             isTraffic:false, iconType:"produto", produtoIcon:"ebook",     produtoBg:"#0ea5e9" },
  "prod-ferramenta":{ label:"Ferramenta",        isTraffic:false, iconType:"produto", produtoIcon:"ferramenta",produtoBg:"#8b5cf6" },
  "prod-imersao":   { label:"Imersão",           isTraffic:false, iconType:"produto", produtoIcon:"imersao",   produtoBg:"#ec4899" },
  "prod-evento":    { label:"Evento Presencial", isTraffic:false, iconType:"produto", produtoIcon:"evento",    produtoBg:"#14b8a6" },
};

const SIDEBAR_TABS = ["Fontes","Páginas","Ações","Pessoas","Formas","Produtos"];
const SIDEBAR_GROUPS = {
  Fontes: [
    { label:"Pago",     items:["ad-fb","ad-ig","ad-tiktok","ad-google","ad-youtube","ad-linkedin","ad-x","ad-pinterest","ad-reddit","ad-snapchat"] },
    { label:"Procurar", items:["search-all","search-bing","search-google","search-yt"] },
    { label:"Social",   items:["org-fb","org-pinterest","org-reddit","org-ig","org-linkedin","org-tiktok","org-x"] },
    { label:"Outro",    items:["email","gmail","whatsapp"] },
  ],
  Páginas: [{ label:"Páginas", items:["landing","download","optin_page","order","sales","salesv","calendar","survey","upsell","webinar","webinarrep","blogpost","members","thankyou","popup"] }],
  Ações: [
    { label:"Ações de Conversão",     items:["ac-compra","ac-formulario","ac-agendar","ac-negocio"] },
    { label:"Ações de Engajamento",   items:["ae-video","ae-link","ae-scroll","ae-botao","ae-status"] },
    { label:"Ações de Integração",    items:["ai-ghl-appoint","ai-ghl-order","ai-ghl-oport1","ai-ghl-oport2","ai-hs-deal","ai-hs-deal2"] },
    { label:"Ações Personalizadas",   items:["ap-lista","ap-contato","ap-reqcon","ap-reqinfo","ap-popup","ap-carrinho","ap-tag"] },
  ],
  Pessoas: [
    { label:"Papéis", items:["p-seller","p-cs","p-pm","p-traffic","p-designer","p-dev","p-copywriter","p-analyst","p-socialmedia","p-videoeditor","p-expert"] },
  ],
  Formas: [
    { label:"Fluxograma", items:["f-processo","f-decisao","f-inicio","f-dados","f-documento","f-multidoc","f-bdados","f-manual","f-preparacao","f-conector","f-display","f-atraso","f-nota","f-ou","f-e"] },
  ],
  Produtos: [
    { label:"Produtos", items:["prod-curso","prod-mentoria","prod-webinario","prod-workshop","prod-ebook","prod-ferramenta","prod-imersao","prod-evento"] },
  ],
};

const NODE_W = 80, NODE_H = 90, NODE_ICO = 56;
// Page nodes use a different size (browser mockup rectangle)
const PAGE_W = 72, PAGE_H = 86, PAGE_INNER_H = 58;

// ─── SVG ICONS ───────────────────────────────────────────────────────
const SVG_ICONS = {
  "whatsapp-svg": (sz) => (
    <svg width={sz*0.56} height={sz*0.56} viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

// ─── PAGE WIREFRAME SVG ICONS ─────────────────────────────────────────
// Each returns an SVG that fits inside the browser mockup content area
function PageWireframe({ type, w=52, h=42, accent="#4f8ef7" }) {
  const g  = "#b0bec5"; // grey lines
  const b  = accent;    // blue accent (buttons, highlights)
  const lb = accent+"55";
  const lg = "#cfd8dc";
  const ic = "#78909c"; // icon stroke

  const wireframes = {
    generic: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="3" width="44" height="6" rx="1.5" fill={lg}/>
        <rect x="4" y="12" width="44" height="3" rx="1" fill={lg}/>
        <rect x="4" y="17" width="32" height="2" rx="1" fill={lg}/>
        <rect x="10" y="23" width="32" height="8" rx="2" fill={lb}/>
        <text x="26" y="29" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">CALL TO ACTION</text>
        <rect x="4" y="34" width="44" height="2" rx="1" fill={lg}/>
        <rect x="10" y="38" width="32" height="2" rx="1" fill={lg}/>
      </svg>
    ),
    download: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="14" y="2" width="24" height="18" rx="2" fill={lg} stroke={g} strokeWidth="0.8"/>
        <circle cx="26" cy="11" r="6" fill="white" stroke={b} strokeWidth="1.2"/>
        <line x1="26" y1="8" x2="26" y2="13" stroke={b} strokeWidth="1.2"/>
        <polyline points="23,11 26,14 29,11" fill="none" stroke={b} strokeWidth="1.2"/>
        <rect x="4" y="24" width="44" height="3" rx="1" fill={lg}/>
        <rect x="8" y="30" width="36" height="7" rx="2" fill={lb}/>
        <text x="26" y="35.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">DOWNLOAD</text>
      </svg>
    ),
    optin: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="3" width="44" height="5" rx="1.5" fill={lg}/>
        <rect x="4" y="11" width="44" height="7" rx="1.5" fill="white" stroke={g} strokeWidth="0.8"/>
        <text x="8" y="16.5" fontSize="4.5" fill={g}>Email</text>
        <rect x="4" y="21" width="44" height="7" rx="1.5" fill="white" stroke={g} strokeWidth="0.8"/>
        <text x="8" y="26.5" fontSize="4.5" fill={g}>Nome</text>
        <rect x="10" y="31" width="32" height="8" rx="2" fill={lb}/>
        <text x="26" y="36.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">GET IT!</text>
      </svg>
    ),
    order: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="3" width="44" height="4" rx="1" fill={lg}/>
        <rect x="4" y="10" width="20" height="14" rx="1.5" fill={lg}/>
        <rect x="28" y="10" width="20" height="5" rx="1" fill={lg}/>
        <rect x="28" y="17" width="20" height="3" rx="1" fill={lg}/>
        <rect x="28" y="22" width="20" height="3" rx="1" fill={lg}/>
        <rect x="4" y="28" width="44" height="7" rx="2" fill={lb}/>
        <text x="26" y="33.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">BUY NOW</text>
        <rect x="4" y="38" width="44" height="2" rx="1" fill={lg}/>
      </svg>
    ),
    sales: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="8" rx="2" fill={lg}/>
        <rect x="4" y="13" width="44" height="3" rx="1" fill={lg}/>
        <rect x="8" y="18" width="36" height="2" rx="1" fill={lg}/>
        <rect x="10" y="23" width="32" height="8" rx="2" fill={lb}/>
        <text x="26" y="28.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">BUY NOW</text>
        <rect x="4" y="34" width="44" height="2" rx="1" fill={lg}/>
        <rect x="10" y="38" width="32" height="2" rx="1" fill={lg}/>
      </svg>
    ),
    salesv: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="7" rx="2" fill={lg}/>
        <rect x="10" y="12" width="32" height="14" rx="2" fill={lg}/>
        <polygon points="22,14 22,24 32,19" fill={b} opacity="0.7"/>
        <rect x="10" y="29" width="32" height="7" rx="2" fill={lb}/>
        <text x="26" y="34.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">CALL TO ACTION</text>
      </svg>
    ),
    calendar: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="6" y="5" width="40" height="32" rx="2" fill="white" stroke={g} strokeWidth="0.8"/>
        <rect x="6" y="5" width="40" height="8" rx="2" fill={b} opacity="0.7"/>
        <line x1="6" y1="13" x2="46" y2="13" stroke={g} strokeWidth="0.5"/>
        {[0,1,2,3,4,5,6].map(i=><line key={i} x1={6+i*40/6} y1="13" x2={6+i*40/6} y2="37" stroke={g} strokeWidth="0.4"/>)}
        {[0,1,2,3].map(i=><line key={i} x1="6" y1={19+i*6} x2="46" y2={19+i*6} stroke={g} strokeWidth="0.4"/>)}
        <rect x="22" y="21" width="8" height="5" rx="1" fill={lb}/>
        <text x="26" y="25" textAnchor="middle" fontSize="4" fill={b} fontWeight="700">14</text>
        <rect x="6" y="38" width="40" height="1" rx=".5" fill={lg}/>
      </svg>
    ),
    survey: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="4" rx="1" fill={lg}/>
        <rect x="4" y="9" width="44" height="3" rx="1" fill={lg}/>
        <circle cx="8" cy="16" r="2.5" fill="none" stroke={g} strokeWidth="1"/>
        <rect x="13" y="14.5" width="30" height="2" rx="1" fill={lg}/>
        <circle cx="8" cy="23" r="2.5" fill={b} opacity="0.8"/>
        <rect x="13" y="21.5" width="30" height="2" rx="1" fill={lg}/>
        <circle cx="8" cy="30" r="2.5" fill="none" stroke={g} strokeWidth="1"/>
        <rect x="13" y="28.5" width="30" height="2" rx="1" fill={lg}/>
        <rect x="10" y="35" width="32" height="6" rx="2" fill={lb}/>
        <text x="26" y="39.5" textAnchor="middle" fontSize="4.5" fill={b} fontWeight="700">CALL TO ACTION</text>
      </svg>
    ),
    upsell: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="5" rx="1.5" fill={lg}/>
        <rect x="12" y="10" width="28" height="14" rx="2" fill={lg}/>
        <polygon points="22,12 22,22 32,17" fill={b} opacity="0.7"/>
        <rect x="4" y="27" width="44" height="3" rx="1" fill={lg}/>
        <rect x="10" y="33" width="32" height="7" rx="2" fill={lb}/>
        <text x="26" y="38" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">BUY NOW</text>
      </svg>
    ),
    webinar: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="5" rx="1" fill={lg}/>
        <rect x="4" y="10" width="44" height="20" rx="2" fill={lg} stroke={g} strokeWidth="0.5"/>
        <circle cx="26" cy="20" r="7" fill="white" stroke={b} strokeWidth="1"/>
        <polygon points="24,17 24,23 30,20" fill={b}/>
        <rect x="4" y="33" width="44" height="7" rx="2" fill={lb}/>
        <text x="26" y="38" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">CALL TO ACTION</text>
      </svg>
    ),
    webinarrep: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="5" rx="1" fill={lg}/>
        <rect x="4" y="10" width="44" height="16" rx="2" fill={lg} stroke={g} strokeWidth="0.5"/>
        <circle cx="26" cy="18" r="6" fill="white" stroke={b} strokeWidth="1"/>
        <polygon points="24,15 24,21 30,18" fill={b}/>
        <rect x="4" y="29" width="44" height="3" rx="1" fill={lg}/>
        <rect x="10" y="35" width="32" height="6" rx="2" fill={lb}/>
        <text x="26" y="39.5" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">BUY NOW</text>
      </svg>
    ),
    blog: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="7" rx="2" fill={lg}/>
        <rect x="4" y="12" width="28" height="18" rx="1.5" fill={lg}/>
        <rect x="35" y="12" width="13" height="4" rx="1" fill={lg}/>
        <rect x="35" y="18" width="13" height="3" rx="1" fill={lg}/>
        <rect x="35" y="23" width="13" height="3" rx="1" fill={lg}/>
        <rect x="4" y="33" width="44" height="2" rx="1" fill={lg}/>
        <rect x="4" y="37" width="30" height="2" rx="1" fill={lg}/>
      </svg>
    ),
    members: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="5" rx="1.5" fill={lg}/>
        <circle cx="15" cy="16" r="5" fill={lg} stroke={g} strokeWidth="0.8"/>
        <rect x="22" y="12" width="24" height="3" rx="1" fill={lg}/>
        <rect x="22" y="17" width="18" height="2" rx="1" fill={lg}/>
        <rect x="4" y="24" width="44" height="2" rx="1" fill={lg}/>
        <rect x="4" y="28" width="44" height="2" rx="1" fill={lg}/>
        <rect x="4" y="33" width="44" height="7" rx="2" fill={lb}/>
        <text x="26" y="38" textAnchor="middle" fontSize="5" fill={b} fontWeight="700">CALL TO ACTION</text>
      </svg>
    ),
    thankyou: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <circle cx="26" cy="14" r="8" fill="none" stroke={b} strokeWidth="1.2" opacity="0.6"/>
        <polyline points="21,14 24.5,17.5 31,11" fill="none" stroke={b} strokeWidth="1.5" opacity="0.8"/>
        <rect x="4" y="26" width="44" height="3" rx="1" fill={lg}/>
        <rect x="8" y="31" width="36" height="2" rx="1" fill={lg}/>
        <rect x="12" y="36" width="28" height="2" rx="1" fill={lg}/>
      </svg>
    ),
    popup: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="6" width="44" height="30" rx="2" fill={lg} opacity="0.4"/>
        <rect x="10" y="2" width="32" height="38" rx="2.5" fill="white" stroke={b} strokeWidth="1" opacity="0.9"/>
        <rect x="10" y="2" width="32" height="8" rx="2" fill={lb}/>
        <rect x="14" y="14" width="24" height="3" rx="1" fill={lg}/>
        <rect x="16" y="19" width="20" height="2" rx="1" fill={lg}/>
        <rect x="16" y="28" width="20" height="7" rx="2" fill={lb}/>
        <text x="26" y="33" textAnchor="middle" fontSize="4.5" fill={b} fontWeight="700">CALL TO ACTION</text>
        <text x="38" y="8" textAnchor="middle" fontSize="7" fill={b} fontWeight="700">×</text>
      </svg>
    ),
    checkout: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="28" height="22" rx="1.5" fill={lg}/>
        <rect x="7" y="5" width="22" height="4" rx="1" fill="white" opacity="0.7"/>
        <rect x="7" y="11" width="22" height="3" rx="1" fill="white" opacity="0.7"/>
        <rect x="7" y="16" width="22" height="3" rx="1" fill="white" opacity="0.7"/>
        <rect x="34" y="2" width="14" height="10" rx="1.5" fill={lg}/>
        <rect x="34" y="14" width="14" height="10" rx="1.5" fill={lb}/>
        <text x="41" y="20.5" textAnchor="middle" fontSize="4" fill={b} fontWeight="700">PAY</text>
        <rect x="4" y="27" width="44" height="13" rx="2" fill="white" stroke={g} strokeWidth="0.8"/>
        <rect x="8" y="30" width="20" height="3" rx="1" fill={lg}/>
        <rect x="8" y="35" width="14" height="3" rx="1" fill={lg}/>
        <rect x="32" y="30" width="12" height="8" rx="1" fill={lb}/>
      </svg>
    ),
    vsl: (
      <svg width={w} height={h} viewBox="0 0 52 42">
        <rect x="4" y="2" width="44" height="5" rx="1" fill={lg}/>
        <rect x="4" y="10" width="44" height="22" rx="2" fill="#1a1a2e" opacity="0.8"/>
        <circle cx="26" cy="21" r="7" fill="white" opacity="0.15"/>
        <polygon points="23,18 23,24 30,21" fill="white" opacity="0.9"/>
        <rect x="4" y="35" width="44" height="5" rx="2" fill={lb}/>
        <text x="26" y="39" textAnchor="middle" fontSize="4.5" fill={b} fontWeight="700">CALL TO ACTION</text>
      </svg>
    ),
  };
  return wireframes[type] || wireframes.generic;
}

// Browser mockup wrapper for page nodes in sidebar
function PageNodeThumb({ pageIcon, accent="#4f8ef7", size=52 }) {
  const ratio = size/52;
  const W = Math.round(52*ratio), H = Math.round(66*ratio);
  const barH = Math.round(8*ratio);
  return (
    <div style={{width:W, height:H, borderRadius:3*ratio,
      border:"1.5px solid #d0d7de", background:"white",
      overflow:"hidden", flexShrink:0, boxShadow:"0 2px 6px rgba(0,0,0,.1)"}}>
      {/* Browser bar */}
      <div style={{height:barH, background:"#f1f5f9",
        borderBottom:"1px solid #e2e8f0",
        display:"flex", alignItems:"center", gap:2*ratio, padding:`0 ${3*ratio}px`}}>
        {["#f87171","#fbbf24","#34d399"].map((c,i)=>(
          <div key={i} style={{width:2.5*ratio,height:2.5*ratio,borderRadius:"50%",background:c}}/>
        ))}
      </div>
      {/* Content */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",
        height:H-barH, padding:2}}>
        <PageWireframe type={pageIcon} w={W-4} h={H-barH-4} accent={accent}/>
      </div>
    </div>
  );
}

// ─── ACTION NODE ICON (diamond shape) ────────────────────────────────
const ACTION_SVGS = {

  // ── CONVERSÃO ──────────────────────────────────────────────────────
  // Purchase: círculo com cifrão $ branco dentro
  purchase: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={c} strokeWidth="2.2"/>
      <path d="M16 8v1.5M16 21v1.5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 18.5c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5-1.8-2.2-4-2.5c-2.2-.3-4-1.1-4-2.5s1.8-2.5 4-2.5 4 1.1 4 2.5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Form Complete: silhueta humana preenchida (busto)
  form: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="11" r="5" fill={c}/>
      <path d="M6 28c0-5.52 4.48-10 10-10s10 4.48 10 10" fill={c}/>
    </svg>
  ),

  // Schedule Meeting: calendário com grid de células e uma célula preenchida
  schedule: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="5" width="24" height="22" rx="2.5" fill="none"/>
      <line x1="4" y1="12" x2="28" y2="12"/>
      <line x1="11" y1="3" x2="11" y2="8"/>
      <line x1="21" y1="3" x2="21" y2="8"/>
      {/* grade 3x2 */}
      <line x1="4" y1="18" x2="28" y2="18" strokeWidth="1"/>
      <line x1="11" y1="12" x2="11" y2="27" strokeWidth="1"/>
      <line x1="19" y1="12" x2="19" y2="27" strokeWidth="1"/>
      {/* célula destacada */}
      <rect x="12" y="19.5" width="6" height="5" rx="0.5" fill={c} stroke="none"/>
    </svg>
  ),

  // Deal Won: aperto de mão + cifrão abaixo (igual ao Funnelytics)
  deal: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      {/* mão esquerda (palma + dedos apontando direita) */}
      <path d="M3 13c0 0 1-1.5 3-1.5h4c.8 0 2 .5 3 1l2 1h2c.8 0 1.5.7 1.5 1.5S17.8 16.5 17 16.5h-2" fill={c}/>
      {/* mão direita (palma + dedos apontando esquerda) */}
      <path d="M29 13c0 0-1-1.5-3-1.5h-4c-.8 0-2 .5-3 1l-2 1h-1c-.8 0-1.5.7-1.5 1.5S15.2 16.5 16 16.5h1" fill={c}/>
      {/* área de aperto central */}
      <path d="M10 11.5c1-1 2.5-1.5 4-1.5h4c1.5 0 2.5.5 3 1l1.5 1.5-1 1-2-1.5H13l-2 1.5-1-1z" fill={c}/>
      {/* dedos entrelaçados / aperto */}
      <path d="M9 15.5l2-3 3 1.5 2-1 3 1 2-1.5 2 2.5-3 2-3-1-2.5 1-3-1z" fill={c}/>
      {/* cifrão abaixo */}
      <path d="M16 21v.8M16 26.2v.8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M13.5 25.5c0 .9 1.1 1.5 2.5 1.5s2.5-.6 2.5-1.5-1.1-1.4-2.5-1.5c-1.4-.1-2.5-.7-2.5-1.5s1.1-1.5 2.5-1.5 2.5.6 2.5 1.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── ENGAJAMENTO ────────────────────────────────────────────────────
  // Watch Video: quadrado arredondado (TV) + triângulo play
  video: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="26" height="20" rx="3" fill="none"/>
      <polygon points="13,11 13,21 22,16" fill={c} stroke="none"/>
    </svg>
  ),

  // Link Click: elo de corrente (chain link) + cursor com faísca de clique
  linkclick: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* elo esquerdo */}
      <path d="M13 19l-2 2a4 4 0 01-5.66-5.66l4-4A4 4 0 0115 11"/>
      {/* elo direito */}
      <path d="M19 13l2-2a4 4 0 015.66 5.66l-4 4A4 4 0 0117 21"/>
      {/* cursor */}
      <path d="M20 20l-3 8 2-3 3 3 1.5-1.5-3-3 3-1.5z" fill={c} stroke="none"/>
      {/* faísca */}
      <line x1="23" y1="17" x2="25" y2="15" strokeWidth="1.5"/>
      <line x1="25" y1="19" x2="27" y2="19" strokeWidth="1.5"/>
      <line x1="23" y1="21" x2="25" y2="23" strokeWidth="1.5"/>
    </svg>
  ),

  // Scroll: círculo com setas up+down (indicador de scroll)
  scroll: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="12" fill="none"/>
      {/* seta para cima */}
      <polyline points="11,15 16,10 21,15"/>
      {/* seta para baixo */}
      <polyline points="11,17 16,22 21,17"/>
    </svg>
  ),

  // Button Click: cursor de mão com efeito de clique (dedão + raios)
  buttonclick: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* cursor/mão apontando */}
      <path d="M16 4l-2 8h-3l-2-1-1 1 3 12h8l5-7v-5c0-1-1-2-2-2s-2 1-2 2v-1c0-1-1-2-2-2s-2 1-2 1V4c0-1-1-2-2-2s-2 1-2 2z" fill={c} stroke="none"/>
      {/* raios de clique */}
      <line x1="24" y1="5" x2="26" y2="3" strokeWidth="2"/>
      <line x1="27" y1="9" x2="30" y2="8" strokeWidth="2"/>
      <line x1="25" y1="13" x2="28" y2="14" strokeWidth="2"/>
    </svg>
  ),

  // Deal Status: dois usuários (silhuetas sobrepostas)
  dealstatus: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      {/* pessoa da frente */}
      <circle cx="13" cy="10" r="4" fill={c}/>
      <path d="M3 28c0-5 4.5-9 10-9s10 4 10 9" fill={c}/>
      {/* pessoa atrás */}
      <circle cx="22" cy="10" r="3.5" fill={c} opacity="0.55"/>
      <path d="M21 19c1-.2 2-.3 3-.3 4.5 0 7.5 3 7.5 7" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55"/>
    </svg>
  ),

  // ── INTEGRAÇÃO ─────────────────────────────────────────────────────
  // GHL Appointment: calendário com gráfico de barras dentro
  "ghl-appoint": (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="5" width="24" height="22" rx="2.5" fill="none"/>
      <line x1="4" y1="12" x2="28" y2="12"/>
      <line x1="11" y1="3" x2="11" y2="8"/>
      <line x1="21" y1="3" x2="21" y2="8"/>
      {/* barras do gráfico */}
      <rect x="7" y="19" width="4" height="5" rx="0.5" fill={c} stroke="none"/>
      <rect x="14" y="15" width="4" height="9" rx="0.5" fill={c} stroke="none"/>
      <rect x="21" y="22" width="4" height="4" rx="0.5" fill={c} stroke="none"/>
    </svg>
  ),

  // GHL Order: calendário com cifrão $ no interior
  "ghl-order": (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="5" width="24" height="22" rx="2.5" fill="none"/>
      <line x1="4" y1="12" x2="28" y2="12"/>
      <line x1="11" y1="3" x2="11" y2="8"/>
      <line x1="21" y1="3" x2="21" y2="8"/>
      {/* cifrão */}
      <path d="M16 15v1M16 21v1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13.5 20c0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2-1.1-1.8-2.5-2-2.5-.9-2.5-2 1.1-2 2.5-2 2.5.9 2.5 2" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // GHL Opport: aperto de mão (handshake) + cifrão badge (laranja)
  "ghl-opport": (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      {/* mão esquerda */}
      <path d="M2 12.5c0 0 1-1.5 3-1.5h3.5c.7 0 1.8.4 2.8.9l1.8.9h1.5c.7 0 1.2.6 1.2 1.3s-.5 1.2-1.2 1.2H13" fill={c}/>
      {/* mão direita */}
      <path d="M22 12.5c0 0-1-1.5-3-1.5h-3c-.7 0-1.5.4-2.2.8L12 13h-1c-.7 0-1.2.6-1.2 1.3s.5 1.2 1.2 1.2h.8" fill={c}/>
      {/* aperto central */}
      <path d="M8.5 11c.8-.8 2-1.2 3.5-1.2h4c1.2 0 2.2.4 2.8.9l1.2 1.2-.8.8-1.6-1.2h-6.2l-1.6 1.2-.8-.8z" fill={c}/>
      <path d="M8 15l1.5-2.5 2.5 1.2 2-1 2.5.8 1.5-1.2 1.8 2-2.5 1.8-2.5-1-2 .8-2.5-.8z" fill={c}/>
      {/* badge $ no canto inferior direito */}
      <circle cx="25.5" cy="25.5" r="5.5" fill={c} stroke="none"/>
      <path d="M25.5 21.5v.7M25.5 28.3v.7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M23.3 27.2c0 .8 1 1.4 2.2 1.4s2.2-.6 2.2-1.4-1-1.2-2.2-1.3c-1.2-.1-2.2-.6-2.2-1.3s1-1.4 2.2-1.4 2.2.6 2.2 1.4" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // GHL Opport2: aperto de mão sem badge (laranja, variante)
  "ghl-opport2": (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M2 14c0 0 1-1.5 3-1.5h4c.7 0 1.8.4 2.6.9l1.8.9h1.5c.8 0 1.3.6 1.3 1.3s-.5 1.3-1.3 1.3H13" fill={c}/>
      <path d="M30 14c0 0-1-1.5-3-1.5h-4c-.7 0-1.8.4-2.6.9L18.5 14.3h-1.3c-.8 0-1.3.6-1.3 1.3s.5 1.3 1.3 1.3H18" fill={c}/>
      <path d="M8.5 12.3c.8-.8 2-1.3 3.5-1.3h4c1.2 0 2.2.4 2.8.9l1.2 1.2-.8.8-1.6-1.2H12l-1.6 1.2-.8-.8z" fill={c}/>
      <path d="M8 16l1.5-2.5 2.5 1.2 2-1 2.5.9 1.5-1.3 1.8 2-2.5 1.8-2.5-1-2 .8-2.5-.8z" fill={c}/>
    </svg>
  ),

  // Hubspot Deal: aperto de mão + cifrão badge (laranja-avermelhado)
  "hs-deal": (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M2 13c0 0 1-1.5 3-1.5h3.5c.7 0 1.8.4 2.6.9l1.8.9H15c.8 0 1.3.6 1.3 1.3S15.8 15.9 15 15.9h-2" fill={c}/>
      <path d="M23 13c0 0-1-1.5-3-1.5h-3c-.7 0-1.5.4-2.2.8L13 13.1h-1c-.8 0-1.3.6-1.3 1.3s.5 1.3 1.3 1.3h.8" fill={c}/>
      <path d="M8 11.5c.8-.8 2-1.2 3.5-1.2h4c1.2 0 2 .4 2.6.9l1.1 1.1-.7.7-1.5-1.1h-6l-1.5 1.1-.7-.7z" fill={c}/>
      <path d="M7.5 14.8l1.4-2.3 2.3 1.1 1.8-.9 2.3.8 1.4-1.1 1.6 1.8-2.3 1.7-2.3-.9-1.8.7-2.3-.7z" fill={c}/>
      <circle cx="25.5" cy="25.5" r="5.5" fill={c} stroke="none"/>
      <path d="M25.5 21.5v.7M25.5 28.3v.7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M23.3 27.2c0 .8 1 1.4 2.2 1.4s2.2-.6 2.2-1.4-1-1.2-2.2-1.3c-1.2-.1-2.2-.6-2.2-1.3s1-1.4 2.2-1.4 2.2.6 2.2 1.4" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // Hubspot Deal2: aperto de mão + cifrão badge (verde)
  "hs-deal2": (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M2 13c0 0 1-1.5 3-1.5h3.5c.7 0 1.8.4 2.6.9l1.8.9H15c.8 0 1.3.6 1.3 1.3S15.8 15.9 15 15.9h-2" fill={c}/>
      <path d="M23 13c0 0-1-1.5-3-1.5h-3c-.7 0-1.5.4-2.2.8L13 13.1h-1c-.8 0-1.3.6-1.3 1.3s.5 1.3 1.3 1.3h.8" fill={c}/>
      <path d="M8 11.5c.8-.8 2-1.2 3.5-1.2h4c1.2 0 2 .4 2.6.9l1.1 1.1-.7.7-1.5-1.1h-6l-1.5 1.1-.7-.7z" fill={c}/>
      <path d="M7.5 14.8l1.4-2.3 2.3 1.1 1.8-.9 2.3.8 1.4-1.1 1.6 1.8-2.3 1.7-2.3-.9-1.8.7-2.3-.7z" fill={c}/>
      <circle cx="25.5" cy="25.5" r="5.5" fill={c} stroke="none"/>
      <path d="M25.5 21.5v.7M25.5 28.3v.7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M23.3 27.2c0 .8 1 1.4 2.2 1.4s2.2-.6 2.2-1.4-1-1.2-2.2-1.3c-1.2-.1-2.2-.6-2.2-1.3s1-1.4 2.2-1.4 2.2.6 2.2 1.4" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── PERSONALIZADAS ─────────────────────────────────────────────────
  // Add To List: 3 linhas horizontais com bullets quadrados à esquerda
  addlist: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <rect x="4"  y="6"  width="4" height="4" rx="1" fill={c}/>
      <rect x="4"  y="14" width="4" height="4" rx="1" fill={c}/>
      <rect x="4"  y="22" width="4" height="4" rx="1" fill={c}/>
      <line x1="12" y1="8"  x2="28" y2="8"  stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="28" y2="16" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="12" y1="24" x2="28" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // Contact: balão de fala com 3 pontos (chat bubble)
  contact: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M28 5H4C2.9 5 2 5.9 2 7v14c0 1.1.9 2 2 2h5l5 5 5-5h9c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" fill={c}/>
      <circle cx="10" cy="14" r="2" fill="white"/>
      <circle cx="16" cy="14" r="2" fill="white"/>
      <circle cx="22" cy="14" r="2" fill="white"/>
    </svg>
  ),

  // Request Content: documento com dobra + linhas de conteúdo (4 linhas)
  reqcontent: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M19 3H8C6.9 3 6 3.9 6 5v22c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10l-7-7z" fill={c}/>
      <path d="M19 3v7h7" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <line x1="10" y1="15" x2="22" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="19" x2="22" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="23" x2="17" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Request Info: calendário com linhas de texto (2 linhas info)
  reqinfo: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="5" width="24" height="22" rx="2.5" fill="none"/>
      <line x1="4" y1="12" x2="28" y2="12"/>
      <line x1="11" y1="3" x2="11" y2="8"/>
      <line x1="21" y1="3" x2="21" y2="8"/>
      <line x1="8" y1="17" x2="24" y2="17"/>
      <line x1="8" y1="22" x2="20" y2="22"/>
    </svg>
  ),

  // Popup: janela modal com barra de título, X no canto, botão fechar
  popup: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      {/* janela de fundo (blur) */}
      <rect x="2" y="6" width="22" height="18" rx="2" fill={c} opacity="0.3" stroke={c} strokeWidth="1.5"/>
      {/* janela popup na frente */}
      <rect x="8" y="10" width="22" height="16" rx="2" fill={c}/>
      {/* barra de título */}
      <rect x="8" y="10" width="22" height="5" rx="2" fill="white" opacity="0.25"/>
      {/* X de fechar */}
      <line x1="26" y1="11.5" x2="28" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="11.5" x2="26" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      {/* botão */}
      <rect x="13" y="21" width="12" height="3" rx="1.5" fill="white" opacity="0.8"/>
    </svg>
  ),

  // Add To Cart: carrinho de compras preenchido
  addcart: (c) => (
    <svg viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h3l3.6 13H24l4-10H9" fill="none"/>
      <circle cx="13" cy="27" r="2" fill={c} stroke="none"/>
      <circle cx="23" cy="27" r="2" fill={c} stroke="none"/>
    </svg>
  ),

  // Add Tag: etiqueta de preço (price tag) com círculo no canto
  addtag: (c) => (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M28.5 15.5l-13-13H5v10.5l13 13c1.1 1.1 2.8 1.1 3.9 0l6.6-6.6c1.1-1.1 1.1-2.9 0-3.9z" fill={c}/>
      <circle cx="11" cy="11" r="2.5" fill="white"/>
    </svg>
  ),

};

function ActionNodeIcon({ actionIcon, actionBg, size=44 }) {
  const s  = size;
  const r  = s * 0.5;
  const pad = s * 0.22;
  const iconColor = "white";
  return (
    <div style={{ width:s, height:s, flexShrink:0, position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}
        style={{position:"absolute",top:0,left:0}}>
        <rect x={s*0.07} y={s*0.07} width={s*0.86} height={s*0.86} rx={s*0.1}
          fill={actionBg}
          transform={`rotate(45 ${r} ${r})`}/>
      </svg>
      <div style={{position:"relative", width:s-pad*2, height:s-pad*2,
        display:"flex", alignItems:"center", justifyContent:"center"}}>
        {ACTION_SVGS[actionIcon] ? ACTION_SVGS[actionIcon](iconColor) : <span style={{color:iconColor,fontSize:s*0.4}}>●</span>}
      </div>
    </div>
  );
}

// ─── PESSOA NODE ──────────────────────────────────────────────────────
const PESSOA_SVGS = {
  // Vendedor: pessoa com símbolo de cifrão / venda
  seller: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="29" cy="11" r="7" fill="white" opacity="0.25"/>
      <text x="29" y="14.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">$</text>
    </svg>
  ),
  // Customer Success: pessoa com check / coração
  cs: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="30" cy="10" r="6.5" fill="white" opacity="0.3"/>
      <path d="M27 10.5c.5-1 1.5-1.5 2.5-1 .5.2.9.6 1.2 1 .3-.4.7-.8 1.2-1 1-.5 2 0 2.5 1 .6 1.2 0 2.5-1 3.3L30 15l-3.4-2.2c-1-.8-1.6-2.1-1-3.3z" fill="white"/>
    </svg>
  ),
  // Gestor de Projeto: pessoa com prancheta / lista
  pm: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <rect x="24" y="4" width="13" height="16" rx="2" fill="white" opacity="0.3"/>
      <line x1="27" y1="9"  x2="34" y2="9"  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="27" y1="12" x2="34" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M27 15l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Gestor de Tráfego: pessoa com gráfico de barras / seta
  traffic: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <rect x="24" y="5" width="13" height="15" rx="2" fill="white" opacity="0.3"/>
      <rect x="26" y="14" width="2.5" height="4" rx="0.5" fill="white"/>
      <rect x="29.5" y="11" width="2.5" height="7" rx="0.5" fill="white"/>
      <rect x="33" y="13" width="2.5" height="5" rx="0.5" fill="white"/>
      <polyline points="27.2,13 30.8,10 34.2,12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  // Designer: pessoa com paleta de cores / pincel
  designer: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="30" cy="10" r="7" fill="white" opacity="0.3"/>
      <path d="M27 8.5c1.5-2 4-2.5 5.5-1s1 3.5-1 4.5c-1 .5-1.5 1-1.5 2h-2c0-1.5.8-2.5 2-3 1-.5 1.5-1.5.5-2.5s-2.5-.5-3 .5z" fill="white"/>
      <circle cx="30" cy="16.5" r="1" fill="white"/>
    </svg>
  ),
  // Desenvolvedor: pessoa com código { }
  dev: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <rect x="24" y="4" width="13" height="16" rx="2" fill="white" opacity="0.3"/>
      <path d="M28 10l-2 2 2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M32 10l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="29" y1="8" x2="31" y2="16" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  // Copywriter: pessoa com caneta / papel
  copy: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <rect x="24" y="5" width="12" height="15" rx="2" fill="white" opacity="0.3"/>
      <line x1="27" y1="9"  x2="33" y2="9"  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="27" y1="12" x2="33" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="27" y1="15" x2="30" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 15l2-2 1 1-2 2-1-1z" fill="white"/>
    </svg>
  ),
  // Analista: pessoa com lupa / dados
  analyst: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="29" cy="10" r="5" stroke="white" strokeWidth="1.8" fill="white" opacity="0.25"/>
      <line x1="33" y1="14" x2="36" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="10" x2="31" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="29" y1="8"  x2="29" y2="12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),

  // Social Media: pessoa + coração com raios de engajamento
  socialmedia: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="31" cy="9" r="7" fill="white" opacity="0.25"/>
      <path d="M28.2 8c.4-.8 1.3-1.2 2.1-.8.3.2.6.4.7.7.2-.3.4-.5.7-.7.8-.4 1.7 0 2.1.8.5.9.1 1.9-.7 2.6L31 13l-2.1-2.4c-.8-.7-1.2-1.7-.7-2.6z" fill="white"/>
      <line x1="35.5" y1="5.5" x2="37" y2="4" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="37" y1="9"  x2="39"  y2="9"  stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="35.5" y1="12.5" x2="37" y2="14" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),

  // Editor de Vídeo: pessoa + claquete com play
  videoeditor: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <rect x="24" y="3.5" width="14" height="12" rx="1.5" fill="white" opacity="0.25"/>
      <rect x="24" y="3.5" width="14" height="4" rx="1.5" fill="white" opacity="0.45"/>
      <line x1="27.5" y1="3.5" x2="26"   y2="7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="31.5" y1="3.5" x2="30"   y2="7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="35.5" y1="3.5" x2="34"   y2="7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <polygon points="27.5,9 27.5,14 33.5,11.5" fill="white"/>
    </svg>
  ),

  // Expert: pessoa + estrela de 5 pontas (medalha)
  expert: (
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="7" fill="white" opacity="0.95"/>
      <path d="M6 36c0-7.73 6.27-14 14-14s14 6.27 14 14" fill="white" opacity="0.95"/>
      <circle cx="31" cy="9.5" r="7" fill="white" opacity="0.25"/>
      <polygon
        points="31,3.5 32.6,8.3 37.6,8.3 33.6,11.2 35.1,16 31,13.1 26.9,16 28.4,11.2 24.4,8.3 29.4,8.3"
        fill="white"/>
    </svg>
  ),
};

function PessoaNodeIcon({ pessoaIcon, pessoaBg, size=56 }) {
  const s = size;
  return (
    <div style={{width:s, height:s, borderRadius:"50%", flexShrink:0, overflow:"hidden",
      background:pessoaBg, display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 2px 8px ${pessoaBg}55`}}>
      {PESSOA_SVGS[pessoaIcon] || <span style={{color:"white",fontSize:s*0.4}}>👤</span>}
    </div>
  );
}

// ─── PRODUTO NODE ─────────────────────────────────────────────────────
const PRODUTO_SVGS = {

  // Curso: monitor com play + graduação
  curso: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* tela */}
      <rect x="6" y="8" width="44" height="28" rx="4" fill="white" opacity="0.9"/>
      <rect x="10" y="12" width="36" height="20" rx="2" fill="currentColor" opacity="0.25"/>
      {/* play */}
      <polygon points="23,16 23,28 35,22" fill="white"/>
      {/* pé do monitor */}
      <rect x="25" y="36" width="6" height="5" rx="1" fill="white" opacity="0.7"/>
      <rect x="20" y="41" width="16" height="3" rx="1.5" fill="white" opacity="0.7"/>
      {/* capelo */}
      <polygon points="28,44 36,48 28,52 20,48" fill="white" opacity="0.9"/>
      <rect x="35" y="47" width="2" height="5" rx="1" fill="white" opacity="0.7"/>
    </svg>
  ),

  // Mentoria: duas silhuetas com balão de conversa
  mentoria: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* pessoa 1 */}
      <circle cx="18" cy="18" r="7" fill="white" opacity="0.9"/>
      <path d="M6 38c0-6.6 5.4-12 12-12s12 5.4 12 38" fill="white" opacity="0.9"/>
      <path d="M6 38c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="white" opacity="0.9"/>
      {/* pessoa 2 (menor, atrás) */}
      <circle cx="38" cy="20" r="6" fill="white" opacity="0.55"/>
      <path d="M26 38c0-5.5 4.5-10 12-10s12 4.5 12 10" fill="white" opacity="0.55"/>
      {/* balão de fala */}
      <rect x="30" y="8" width="20" height="13" rx="4" fill="white" opacity="0.4"/>
      <path d="M35 21l-3 3 5-3z" fill="white" opacity="0.4"/>
      <line x1="34" y1="13" x2="46" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="16.5" x2="42" y2="16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Webinário: câmera de vídeo com sinal ao vivo
  webinario: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* corpo câmera */}
      <rect x="6" y="16" width="30" height="22" rx="4" fill="white" opacity="0.9"/>
      {/* lente */}
      <circle cx="21" cy="27" r="7" fill="currentColor" opacity="0.3"/>
      <circle cx="21" cy="27" r="4" fill="white" opacity="0.9"/>
      {/* triângulo lateral */}
      <path d="M37 20l13-6v26l-13-6z" fill="white" opacity="0.75"/>
      {/* sinal ao vivo */}
      <circle cx="44" cy="10" r="3" fill="white" opacity="0.9"/>
      <path d="M40 7a6 6 0 010 8.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M37.5 4.5a10 10 0 010 14" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  // Workshop: mãos construindo / ferramentas cruzadas
  workshop: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* martelo */}
      <rect x="10" y="22" width="22" height="8" rx="3" fill="white" opacity="0.9" transform="rotate(-45 21 26)"/>
      <rect x="18" y="28" width="5" height="18" rx="2.5" fill="white" opacity="0.75" transform="rotate(-45 21 37)"/>
      {/* chave de fenda cruzada */}
      <rect x="28" y="8" width="5" height="22" rx="2.5" fill="white" opacity="0.75" transform="rotate(45 30 19)"/>
      <rect x="26" y="6" width="9" height="6" rx="2" fill="white" opacity="0.9" transform="rotate(45 30 9)"/>
      {/* estrela de destaque */}
      <circle cx="42" cy="42" r="10" fill="white" opacity="0.2"/>
      <polygon points="42,35 43.8,40.5 49.5,40.5 45,43.8 46.8,49.5 42,46 37.2,49.5 39,43.8 34.5,40.5 40.2,40.5" fill="white" opacity="0.9"/>
    </svg>
  ),

  // Ebook: livro aberto com páginas
  ebook: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* capa esquerda */}
      <path d="M8 10h18v38H8a2 2 0 01-2-2V12a2 2 0 012-2z" fill="white" opacity="0.5"/>
      {/* capa direita */}
      <path d="M30 10h18a2 2 0 012 2v34a2 2 0 01-2 2H30V10z" fill="white" opacity="0.9"/>
      {/* lombada */}
      <rect x="25" y="8" width="6" height="42" rx="1" fill="white" opacity="0.7"/>
      {/* linhas de texto */}
      <line x1="33" y1="20" x2="45" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="33" y1="26" x2="45" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="33" y1="32" x2="45" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="33" y1="38" x2="40" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),

  // Ferramenta: engrenagem
  ferramenta: (
    <svg viewBox="0 0 56 56" fill="none">
      <path d="M28 18a10 10 0 100 20 10 10 0 000-20z" fill="white" opacity="0.3"/>
      <circle cx="28" cy="28" r="6" fill="white" opacity="0.9"/>
      {/* dentes da engrenagem */}
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const r1=12, r2=17, a=deg*Math.PI/180;
        const x1=28+r1*Math.cos(a), y1=28+r1*Math.sin(a);
        const x2=28+r2*Math.cos(a), y2=28+r2*Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>;
      })}
    </svg>
  ),

  // Imersão: óculos de mergulho / VR + ondas
  imersao: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* óculos VR */}
      <rect x="6" y="18" width="44" height="22" rx="8" fill="white" opacity="0.9"/>
      {/* lentes */}
      <circle cx="19" cy="29" r="7" fill="currentColor" opacity="0.3"/>
      <circle cx="37" cy="29" r="7" fill="currentColor" opacity="0.3"/>
      <circle cx="19" cy="29" r="4" fill="white" opacity="0.7"/>
      <circle cx="37" cy="29" r="4" fill="white" opacity="0.7"/>
      {/* divisória central */}
      <rect x="26" y="22" width="4" height="14" rx="2" fill="white" opacity="0.5"/>
      {/* ondas abaixo */}
      <path d="M12 44 Q18 40 24 44 Q30 48 36 44 Q42 40 48 44" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),

  // Evento Presencial: localização + pessoas + microfone
  evento: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* pin de localização */}
      <path d="M28 6C21.4 6 16 11.4 16 18c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="white" opacity="0.9"/>
      <circle cx="28" cy="18" r="5" fill="currentColor" opacity="0.35"/>
      {/* microfone */}
      <rect x="38" y="30" width="6" height="12" rx="3" fill="white" opacity="0.9"/>
      <path d="M36 38c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="41" y1="44" x2="41" y2="48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="38" y1="48" x2="44" y2="48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      {/* pessoas na base */}
      <circle cx="10" cy="42" r="4" fill="white" opacity="0.7"/>
      <path d="M4 54c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white" opacity="0.7"/>
      <circle cx="22" cy="40" r="4" fill="white" opacity="0.55"/>
      <path d="M16 54c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white" opacity="0.55"/>
    </svg>
  ),
};

function ProdutoNodeIcon({ produtoIcon, produtoBg, size=72 }) {
  const s = size;
  return (
    <div style={{
      width:s, height:s, borderRadius:16, flexShrink:0,
      background:produtoBg,
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 4px 16px ${produtoBg}55`,
      overflow:"hidden", position:"relative",
    }}>
      {/* brilho no topo */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"45%",
        background:"rgba(255,255,255,0.12)",borderRadius:"16px 16px 60% 60%"}}/>
      <div style={{width:s*0.82, height:s*0.82, color:produtoBg}}>
        {PRODUTO_SVGS[produtoIcon] || <span style={{color:"white",fontSize:s*0.4}}>📦</span>}
      </div>
    </div>
  );
}


// Returns an SVG path/shape for each flowchart symbol, normalized to viewBox 0 0 W H
// w,h = actual pixel dimensions of the node on canvas
function FormaShapeSVG({ shape, w, h, bg, color, label, selected, scale=1, fontSize=11 }) {
  const sw = Math.max(1, 1.5 * scale); // stroke width
  const sel = selected;
  const stroke = sel ? "white" : bg;

  const shapeEl = (() => {
    switch(shape) {
      // ── Processo: retângulo simples ─────────────────────────────────
      case "processo":
        return <rect x={sw} y={sw} width={w-sw*2} height={h-sw*2} rx={3*scale} fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;

      // ── Decisão: losango ────────────────────────────────────────────
      case "decisao":
        return <polygon points={`${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;

      // ── Início/Fim: cápsula (rounded rect) ─────────────────────────
      case "inicio":
        return <rect x={sw} y={sw} width={w-sw*2} height={h-sw*2} rx={(h-sw*2)/2} fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;

      // ── Dados E/S: paralelogramo ────────────────────────────────────
      case "dados": {
        const off = w*0.18;
        return <polygon points={`${off+sw},${sw} ${w-sw},${sw} ${w-off-sw},${h-sw} ${sw},${h-sw}`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Documento: retângulo com borda ondulada embaixo ─────────────
      case "documento": {
        const amp = h*0.12, wv = w*0.5;
        return <path d={`M${sw},${sw} H${w-sw} V${h-amp-sw} Q${w-wv/2},${h-sw} ${w/2},${h-amp-sw} Q${wv/2},${h-amp*2} ${sw},${h-amp-sw} Z`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Multi-documento: 3 documentos empilhados ───────────────────
      case "multidoc": {
        const amp = h*0.1;
        return <>
          <path d={`M${sw+5*scale},${sw+4*scale} H${w-sw} V${h-amp-sw-4*scale} Q${w-w*0.4},${h-sw-2*scale} ${w/2+4*scale},${h-amp-sw-4*scale} Q${w*0.18},${h-amp*1.8-sw-4*scale} ${sw+5*scale},${h-amp-sw-4*scale} Z`} fill={bg} opacity="0.5"/>
          <path d={`M${sw+2.5*scale},${sw+2*scale} H${w-sw-2.5*scale} V${h-amp-sw-2*scale} Q${w-w*0.42},${h-sw-1*scale} ${w/2+2*scale},${h-amp-sw-2*scale} Q${w*0.2},${h-amp*1.8-sw-2*scale} ${sw+2.5*scale},${h-amp-sw-2*scale} Z`} fill={bg} opacity="0.75"/>
          <path d={`M${sw},${sw} H${w-sw} V${h-amp-sw} Q${w-w*0.45},${h-sw} ${w/2},${h-amp-sw} Q${w*0.22},${h-amp*2} ${sw},${h-amp-sw} Z`}
            fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>
        </>;
      }

      // ── Banco de Dados: cilindro ────────────────────────────────────
      case "bdados": {
        const ry = h*0.15;
        return <>
          <path d={`M${sw},${ry+sw} Q${sw},${sw} ${w/2},${sw} Q${w-sw},${sw} ${w-sw},${ry+sw} L${w-sw},${h-ry-sw} Q${w-sw},${h-sw} ${w/2},${h-sw} Q${sw},${h-sw} ${sw},${h-ry-sw} Z`}
            fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>
          <ellipse cx={w/2} cy={ry+sw} rx={(w-sw*2)/2} ry={ry} fill={bg} stroke="white" strokeWidth={sw*0.7} opacity="0.6"/>
        </>;
      }

      // ── Operação Manual: trapézio (topo estreito) ───────────────────
      case "manual": {
        const off = w*0.15;
        return <polygon points={`${off+sw},${sw} ${w-off-sw},${sw} ${w-sw},${h-sw} ${sw},${h-sw}`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Preparação: hexágono ────────────────────────────────────────
      case "preparacao": {
        const m = w*0.22;
        return <polygon points={`${m+sw},${sw} ${w-m-sw},${sw} ${w-sw},${h/2} ${w-m-sw},${h-sw} ${m+sw},${h-sw} ${sw},${h/2}`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Conector: círculo ───────────────────────────────────────────
      case "conector":
        return <circle cx={w/2} cy={h/2} r={Math.min(w,h)/2-sw} fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;

      // ── Display: pentágono com ponta à esquerda ─────────────────────
      case "display": {
        const tip = w*0.22;
        return <polygon points={`${sw},${h/2} ${tip},${sw} ${w-sw},${sw} ${w-sw},${h-sw} ${tip},${h-sw}`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Atraso: retângulo com semi-círculo à direita ────────────────
      case "atraso": {
        const r2 = (h-sw*2)/2;
        return <path d={`M${sw},${sw} H${w-r2-sw} A${r2},${r2} 0 0 1 ${w-r2-sw},${h-sw} H${sw} Z`}
          fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>;
      }

      // ── Nota/Comentário: retângulo com canto dobrado ────────────────
      case "nota": {
        const fold = 14*scale;
        return <>
          <polygon points={`${sw},${sw} ${w-fold-sw},${sw} ${w-sw},${fold+sw} ${w-sw},${h-sw} ${sw},${h-sw}`}
            fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>
          <polyline points={`${w-fold-sw},${sw} ${w-fold-sw},${fold+sw} ${w-sw},${fold+sw}`}
            fill="none" stroke={sel?"white":color==="white"?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.15)"} strokeWidth={sw}/>
        </>;
      }

      // ── Ou (OR): círculo com + dentro ──────────────────────────────
      case "ou":
        return <>
          <circle cx={w/2} cy={h/2} r={Math.min(w,h)/2-sw} fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>
          <line x1={w/2} y1={sw*2+2} x2={w/2} y2={h-sw*2-2} stroke="white" strokeWidth={sw*1.2} strokeLinecap="round"/>
          <line x1={sw*2+2} y1={h/2} x2={w-sw*2-2} y2={h/2} stroke="white" strokeWidth={sw*1.2} strokeLinecap="round"/>
        </>;

      // ── E (AND): círculo com X dentro ──────────────────────────────
      case "e": {
        const r3 = Math.min(w,h)/2-sw;
        const d2 = r3*0.6;
        return <>
          <circle cx={w/2} cy={h/2} r={r3} fill={bg} stroke={sel?"white":"none"} strokeWidth={sel?sw*1.5:0}/>
          <line x1={w/2-d2} y1={h/2-d2} x2={w/2+d2} y2={h/2+d2} stroke="white" strokeWidth={sw*1.2} strokeLinecap="round"/>
          <line x1={w/2+d2} y1={h/2-d2} x2={w/2-d2} y2={h/2+d2} stroke="white" strokeWidth={sw*1.2} strokeLinecap="round"/>
        </>;
      }

      default: return <rect x={sw} y={sw} width={w-sw*2} height={h-sw*2} rx={3} fill={bg}/>;
    }
  })();

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible",display:"block"}}>
      {shapeEl}
      {label && (
        <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize} fontWeight="600" fill={color||"white"}
          fontFamily="Outfit,Arial,sans-serif" style={{pointerEvents:"none"}}
          clipPath={`inset(0 round 2px)`}>
          {label}
        </text>
      )}
    </svg>
  );
}

// Thumbnail for sidebar (fixed size preview)
function FormaThumb({ shape, bg, color, size=52 }) {
  // aspect ratios per shape
  const ar = {decisao:1, conector:1, ou:1, e:1, bdados:0.75};
  const ratio = ar[shape]||1.55;
  const tw = shape==="conector"||shape==="ou"||shape==="e" ? size*0.75 : size;
  const th = shape==="conector"||shape==="ou"||shape==="e" ? size*0.75 : Math.round(tw/ratio);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      width:size,height:Math.round(size*0.65)}}>
      <FormaShapeSVG shape={shape} w={tw} h={th} bg={bg} color={color} scale={0.8}/>
    </div>
  );
}

function GlobalCss({ T }) {
  return <style>{`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:${T.bg};color:${T.text};height:100vh;overflow:hidden}
input,select,textarea{font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-up{animation:fadeUp .35s ease both}
.fade-down{animation:fadeDown .15s ease both}
/* Show ports on node hover */
div:hover > .node-port,
div:hover > div > .node-port { opacity:1 !important; }
/* Always show ports when a connection is in progress (data-active) */
.node-port[data-active="1"] { opacity:1 !important; }
/* When canvas is in connecting mode — show ALL ports as targets */
.connecting .node-port { opacity:1 !important; }
/* del-btn only shows on hover */
.del-btn{opacity:0;transition:opacity .15s}
div:hover > .del-btn{opacity:1}
`}</style>;
}

function Toast({ msg, type }) {
  const T = useT();
  if (!msg) return null;
  const col = type==="error"?"#ef4444":type==="info"?T.accent:T.green;
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:T.surface2,border:`1px solid ${col}`,borderRadius:12,
      padding:"10px 20px",fontSize:13,fontWeight:500,color:T.text,zIndex:9999,
      display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,.2)",
      animation:"fadeUp .3s ease"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:col,flexShrink:0}} />
      {msg}
    </div>
  );
}

function NodeIconCircle({ type, size=44 }) {
  const def = NODE_DEFS[type]; if(!def) return null;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:def.bg,flexShrink:0,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:def.iconType==="text"?size*0.4:size*0.46,fontWeight:800,
      color:def.iconType==="text"?def.iconColor:undefined,
      border:def.bg==="#fff"?"2px solid #e5e7eb":"none",
      boxShadow:`0 2px 8px ${def.accent}44`,userSelect:"none"}}>
      {def.iconType==="svg"&&SVG_ICONS[def.icon]?SVG_ICONS[def.icon](size):def.icon}
    </div>
  );
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const T = useT();
  const [mode,setMode]   = useState("login");
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [name,setName]   = useState("");
  const [loading,setLoading] = useState(false);
  const [err,setErr]     = useState("");

  async function submit() {
    if(!email||!pass){setErr("Preencha todos os campos");return;}
    if(mode==="register"&&!name){setErr("Digite seu nome");return;}
    setLoading(true);setErr("");
    try {
      if(mode==="register"){
        const { data, error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { name } }
        });
        if(error) { setErr(error.message); setLoading(false); return; }
        if(data.user) onLogin({ id: data.user.id, email, name });
        else setErr("Confirme seu e-mail para continuar.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email, password: pass
        });
        if(error) { setErr("E-mail ou senha incorretos"); setLoading(false); return; }
        const profile = await dbGetProfile(data.user.id);
        onLogin({
          id:    data.user.id,
          email: data.user.email,
          name:  profile?.name || data.user.user_metadata?.name || email.split("@")[0]
        });
      }
    } catch(e){ setErr("Erro interno: "+e.message); }
    setLoading(false);
  }

  const inp = (val,set,ph,type="text") => (
    <input value={val} onChange={e=>set(e.target.value)} type={type} placeholder={ph}
      onKeyDown={e=>e.key==="Enter"&&submit()}
      style={{width:"100%",padding:"10px 14px",background:T.bg,border:`1px solid ${T.border}`,
        borderRadius:9,color:T.text,fontSize:13,outline:"none",fontFamily:"Outfit,sans-serif",
        transition:"border-color .2s"}}
      onFocus={e=>e.target.style.borderColor=T.accent}
      onBlur={e=>e.target.style.borderColor=T.border} />
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",background:T.bg}}>
      <GlobalCss T={T} />
      <div className="fade-up" style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:36,marginBottom:8}}>🗺️</div>
          <div style={{fontWeight:800,fontSize:28,
            background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FunnelMap</div>
          <div style={{color:T.muted,fontSize:13,marginTop:4}}>Construa funis de alta conversão</div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:20,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,.12)"}}>
          <div style={{display:"flex",gap:4,background:T.bg,borderRadius:10,padding:4,marginBottom:24}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",
                  fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:600,transition:"all .2s",
                  background:mode===m?T.surface2:"transparent",
                  color:mode===m?T.text:T.muted}}>
                {m==="login"?"Entrar":"Criar conta"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {mode==="register"&&(
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:T.muted2,
                textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Nome</label>
                {inp(name,setName,"João Silva")}</div>
            )}
            <div><label style={{display:"block",fontSize:11,fontWeight:600,color:T.muted2,
              textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>E-mail</label>
              {inp(email,setEmail,"seu@email.com","email")}</div>
            <div><label style={{display:"block",fontSize:11,fontWeight:600,color:T.muted2,
              textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Senha</label>
              {inp(pass,setPass,"••••••••","password")}</div>
          </div>
          {err&&<div style={{marginTop:12,color:"#ef4444",fontSize:12,textAlign:"center"}}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{width:"100%",marginTop:20,padding:"12px 0",
              background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
              border:"none",borderRadius:11,color:"white",fontFamily:"Outfit,sans-serif",
              fontSize:14,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:`0 4px 20px ${T.accent}44`}}>
            {loading
              ?<div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin .7s linear infinite"}} />
              :(mode==="login"?"Entrar →":"Criar conta →")}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:16,color:T.muted,fontSize:12}}>
          Seus dados ficam salvos com segurança 🔒
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────
// ─── MEMBER AVATAR COLORS ────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#6366f1","#fff"],["#f59e0b","#fff"],["#10b981","#fff"],["#ef4444","#fff"],
  ["#0ea5e9","#fff"],["#ec4899","#fff"],["#8b5cf6","#fff"],["#14b8a6","#fff"],
  ["#f97316","#fff"],["#3b82f6","#fff"],["#a855f7","#fff"],["#06b6d4","#fff"],
];
function memberColor(name="") {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffffff;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function MemberAvatar({member, size=28, border, overlap=false}) {
  const [bg,fg] = memberColor(member.name||member.email||"?");
  const initials = (member.name||member.email||"?")
    .split(/[\s@]/)[0].slice(0,2).toUpperCase();
  return (
    <div title={member.name||member.email}
      style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
        background:member.avatar?`url(${member.avatar}) center/cover`:bg,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.36,fontWeight:700,color:fg,
        border:`2px solid ${border||"transparent"}`,
        boxSizing:"border-box",
        marginLeft:overlap?-size*0.35:0,
        transition:"transform .15s",cursor:"default"}}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15) translateY(-2px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {!member.avatar && initials}
    </div>
  );
}

function FunnelCard({ funnel, onOpen, onDelete, onUpdateMembers }) {
  const T = useT();
  const nc=Object.keys(funnel.nodes||{}).length, cc=(funnel.connections||[]).length;
  const date=new Date(funnel.updatedAt).toLocaleDateString("pt-BR");
  const members = funnel.members||[];
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [newEmail, setNewEmail]   = useState("");
  const [newName,  setNewName]    = useState("");
  const [addError, setAddError]   = useState("");
  const MAX_VISIBLE = 4;

  function addMember(e) {
    e.stopPropagation();
    const email = newEmail.trim().toLowerCase();
    const name  = newName.trim() || email.split("@")[0];
    if(!email) { setAddError("Digite um e-mail."); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAddError("E-mail inválido."); return; }
    if(members.find(m=>m.email===email)) { setAddError("Já adicionado."); return; }
    const updated = [...members, {email, name, addedAt:Date.now()}];
    onUpdateMembers(funnel.id, updated);
    setNewEmail(""); setNewName(""); setAddError("");
  }
  function removeMember(email, e) {
    e.stopPropagation();
    onUpdateMembers(funnel.id, members.filter(m=>m.email!==email));
  }

  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,
      overflow:"visible",cursor:"pointer",transition:"all .2s",position:"relative"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>

      {/* Preview icons */}
      <div style={{height:72,background:T.surface2,padding:12,borderRadius:"16px 16px 0 0",
        display:"flex",gap:6,alignItems:"center",overflow:"hidden"}}>
        {nc===0
          ?<div style={{color:T.muted,fontSize:11,margin:"auto"}}>Canvas vazio</div>
          :Object.values(funnel.nodes||{}).slice(0,5).map(n=>{
              const d=NODE_DEFS[n.type]||NODE_DEFS.landing;
              return <div key={n.id} style={{width:34,height:34,borderRadius:"50%",background:d.bg||T.accent,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{d.icon}</div>;
            })}
        {nc>5&&<div style={{color:T.muted,fontSize:11}}>+{nc-5}</div>}
      </div>

      <div style={{padding:"14px 16px"}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:T.text}}>{funnel.name}</div>
        <div style={{color:T.muted,fontSize:11,marginBottom:12}}>
          {date} · {nc} elementos · {cc} conexões
        </div>

        {/* ── Membros ── */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}
          onClick={e=>e.stopPropagation()}>

          {/* Avatares sobrepostos */}
          <div style={{display:"flex",alignItems:"center"}}>
            {members.slice(0,MAX_VISIBLE).map((m,i)=>(
              <MemberAvatar key={m.email} member={m} size={28}
                border={T.surface} overlap={i>0}/>
            ))}
            {members.length>MAX_VISIBLE&&(
              <div style={{width:28,height:28,borderRadius:"50%",
                background:T.surface3,border:`2px solid ${T.surface}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:10,fontWeight:700,color:T.muted,marginLeft:-28*0.35,
                flexShrink:0}}>
                +{members.length-MAX_VISIBLE}
              </div>
            )}
          </div>

          {/* Botão + */}
          <button
            onClick={e=>{e.stopPropagation();setShowMemberPanel(p=>!p);}}
            style={{width:28,height:28,borderRadius:"50%",
              border:`2px dashed ${T.border2}`,background:"transparent",
              color:T.muted,fontSize:16,lineHeight:1,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .15s",flexShrink:0,fontFamily:"Outfit,sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=T.muted;}}>
            +
          </button>

          {members.length===0&&(
            <span style={{fontSize:11,color:T.muted,fontStyle:"italic"}}>
              Adicionar membros
            </span>
          )}
        </div>

        {/* Botões ação */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onOpen}
            style={{flex:1,padding:"8px 0",
              background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
              border:"none",borderRadius:8,color:"white",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Abrir ↗</button>
          <button onClick={e=>{e.stopPropagation();onDelete();}}
            style={{padding:"8px 12px",background:"transparent",
              border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,
              fontSize:12,cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef4444";e.currentTarget.style.color="#ef4444";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>🗑</button>
        </div>
      </div>

      {/* ── Painel de membros ── */}
      {showMemberPanel&&(
        <div onClick={e=>e.stopPropagation()}
          style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,
            width:300,zIndex:500,
            background:T.surface,border:`1px solid ${T.border}`,
            borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,.3)",
            padding:16,animation:"fadeUp .18s ease"}}>

          <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:14,
            display:"flex",alignItems:"center",gap:8}}>
            <span>👥</span> Membros da equipe
            <button onClick={()=>setShowMemberPanel(false)}
              style={{marginLeft:"auto",background:"transparent",border:"none",
                color:T.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          </div>

          {/* Lista de membros existentes */}
          {members.length>0&&(
            <div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:6,
              maxHeight:160,overflowY:"auto"}}>
              {members.map(m=>(
                <div key={m.email}
                  style={{display:"flex",alignItems:"center",gap:8,
                    padding:"6px 8px",borderRadius:8,background:T.surface2}}>
                  <MemberAvatar member={m} size={30} border={T.border}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {m.name||m.email}
                    </div>
                    <div style={{fontSize:10,color:T.muted,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {m.email}
                    </div>
                  </div>
                  <button onClick={e=>removeMember(m.email,e)}
                    style={{background:"transparent",border:"none",color:T.muted,
                      cursor:"pointer",fontSize:13,padding:"2px 4px",borderRadius:4,
                      transition:"color .15s",lineHeight:1}}
                    onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                    onMouseLeave={e=>e.currentTarget.style.color=T.muted}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo membro */}
          <div style={{borderTop:members.length>0?`1px solid ${T.border}`:"none",
            paddingTop:members.length>0?12:0}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",
              letterSpacing:"0.8px",color:T.muted2,marginBottom:8}}>Convidar membro</div>

            <div style={{marginBottom:6}}>
              <input value={newName}
                onChange={e=>setNewName(e.target.value)}
                placeholder="Nome (opcional)"
                style={{width:"100%",padding:"7px 10px",background:T.surface2,
                  border:`1px solid ${T.border}`,borderRadius:8,color:T.text,
                  fontSize:12,outline:"none",fontFamily:"Outfit,sans-serif",
                  boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor=T.accent}
                onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>

            <div style={{display:"flex",gap:6}}>
              <input value={newEmail}
                onChange={e=>{setNewEmail(e.target.value);setAddError("");}}
                onKeyDown={e=>e.key==="Enter"&&addMember(e)}
                placeholder="email@exemplo.com"
                type="email"
                style={{flex:1,padding:"7px 10px",background:T.surface2,
                  border:`1px solid ${addError?T.accent+"88":T.border}`,
                  borderRadius:8,color:T.text,fontSize:12,outline:"none",
                  fontFamily:"Outfit,sans-serif"}}
                onFocus={e=>e.target.style.borderColor=T.accent}
                onBlur={e=>e.target.style.borderColor=addError?T.accent+"88":T.border}/>
              <button onClick={addMember}
                style={{padding:"7px 14px",background:T.accent,border:"none",
                  borderRadius:8,color:"white",fontSize:12,fontWeight:700,
                  cursor:"pointer",fontFamily:"Outfit,sans-serif",flexShrink:0,
                  transition:"opacity .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                Adicionar
              </button>
            </div>

            {addError&&(
              <div style={{fontSize:11,color:"#ef4444",marginTop:5}}>⚠ {addError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ user, onOpen, onLogout }) {
  const T = useT();
  const [funnels,setFunnels] = useState(null);
  const [creating,setCreating] = useState(false);
  const [newName,setNewName]   = useState("");
  const [toast,setToast]       = useState(null);
  function showToast(m,t="success"){setToast({msg:m,type:t});setTimeout(()=>setToast(null),2800);}
  useEffect(()=>{loadFunnels();},[]);
  async function loadFunnels(){
    const list = await dbGetFunnels(user.id);
    // Normalise dates (Supabase returns ISO strings)
    setFunnels(list.map(f=>({
      ...f,
      updatedAt: new Date(f.updated_at||f.updatedAt).getTime(),
      nodes:       f.nodes       || {},
      connections: f.connections || [],
      members:     f.members     || [],
    })));
  }
  async function createFunnel(){
    if(!newName.trim())return;
    const id="fn_"+Date.now();
    const f={id,name:newName.trim(),owner_id:user.id,nodes:{},connections:[],members:[]};
    const ok = await dbSaveFunnel(user.id, f);
    if(!ok){showToast("Erro ao criar funil","error");return;}
    setCreating(false);setNewName("");showToast("✅ Funil criado!");loadFunnels();
  }
  async function deleteFunnel(id){
    if(!confirm("Excluir este funil?"))return;
    await dbDeleteFunnel(id);
    showToast("🗑 Funil excluído","info");loadFunnels();
  }
  async function updateMembers(funnelId, members){
    const f = funnels.find(x=>x.id===funnelId); if(!f) return;
    const updated = {...f, members};
    await dbSaveFunnel(user.id, updated);
    setFunnels(prev=>prev.map(x=>x.id===funnelId?updated:x));
  }
  const stats=funnels?{
    total:funnels.length,
    nodes:funnels.reduce((a,f)=>a+Object.keys(f.nodes||{}).length,0),
    conns:funnels.reduce((a,f)=>a+(f.connections||[]).length,0),
  }:null;
  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <GlobalCss T={T}/>
      {toast&&<Toast {...toast}/>}
      <div style={{height:56,background:T.surface,borderBottom:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",padding:"0 24px",gap:16}}>
        <div style={{fontWeight:800,fontSize:20,
          background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🗺️ FunnelMap</div>
        <div style={{flex:1}}/>
        <div style={{color:T.muted2,fontSize:13}}>Olá, <b style={{color:T.text}}>{user.name}</b></div>
        <button onClick={onLogout}
          style={{padding:"6px 14px",background:"transparent",border:`1px solid ${T.border}`,
            borderRadius:8,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef4444";e.currentTarget.style.color="#ef4444";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
          Sair
        </button>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        <div className="fade-up" style={{display:"flex",alignItems:"center",
          justifyContent:"space-between",marginBottom:32}}>
          <div>
            <h1 style={{fontWeight:800,fontSize:26,color:T.text}}>Meus Funis</h1>
            <p style={{color:T.muted,fontSize:13,marginTop:4}}>Construa e gerencie seus funis</p>
          </div>
          <button onClick={()=>setCreating(true)}
            style={{padding:"10px 20px",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
              border:"none",borderRadius:11,color:"white",fontSize:13,fontWeight:700,
              cursor:"pointer",fontFamily:"Outfit,sans-serif",
              boxShadow:`0 4px 20px ${T.accent}33`}}>+ Novo funil</button>
        </div>
        {stats&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
            {[{l:"Total de funis",v:stats.total,i:"🗺️",c:T.accent},
              {l:"Elementos",v:stats.nodes,i:"📦",c:T.accent2},
              {l:"Conexões",v:stats.conns,i:"🔗",c:T.green}].map(s=>(
              <div key={s.l} style={{background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:24}}>{s.i}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:22,color:s.c}}>{s.v}</div>
                  <div style={{color:T.muted,fontSize:12}}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {creating&&(
          <div className="fade-up" style={{background:T.surface2,border:`1px solid ${T.accent}`,
            borderRadius:14,padding:20,marginBottom:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:T.text}}>✨ Novo funil</div>
            <div style={{display:"flex",gap:10}}>
              <input value={newName} onChange={e=>setNewName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&createFunnel()}
                placeholder="Nome do funil..." autoFocus
                style={{flex:1,padding:"9px 14px",background:T.bg,border:`1px solid ${T.border}`,
                  borderRadius:9,color:T.text,fontSize:13,outline:"none",fontFamily:"Outfit,sans-serif"}}/>
              <button onClick={createFunnel}
                style={{padding:"9px 18px",background:T.accent,border:"none",borderRadius:9,
                  color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Criar</button>
              <button onClick={()=>{setCreating(false);setNewName("");}}
                style={{padding:"9px 14px",background:"transparent",border:`1px solid ${T.border}`,
                  borderRadius:9,color:T.muted,fontSize:13,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancelar</button>
            </div>
          </div>
        )}
        {funnels===null
          ?<div style={{display:"flex",justifyContent:"center",padding:60}}>
              <div style={{width:28,height:28,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
            </div>
          :funnels.length===0
            ?<div style={{textAlign:"center",padding:"60px 0",background:T.surface,
                border:`1px dashed ${T.border}`,borderRadius:16}}>
                <div style={{fontSize:48,marginBottom:12}}>🗺️</div>
                <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Nenhum funil ainda</div>
                <div style={{color:T.muted,fontSize:13}}>Clique em "Novo funil" para começar</div>
              </div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                {funnels.map(f=><FunnelCard key={f.id} funnel={f} onOpen={()=>onOpen(f)} onDelete={()=>deleteFunnel(f.id)} onUpdateMembers={updateMembers}/>)}
              </div>
        }
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────
function SidebarPanel({ onDragStart, width, onResize }) {
  const T = useT();
  const [tab,setTab]       = useState("Fontes");
  const [search,setSearch] = useState("");
  const groups  = SIDEBAR_GROUPS[tab]||[];
  const filtered = search.trim()
    ? groups.map(g=>({...g,items:g.items.filter(t=>NODE_DEFS[t]?.label.toLowerCase().includes(search.toLowerCase()))})).filter(g=>g.items.length>0)
    : groups;

  // Compute grid columns based on width
  const cols = width < 180 ? 2 : width < 260 ? 3 : width < 360 ? 4 : width < 460 ? 5 : 6;
  const itemSize = width < 180 ? 36 : width < 260 ? 42 : width < 360 ? 48 : 56;
  const fontSize = width < 180 ? 8 : width < 260 ? 9 : 10;

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX, startW = width;
    function onMove(ev) { onResize(Math.max(160, Math.min(600, startW + (ev.clientX - startX)))); }
    function onUp() { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div style={{width, background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden",
      position:"relative"}}>

      {/* Search */}
      <div style={{padding:"10px 10px 6px"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:T.muted}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Procurar..."
            style={{width:"100%",padding:"6px 8px 6px 28px",background:T.surface2,
              border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,
              outline:"none",fontFamily:"Outfit,sans-serif"}}
            onFocus={e=>e.target.style.borderColor=T.accent}
            onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 6px"}}>
        {SIDEBAR_TABS.map(t=>(
          <button key={t} onClick={()=>{setTab(t);setSearch("");}}
            style={{flex:1,padding:"8px 2px",border:"none",background:"transparent",
              fontFamily:"Outfit,sans-serif",fontSize:width<200?10:11,fontWeight:700,cursor:"pointer",
              color:tab===t?T.accent:T.muted,
              borderBottom:tab===t?`2px solid ${T.accent}`:"2px solid transparent",
              marginBottom:-1,transition:"all .15s",whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>
            {t}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 8px 16px"}}>
        {filtered.map(g=>(
          <div key={g.label} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",
              color:T.muted,padding:"6px 4px 8px"}}>{g.label}</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:4}}>
              {g.items.map(type=>{
                const def=NODE_DEFS[type]; if(!def) return null;
                const isPage    = def.iconType==="page";
                const isAction  = def.iconType==="action";
                const isPessoa  = def.iconType==="pessoa";
                const isForma   = def.iconType==="forma";
                const isProduto = def.iconType==="produto";
                return (
                  <div key={type} draggable onDragStart={e=>onDragStart(type,e)} title={def.label}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      padding:"7px 2px 6px",borderRadius:10,cursor:"grab",userSelect:"none",
                      border:"1px solid transparent",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.borderColor=T.border;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
                    {isPage
                      ? <PageNodeThumb pageIcon={def.pageIcon} accent={def.accent} size={itemSize}/>
                      : isAction
                        ? <ActionNodeIcon actionIcon={def.actionIcon} actionBg={def.actionBg} size={Math.round(itemSize*0.88)}/>
                      : isPessoa
                        ? <PessoaNodeIcon pessoaIcon={def.pessoaIcon} pessoaBg={def.pessoaBg} size={Math.round(itemSize*0.88)}/>
                      : isForma
                        ? <FormaThumb shape={def.formaShape} bg={def.formaBg} color={def.formaColor} size={itemSize}/>
                      : isProduto
                        ? <ProdutoNodeIcon produtoIcon={def.produtoIcon} produtoBg={def.produtoBg} size={Math.round(itemSize*0.95)}/>
                        : <NodeIconCircle type={type} size={Math.round(itemSize*0.88)}/>
                    }
                    <div style={{fontSize,fontWeight:500,color:T.muted2,textAlign:"center",
                      lineHeight:1.2,width:"100%",overflow:"hidden",
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {def.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"24px 0",color:T.muted,fontSize:12}}>Nenhum resultado</div>
        )}
      </div>

      {/* ── Resize handle ── */}
      <div onMouseDown={startResize}
        style={{position:"absolute",top:0,right:0,width:5,height:"100%",
          cursor:"ew-resize",zIndex:100,
          display:"flex",alignItems:"center",justifyContent:"center"}}
        onMouseEnter={e=>e.currentTarget.style.background=T.accent+"40"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        {/* grip dots */}
        <div style={{display:"flex",flexDirection:"column",gap:3,pointerEvents:"none"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:3,height:3,borderRadius:"50%",background:T.border2}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MONITOR PANEL (floating, resizable, draggable) ─────────────────
const OPS_PT = ["é igual a","não é igual a","contém","não contém","está excluído"];

function MonitorPanel({ T, node, save,
  panelW, setPanelW, panelH, setPanelH,
  panelX, setPanelX, panelY, setPanelY,
}) {
  const [pessoas,   setPessoas]    = useState(node.monitorPessoas||"vir");
  const [fonte,     setFonte]      = useState(node.monitorFonte||"Parâmetros da URL");
  const [url,       setUrl]        = useState(node.monitorUrl||"");
  const [rows,      setRows]       = useState(node.monitorRows||[{id:1,key:"",op:"é igual a",vals:[]}]);
  const [fonteOpen, setFonteOpen]  = useState(false);

  function sv(patch) { save(patch); }
  function updRow(i,p){ const r=rows.map((x,j)=>j===i?{...x,...p}:x); setRows(r); sv({monitorRows:r}); }
  function addRow(){    const r=[...rows,{id:Date.now(),key:"",op:"é igual a",vals:[]}]; setRows(r); sv({monitorRows:r}); }
  function delRow(i){   const r=rows.filter((_,j)=>j!==i); setRows(r); sv({monitorRows:r}); }
  function addVal(i,v){ if(!v.trim())return; const r=rows.map((x,j)=>j===i?{...x,vals:[...x.vals,v.trim()]}:x); setRows(r); sv({monitorRows:r}); }
  function delVal(i,vi){ const r=rows.map((x,j)=>j===i?{...x,vals:x.vals.filter((_,k)=>k!==vi)}:x); setRows(r); sv({monitorRows:r}); }

  // Drag header to move panel
  function startDrag(e) {
    if(e.target.closest("button")||e.target.closest("input")||e.target.closest("select")) return;
    e.preventDefault();
    const ox=e.clientX-panelX, oy=e.clientY-panelY;
    function onMove(ev){ setPanelX(ev.clientX-ox); setPanelY(ev.clientY-oy); }
    function onUp(){ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  // Resize from edges / corner
  function startResize(e, dir) {
    e.preventDefault(); e.stopPropagation();
    const sx=e.clientX, sy=e.clientY, sw=panelW, sh=panelH;
    function onMove(ev){
      if(dir==="e"||dir==="se") setPanelW(Math.max(500,sw+(ev.clientX-sx)));
      if(dir==="s"||dir==="se") setPanelH(Math.max(300,sh+(ev.clientY-sy)));
    }
    function onUp(){ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); }
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  }

  const LW = Math.round(panelW*0.67);
  const sel = { padding:"6px 26px 6px 10px", background:T.surface2, border:`1px solid ${T.border}`,
    borderRadius:7, color:T.text, fontSize:12, outline:"none", fontFamily:"Outfit,sans-serif",
    cursor:"pointer", appearance:"none", WebkitAppearance:"none" };

  return (
    <div style={{ position:"fixed", left:panelX, top:panelY, width:panelW,
      zIndex:9000, boxShadow:"0 16px 56px rgba(0,0,0,.28)",
      borderRadius:12, overflow:"hidden",
      border:`1px solid ${T.border}`, background:T.surface, userSelect:"none" }}>

      {/* ── DRAG HEADER ── */}
      <div onMouseDown={startDrag} style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"10px 16px", background:T.surface,
        borderBottom:`1px solid ${T.border}`, cursor:"grab",
      }}>
        <div style={{width:22,height:22,borderRadius:6,background:T.accent+"28",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>📡</div>
        <span style={{fontWeight:700,fontSize:13,color:T.text,flex:1,pointerEvents:"none"}}>
          Configurações de rastreamento
        </span>
        <button onMouseDown={e=>e.stopPropagation()}
          style={{background:"transparent",border:"none",cursor:"pointer",
            color:T.muted,fontSize:18,padding:"0 4px",lineHeight:1,borderRadius:5}}
          onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          onClick={()=>sv({_closeMonitor:true})}>✕</button>
      </div>

      {/* ── BODY ── */}
      <div style={{display:"flex", height:panelH-45}}>

        {/* LEFT */}
        <div style={{width:LW,flexShrink:0,borderRight:`1px solid ${T.border}`,
          display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Sentence */}
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",background:T.surface}}>
            <span style={{fontSize:12,color:T.text,whiteSpace:"nowrap"}}>Esta etapa representa pessoas que</span>
            <div style={{position:"relative"}}>
              <select value={pessoas}
                onChange={e=>{setPessoas(e.target.value);sv({monitorPessoas:e.target.value});}}
                style={{...sel,paddingRight:22,fontSize:12}}>
                <option value="vir">vir</option>
                <option value="sair">sair</option>
                <option value="converter">converter</option>
                <option value="retornar">retornar</option>
              </select>
              <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",
                pointerEvents:"none",fontSize:9,color:T.muted}}>▼</span>
            </div>
            <span style={{fontSize:12,color:T.text,whiteSpace:"nowrap"}}>a partir do seguinte</span>
          </div>

          {/* Source */}
          <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",gap:12,background:T.surface}}>
            <span style={{fontSize:12,fontWeight:700,color:T.text,minWidth:40,flexShrink:0}}>Fonte</span>
            <div style={{position:"relative",flex:1}}>
              <div onClick={()=>setFonteOpen(o=>!o)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"7px 12px",background:T.surface2,border:`1px solid ${T.border}`,
                  borderRadius:8,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <span style={{fontSize:12,color:T.text}}>{fonte}</span>
                <span style={{fontSize:9,color:T.muted}}>{fonteOpen?"▲":"▼"}</span>
              </div>
              {fonteOpen&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,
                  background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,
                  boxShadow:"0 8px 24px rgba(0,0,0,.18)",zIndex:500,overflow:"hidden"}}>
                  {["Parâmetros da URL","URL de referência","Tráfego Direto"].map(o=>(
                    <div key={o} onClick={()=>{setFonte(o);sv({monitorFonte:o});setFonteOpen(false);}}
                      style={{padding:"10px 14px",fontSize:12,color:T.text,cursor:"pointer",
                        background:fonte===o?T.accent+"18":"transparent",transition:"background .1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                      onMouseLeave={e=>e.currentTarget.style.background=fonte===o?T.accent+"18":"transparent"}>
                      {o}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* URL bar */}
          <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",gap:8,background:T.surface}}>
            <span style={{fontSize:14,color:T.muted2,flexShrink:0}}>🔗</span>
            <input value={url}
              onChange={e=>{setUrl(e.target.value);sv({monitorUrl:e.target.value});}}
              placeholder="Cole um link para adicionar seus parâmetros automaticamente"
              style={{flex:1,background:"transparent",border:"none",outline:"none",
                fontSize:11,color:T.muted,fontFamily:"Outfit,sans-serif"}}/>
            <div style={{display:"flex",alignItems:"center",gap:3,background:T.surface2,
              border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",flexShrink:0}}>
              <span style={{fontSize:11,color:T.muted2}}>enter</span>
              <span style={{fontSize:12,color:T.muted2}}>↵</span>
            </div>
          </div>

          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.1fr 1fr 16px",
            gap:0,borderBottom:`2px solid ${T.border}`,background:T.surface2}}>
            {[["Chave","16px 16px"],["","16px 8px"],["Valor","16px 8px"],["","8px 8px"]].map(([h,p],i)=>(
              <div key={i} style={{padding:p,fontSize:10,fontWeight:700,textTransform:"uppercase",
                letterSpacing:"0.8px",color:T.muted2,borderRight:i<3?`1px solid ${T.border}`:"none"}}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div style={{flex:1,overflowY:"auto"}}>
            {rows.map((row,i)=>(
              <div key={row.id||i} style={{display:"grid",gridTemplateColumns:"1fr 1.1fr 1fr 16px",
                gap:0,borderBottom:`1px solid ${T.border}`,alignItems:"stretch"}}>
                {/* Key */}
                <div style={{padding:"10px 16px",borderRight:`1px solid ${T.border}`}}>
                  <input value={row.key} onChange={e=>updRow(i,{key:e.target.value})}
                    placeholder="+add Key"
                    style={{width:"100%",background:"transparent",border:"none",outline:"none",
                      fontSize:12,color:row.key?T.text:T.muted,fontFamily:"Outfit,sans-serif"}}
                    onFocus={e=>e.target.style.color=T.text}
                    onBlur={e=>e.target.style.color=row.key?T.text:T.muted}/>
                </div>
                {/* Operator */}
                <div style={{padding:"8px 10px",borderRight:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",position:"relative"}}>
                  <select value={row.op} onChange={e=>updRow(i,{op:e.target.value})}
                    style={{...sel,width:"100%",fontSize:11,background:"transparent",border:"none",
                      padding:"2px 20px 2px 0",borderRadius:0}}>
                    {OPS_PT.map(o=><option key={o}>{o}</option>)}
                  </select>
                  <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                    pointerEvents:"none",fontSize:9,color:T.muted}}>▼</span>
                </div>
                {/* Values */}
                <div style={{padding:"8px 12px",borderRight:`1px solid ${T.border}`}}>
                  {row.vals.map((v,vi)=>(
                    <div key={vi} style={{display:"flex",alignItems:"center",
                      justifyContent:"flex-end",gap:4,marginBottom:2}}>
                      <span style={{fontSize:12,color:T.text,textAlign:"right"}}>{v}</span>
                      <span onClick={()=>delVal(i,vi)}
                        style={{fontSize:10,color:T.muted,cursor:"pointer",lineHeight:1,flexShrink:0}}
                        onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                        onMouseLeave={e=>e.currentTarget.style.color=T.muted}>✕</span>
                    </div>
                  ))}
                  <input placeholder="+add Values"
                    onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addVal(i,e.target.value);e.target.value="";}}}
                    style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px dashed ${T.border}`,
                      outline:"none",fontSize:11,color:T.accent,fontFamily:"Outfit,sans-serif",
                      textAlign:"right",padding:"2px 0",cursor:"text"}}
                    onFocus={e=>e.target.style.borderBottomColor=T.accent}
                    onBlur={e=>e.target.style.borderBottomColor=T.border}/>
                </div>
                {/* Del row */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                  onClick={()=>delRow(i)}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.08)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:11,color:T.muted,lineHeight:1}}
                    onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                    onMouseLeave={e=>e.currentTarget.style.color=T.muted}>✕</span>
                </div>
              </div>
            ))}
            {/* Add row */}
            <div style={{padding:"10px 16px"}}>
              <button onClick={addRow}
                style={{width:"100%",padding:"7px 0",background:"transparent",
                  border:`1px dashed ${T.border}`,borderRadius:7,
                  color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",
                  fontFamily:"Outfit,sans-serif",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accent+"10";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";}}>
                + adicionar linha
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Attribute Explorer */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface}}>
            <span style={{fontWeight:700,fontSize:12,color:T.text}}>Explorador de Atributos</span>
            <div style={{width:32,height:18,borderRadius:9,background:T.green,
              position:"relative",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",right:2,top:"50%",transform:"translateY(-50%)",
                width:14,height:14,borderRadius:"50%",background:"white",
                boxShadow:"0 1px 3px rgba(0,0,0,.25)"}}/>
            </div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            color:T.muted,fontSize:12,textAlign:"center",lineHeight:1.9,padding:24}}>
            Não há dados disponíveis<br/>para os parâmetros<br/>selecionados.
          </div>
        </div>
      </div>

      {/* Resize handle — corner */}
      <div onMouseDown={e=>startResize(e,"se")}
        style={{position:"absolute",bottom:0,right:0,width:20,height:20,
          cursor:"se-resize",zIndex:700,display:"flex",
          alignItems:"flex-end",justifyContent:"flex-end",padding:4}}>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{opacity:.35}}>
          <line x1="12" y1="2" x2="2" y2="12" stroke={T.muted} strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="7" x2="7" y2="12" stroke={T.muted} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      {/* right edge */}
      <div onMouseDown={e=>startResize(e,"e")}
        style={{position:"absolute",top:0,right:0,width:5,height:"100%",cursor:"ew-resize",zIndex:700}}/>
      {/* bottom edge */}
      <div onMouseDown={e=>startResize(e,"s")}
        style={{position:"absolute",bottom:0,left:0,width:"calc(100% - 20px)",height:5,cursor:"ns-resize",zIndex:700}}/>
    </div>
  );
}

// ─── NODE TOOLBAR ────────────────────────────────────────────────────
function NodeToolbar({ node, tab, T, scale, canvasToScreen, onTabChange, onDelete, onDuplicate, onCopy, onStyleChange, updateNode, onOpenMonitor }) {
  const sp=canvasToScreen(node.x,node.y);
  const ICO=NODE_ICO*scale, TW=NODE_W*scale;

  const [moreOpen,setMoreOpen]   = useState(false);
  const [nameVal,setNameVal]     = useState(node.label);
  const [planoSub,setPlanoSub]   = useState(null);
  const [analSub,setAnalSub]     = useState(null);
  const [notes,setNotes]         = useState(node.notes||"");
  const [checklist,setChecklist] = useState(node.checklist||[]);
  const [newCheck,setNewCheck]   = useState("");
  const [budget,setBudget]       = useState(node.budget||"");
  const [cpc,setCpc]             = useState(node.cpc||"");
  const [monitorUrl,setMonitor]  = useState(node.monitorUrl||"");
  const [monitorPessoas,setMonitorPessoas] = useState(node.monitorPessoas||"vir");
  const [monitorFonte,setMonitorFonte]     = useState(node.monitorFonte||"Parâmetros da URL");
  const [monitorChave,setMonitorChave]     = useState(node.monitorChave||"");
  const [monitorOp,setMonitorOp]           = useState(node.monitorOp||"é igual a");
  const [monitorValor,setMonitorValor]     = useState(node.monitorValor||"");
  const [fonteDropOpen,setFonteDropOpen]   = useState(false);
  const [monitorRows,setMonitorRows]       = useState(node.monitorRows||[{key:"",op:"is equal to",vals:[]}]);
  const [panelW,setPanelW]                 = useState(node.panelW||560);
  const [panelH,setPanelH]                 = useState(node.panelH||420);
  const [resizing,setResizing]             = useState(null);
  // ── Produto info state ──
  const [prodNome,setProdNome]             = useState(node.prodNome||"");
  const [prodPrecoAnc,setProdPrecoAnc]     = useState(node.prodPrecoAnc||"");
  const [prodPrecoOfer,setProdPrecoOfer]   = useState(node.prodPrecoOfer||"");
  const [prodPrazo,setProdPrazo]           = useState(node.prodPrazo||"");
  const [prodQtdTipo,setProdQtdTipo]       = useState(node.prodQtdTipo||"aulas");
  const [prodQtd,setProdQtd]               = useState(node.prodQtd||"");
  const [prodCarga,setProdCarga]           = useState(node.prodCarga||"");
  const [prodFormato,setProdFormato]       = useState(node.prodFormato||"online");
  const [prodDispositivo,setProdDispositivo] = useState(node.prodDispositivo||"");
  const [prodPanelW,setProdPanelW]         = useState(320);

  const isPage   = NODE_DEFS[node.type]?.iconType==="page";
  const isAction = NODE_DEFS[node.type]?.iconType==="action";
  const isPessoa = NODE_DEFS[node.type]?.iconType==="pessoa";
  const isForma  = NODE_DEFS[node.type]?.iconType==="forma";
  const isProduto= NODE_DEFS[node.type]?.iconType==="produto";
  const PW = isProduto ? prodPanelW : tab==="Análises" && analSub==="Monitorando" ? 400 : 320;
  // Position toolbar below the node
  const formaH = isForma ? (["conector","ou","e"].includes(NODE_DEFS[node.type]?.formaShape)?58:["decisao"].includes(NODE_DEFS[node.type]?.formaShape)?56:["bdados"].includes(NODE_DEFS[node.type]?.formaShape)?68:52) : 0;
  const formaW = isForma ? (["conector","ou","e"].includes(NODE_DEFS[node.type]?.formaShape)?58:["decisao"].includes(NODE_DEFS[node.type]?.formaShape)?80:["bdados"].includes(NODE_DEFS[node.type]?.formaShape)?72:110) : 0;
  const nodeBottomY = isPage    ? sp.y + (108+11)*scale
                    : isAction  ? sp.y + 64*scale
                    : isPessoa  ? sp.y + 64*scale
                    : isForma   ? sp.y + formaH*scale
                    : isProduto ? sp.y + 80*scale
                    : sp.y + ICO;
  const nodeW       = isPage    ? 90*scale
                    : isAction  ? 64*scale
                    : isPessoa  ? 64*scale
                    : isForma   ? formaW*scale
                    : isProduto ? 80*scale
                    : TW;
  const tx = sp.x + nodeW/2 - PW/2;
  const ty = nodeBottomY + 14*scale;
  const [pessoas,setPessoas]     = useState(node.pessoas||"");
  const [metaAtivo,setMetaAtivo] = useState(node.metaAtivo||false);
  const [metaValor,setMetaValor] = useState(node.metaValor||"");
  const [metaNome,setMetaNome]   = useState(node.metaNome||"");

  const save=(patch)=>updateNode(node.id,patch);
  const inp={width:"100%",padding:"7px 10px",background:T.surface2,border:`1px solid ${T.border}`,
    borderRadius:8,color:T.text,fontSize:12,outline:"none",fontFamily:"Outfit,sans-serif"};
  const lbl={display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",
    letterSpacing:"0.8px",color:T.muted2,marginBottom:5};

  const TABS = isProduto
    ? ["Informações"]
    : ["Estilo","Plano","Análises","..."];

  // ── Informações importantes — inline styles helpers ──
  const sec = {fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.9px",
    color:T.muted2,padding:"14px 0 6px",borderTop:`1px solid ${T.border}`,marginTop:4};
  const row = {display:"flex",flexDirection:"column",gap:4,marginBottom:12};
  const iLbl = {fontSize:11,fontWeight:600,color:T.muted2,marginBottom:2};
  const iInp = {...inp, fontSize:12};
  const selStyle = {...iInp, cursor:"pointer"};

  return (
    <div style={{position:"absolute",left:Math.max(4,tx),top:ty,zIndex:200,pointerEvents:"all"}}>
      {/* Tab bar */}
      <div style={{display:"flex",alignItems:"center",background:T.surface,
        border:`1px solid ${T.border}`,borderRadius:10,padding:"3px 4px",
        boxShadow:"0 4px 20px rgba(0,0,0,.15)",gap:2,width:PW}}>
        {TABS.map(t=>(
          <button key={t}
            onClick={()=>{
              onTabChange(t==="Informações"?"Análises":t);
              if(t==="...")setMoreOpen(m=>!m);
              else setMoreOpen(false);
              if(t==="Análises"&&onOpenMonitor)onOpenMonitor();
            }}
            style={{flex:t==="..."?0:1,padding:t==="..."?"6px 10px":"6px 0",
              border:"none",borderRadius:7,cursor:"pointer",transition:"all .15s",
              background:(t==="Informações"?tab==="Análises":tab===t)?T.accent+"22":"transparent",
              color:(t==="Informações"?tab==="Análises":tab===t)?T.accent:T.muted,
              fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            {t==="Estilo"&&<span>✏️</span>}
            {t==="Plano"&&<span>⚙️</span>}
            {t==="Análises"&&<span>📊</span>}
            {t==="Informações"&&<span>📋</span>}
            {t==="..."&&<span>···</span>}
            {t!=="..."&&t}
          </button>
        ))}
      </div>

      {/* ESTILO */}
      {tab==="Estilo"&&(
        <div className="fade-down" style={{background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:10,padding:14,marginTop:6,boxShadow:"0 8px 28px rgba(0,0,0,.15)",width:PW}}>
          <div style={{marginBottom:12}}>
            <label style={lbl}>Rótulo</label>
            <input value={nameVal}
              onChange={e=>{setNameVal(e.target.value);save({label:e.target.value});}}
              style={inp}
              onFocus={e=>e.target.style.borderColor=T.accent}
              onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <label style={lbl}>{isPage?"Tipo de página":isAction?"Tipo de ação":isPessoa?"Papel":isForma?"Forma":isProduto?"Produto":"Ícone"}</label>
          {isPage ? (
            // Page type picker
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,
              maxHeight:260,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.iconType==="page").map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    padding:"6px 2px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <PageNodeThumb pageIcon={d.pageIcon} accent={d.accent} size={44}/>
                  <div style={{fontSize:8,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:52,overflow:"hidden",display:"-webkit-box",
                    WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{d.label}</div>
                </div>
              ))}
            </div>
          ) : isAction ? (
            // Action type picker — diamond icons
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,maxHeight:220,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.iconType==="action").map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    padding:"6px 2px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <ActionNodeIcon actionIcon={d.actionIcon} actionBg={d.actionBg} size={36}/>
                  <div style={{fontSize:7.5,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:44,overflow:"hidden",display:"-webkit-box",
                    WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{d.label}</div>
                </div>
              ))}
            </div>
          ) : isForma ? (
            // Forma picker — actual flowchart shapes
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxHeight:240,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.iconType==="forma").map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    padding:"8px 4px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <FormaThumb shape={d.formaShape} bg={d.formaBg} color={d.formaColor} size={54}/>
                  <div style={{fontSize:8,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:56,overflow:"hidden",display:"-webkit-box",
                    WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{d.label}</div>
                </div>
              ))}
            </div>
          ) : isProduto ? (
            // Produto type picker
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,maxHeight:240,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.iconType==="produto").map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    padding:"6px 4px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <ProdutoNodeIcon produtoIcon={d.produtoIcon} produtoBg={d.produtoBg} size={44}/>
                  <div style={{fontSize:8,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:50,overflow:"hidden",display:"-webkit-box",
                    WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{d.label}</div>
                </div>
              ))}
            </div>
          ) : isPessoa ? (
            // Pessoa type picker — circle avatars
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,maxHeight:220,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.iconType==="pessoa").map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    padding:"6px 2px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <PessoaNodeIcon pessoaIcon={d.pessoaIcon} pessoaBg={d.pessoaBg} size={38}/>
                  <div style={{fontSize:7.5,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:48,overflow:"hidden",display:"-webkit-box",
                    WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{d.label}</div>
                </div>
              ))}
            </div>
          ) : (
            // Traffic icon picker
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,maxHeight:210,overflowY:"auto"}}>
              {Object.entries(NODE_DEFS).filter(([,d])=>d.isTraffic).map(([type,d])=>(
                <div key={type} onClick={()=>{save({type,label:d.label});onStyleChange(node.id,type);}} title={d.label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    padding:"6px 2px",borderRadius:8,cursor:"pointer",transition:"all .12s",
                    border:node.type===type?`2px solid ${T.accent}`:"2px solid transparent",
                    background:node.type===type?T.accent+"15":"transparent"}}
                  onMouseEnter={e=>{if(node.type!==type)e.currentTarget.style.background=T.surface2;}}
                  onMouseLeave={e=>{if(node.type!==type)e.currentTarget.style.background="transparent";}}>
                  <NodeIconCircle type={type} size={36}/>
                  <div style={{fontSize:8,color:T.muted2,textAlign:"center",lineHeight:1.2,
                    maxWidth:44,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLANO */}
      {tab==="Plano"&&(
        <div className="fade-down" style={{background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:10,padding:14,marginTop:6,boxShadow:"0 8px 28px rgba(0,0,0,.15)",width:PW}}>
          {!planoSub?(
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {[{icon:"📝",label:"Notas",sub:"Notas"},{icon:"✅",label:"Lista De Verificação",sub:"Checklist"},{icon:"📈",label:"Previsão",sub:"Previsão"}].map(it=>(
                <div key={it.sub} onClick={()=>setPlanoSub(it.sub)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px",
                    borderRadius:8,cursor:"pointer",fontSize:13,color:T.text,transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:16}}>{it.icon}</span>{it.label}
                </div>
              ))}
            </div>
          ):(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <button onClick={()=>setPlanoSub(null)}
                  style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:16,padding:0}}>←</button>
                <span style={{fontWeight:700,fontSize:13,color:T.text}}>{planoSub}</span>
              </div>
              {planoSub==="Notas"&&(
                <textarea value={notes} rows={5}
                  onChange={e=>{setNotes(e.target.value);save({notes:e.target.value});}}
                  placeholder="Digite suas notas..."
                  style={{...inp,resize:"vertical",minHeight:100,lineHeight:1.5}}/>
              )}
              {planoSub==="Checklist"&&(
                <div>
                  {checklist.map((c,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <input type="checkbox" checked={c.done}
                        onChange={e=>{const cl=[...checklist];cl[i]={...cl[i],done:e.target.checked};setChecklist(cl);save({checklist:cl});}}
                        style={{accentColor:T.accent,width:14,height:14}}/>
                      <span style={{flex:1,fontSize:12,color:c.done?T.muted:T.text,textDecoration:c.done?"line-through":"none"}}>{c.text}</span>
                      <button onClick={()=>{const cl=checklist.filter((_,j)=>j!==i);setChecklist(cl);save({checklist:cl});}}
                        style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <input value={newCheck} onChange={e=>setNewCheck(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&newCheck.trim()){const cl=[...checklist,{text:newCheck.trim(),done:false}];setChecklist(cl);save({checklist:cl});setNewCheck("");}}}
                      placeholder="Adicionar item..." style={{...inp,flex:1}}/>
                    <button onClick={()=>{if(!newCheck.trim())return;const cl=[...checklist,{text:newCheck.trim(),done:false}];setChecklist(cl);save({checklist:cl});setNewCheck("");}}
                      style={{padding:"7px 12px",background:T.accent,border:"none",borderRadius:8,color:"white",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontWeight:700}}>+</button>
                  </div>
                </div>
              )}
              {planoSub==="Previsão"&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[{l:"Orçamento (R$)",v:budget,set:setBudget,k:"budget"},{l:"CPC médio (R$)",v:cpc,set:setCpc,k:"cpc"}].map(f=>(
                    <div key={f.k}>
                      <label style={lbl}>{f.l}</label>
                      <input type="number" value={f.v}
                        onChange={e=>{f.set(e.target.value);save({[f.k]:e.target.value});}}
                        style={inp} placeholder="0"
                        onFocus={e=>e.target.style.borderColor=T.accent}
                        onBlur={e=>e.target.style.borderColor=T.border}/>
                    </div>
                  ))}
                  {budget&&cpc&&Number(cpc)>0&&(
                    <div style={{background:T.accent+"18",border:`1px solid ${T.accent}33`,
                      borderRadius:8,padding:"10px 12px",fontSize:12,color:T.text}}>
                      📊 Cliques estimados: <b>{Math.floor(Number(budget)/Number(cpc)).toLocaleString("pt-BR")}</b>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ANÁLISES */}
      {tab==="Análises"&&(
        <>
        {isProduto ? (
          /* ── Produto: painel flutuante arrastável ── */
          (()=>{
            const panX = Math.max(10, Math.min(window.innerWidth-prodPanelW-20, tx));
            const panY = Math.max(10, nodeBottomY+14*scale);
            return(
              <div className="fade-down"
                style={{position:"fixed",left:panX,top:Math.min(panY, window.innerHeight-520),
                  width:prodPanelW,zIndex:500,
                  background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.28)",
                  display:"flex",flexDirection:"column",overflow:"hidden",
                  maxHeight:"80vh"}}>

                {/* Header — arraste aqui */}
                <div
                  onMouseDown={e=>{
                    e.preventDefault(); e.stopPropagation();
                    const el = e.currentTarget.parentElement;
                    const startX=e.clientX-el.getBoundingClientRect().left;
                    const startY=e.clientY-el.getBoundingClientRect().top;
                    const onMove=ev=>{
                      const nx=Math.max(0,Math.min(window.innerWidth-prodPanelW,ev.clientX-startX));
                      const ny=Math.max(0,Math.min(window.innerHeight-60,ev.clientY-startY));
                      el.style.left=nx+"px"; el.style.top=ny+"px";
                    };
                    const onUp=()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
                    window.addEventListener("mousemove",onMove);
                    window.addEventListener("mouseup",onUp);
                  }}
                  style={{display:"flex",alignItems:"center",gap:10,
                    padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
                    cursor:"move",flexShrink:0,userSelect:"none",
                    background:T.surface2}}>
                  <span style={{fontSize:16}}>📋</span>
                  <span style={{fontWeight:700,fontSize:14,color:T.text,flex:1}}>Informações importantes</span>
                  <div style={{fontSize:10,color:T.muted,marginRight:4}}>⠿ arrastar</div>
                </div>

                {/* Conteúdo scrollável */}
                <div style={{overflowY:"auto",padding:"14px 16px",flex:1}}>

                  {/* ── ESSENCIAIS ── */}
                  <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",
                    letterSpacing:"0.9px",color:T.muted2,marginBottom:10}}>Essenciais</div>

                  <div style={{marginBottom:10}}>
                    <label style={lbl}>Nome do produto</label>
                    <input value={prodNome}
                      onChange={e=>{setProdNome(e.target.value);save({prodNome:e.target.value});}}
                      placeholder="Ex: Curso de Marketing Digital"
                      style={inp}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    <div>
                      <label style={lbl}>Preço ancorado</label>
                      <div style={{position:"relative"}}>
                        <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",
                          fontSize:11,color:T.muted2,fontWeight:600,pointerEvents:"none"}}>R$</span>
                        <input type="number" value={prodPrecoAnc}
                          onChange={e=>{setProdPrecoAnc(e.target.value);save({prodPrecoAnc:e.target.value});}}
                          placeholder="997" style={{...inp,paddingLeft:30,fontSize:12}}
                          onFocus={e=>e.target.style.borderColor=T.accent}
                          onBlur={e=>e.target.style.borderColor=T.border}/>
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Preço da oferta</label>
                      <div style={{position:"relative"}}>
                        <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",
                          fontSize:11,color:T.accent,fontWeight:700,pointerEvents:"none"}}>R$</span>
                        <input type="number" value={prodPrecoOfer}
                          onChange={e=>{setProdPrecoOfer(e.target.value);save({prodPrecoOfer:e.target.value});}}
                          placeholder="497" style={{...inp,paddingLeft:30,fontSize:12}}
                          onFocus={e=>e.target.style.borderColor=T.accent}
                          onBlur={e=>e.target.style.borderColor=T.border}/>
                      </div>
                    </div>
                  </div>

                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Prazo de acesso</label>
                    <input value={prodPrazo}
                      onChange={e=>{setProdPrazo(e.target.value);save({prodPrazo:e.target.value});}}
                      placeholder="Ex: Vitalício, 1 ano, 6 meses..."
                      style={inp}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>

                  {/* ── CONTEÚDO / TAMANHO ── */}
                  <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",
                    letterSpacing:"0.9px",color:T.muted2,marginBottom:10,
                    paddingTop:14,borderTop:`1px solid ${T.border}`}}>Conteúdo / Tamanho</div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    <div>
                      <label style={lbl}>Quantidade</label>
                      <input type="number" value={prodQtd}
                        onChange={e=>{setProdQtd(e.target.value);save({prodQtd:e.target.value});}}
                        placeholder="0" style={inp}
                        onFocus={e=>e.target.style.borderColor=T.accent}
                        onBlur={e=>e.target.style.borderColor=T.border}/>
                    </div>
                    <div>
                      <label style={lbl}>Tipo de item</label>
                      <select value={prodQtdTipo}
                        onChange={e=>{setProdQtdTipo(e.target.value);save({prodQtdTipo:e.target.value});}}
                        style={{...inp,cursor:"pointer"}}>
                        {["aulas","sessões","páginas","encontros","módulos","vídeos","exercícios","capítulos"].map(o=>(
                          <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Carga horária / duração</label>
                    <input value={prodCarga}
                      onChange={e=>{setProdCarga(e.target.value);save({prodCarga:e.target.value});}}
                      placeholder="Ex: 40 horas, 3 dias, 8 semanas..."
                      style={inp}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>

                  {/* ── ACESSO ── */}
                  <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",
                    letterSpacing:"0.9px",color:T.muted2,marginBottom:10,
                    paddingTop:14,borderTop:`1px solid ${T.border}`}}>Acesso</div>

                  <div style={{marginBottom:12}}>
                    <label style={lbl}>Formato</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                      {["Online","Ao vivo","Presencial","Download","Híbrido"].map(f=>{
                        const active=prodFormato===f;
                        return(
                          <div key={f} onClick={()=>{setProdFormato(f);save({prodFormato:f});}}
                            style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,
                              cursor:"pointer",transition:"all .15s",border:"1.5px solid",
                              borderColor:active?T.accent:T.border,
                              background:active?T.accent+"22":T.surface2,
                              color:active?T.accent:T.muted}}>
                            {f}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{marginBottom:8}}>
                    <label style={lbl}>Dispositivos / Onde acessa</label>
                    <input value={prodDispositivo}
                      onChange={e=>{setProdDispositivo(e.target.value);save({prodDispositivo:e.target.value});}}
                      placeholder="Ex: Computador, celular, app..."
                      style={inp}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>

                </div>

                {/* Resize handle — borda direita */}
                <div
                  onMouseDown={e=>{
                    e.preventDefault(); e.stopPropagation();
                    const startX=e.clientX, startW=prodPanelW;
                    const onMove=ev=>setProdPanelW(Math.max(280,Math.min(700,startW+(ev.clientX-startX))));
                    const onUp=()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
                    window.addEventListener("mousemove",onMove);
                    window.addEventListener("mouseup",onUp);
                  }}
                  style={{position:"absolute",top:0,right:0,width:6,height:"100%",
                    cursor:"ew-resize",zIndex:10}}/>

              </div>
            );
          })()

        ) : (
          <div className="fade-down" style={{background:T.surface,border:`1px solid ${T.border}`,
            borderRadius:10,padding:14,marginTop:6,boxShadow:"0 8px 28px rgba(0,0,0,.15)",
            width:PW}}>
          {!analSub ? (
            /* ── Outros nós: menu de subseções ── */
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {[
                {icon:"📡",label:"Monitorando",sub:"Monitorando"},
                {icon:"👥",label:"Pessoas",sub:"Pessoas"},
                {icon:"🏆",label:"Metas",sub:"Metas"},
              ].map(it=>(
                <div key={it.sub}
                  onClick={()=>{setAnalSub(it.sub);if(it.sub==="Monitorando"&&onOpenMonitor)onOpenMonitor();}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px",
                    borderRadius:8,cursor:"pointer",fontSize:13,color:T.text,transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:16}}>{it.icon}</span>{it.label}
                </div>
              ))}
            </div>

          ) : (
            /* ── Sub-seção aberta ── */
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:16}}>{analSub==="Monitorando"?"📡":analSub==="Pessoas"?"👥":"🏆"}</span>
                <span style={{fontWeight:700,fontSize:14,color:T.text,flex:1}}>{analSub}</span>
                <button onClick={()=>setAnalSub(null)}
                  style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",
                    fontSize:16,padding:"2px 6px",borderRadius:6,lineHeight:1}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕</button>
              </div>
              <div style={{borderTop:`1px solid ${T.border}`,marginBottom:12}}/>

              {analSub==="Monitorando"&&(
                <div style={{fontSize:11,color:T.muted,padding:"12px 4px",textAlign:"center"}}>
                  <span style={{fontSize:20,display:"block",marginBottom:6}}>📡</span>
                  Painel de rastreamento aberto abaixo
                </div>
              )}

              {analSub==="Pessoas"&&(
                <div>
                  <label style={lbl}>Público-alvo</label>
                  <textarea value={pessoas} rows={3}
                    onChange={e=>{setPessoas(e.target.value);save({pessoas:e.target.value});}}
                    placeholder="Descreva o público dessa fonte..."
                    style={{...inp,resize:"vertical"}}/>
                </div>
              )}

              {analSub==="Metas"&&(
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontSize:12,color:T.muted,marginBottom:16,lineHeight:1.5}}>
                    Use essas configurações para destacar uma etapa na jornada do cliente como uma Meta de Conversão.
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"14px 0",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.text}}>Definir Elemento como Meta</span>
                    <div onClick={()=>{const v=!metaAtivo;setMetaAtivo(v);save({metaAtivo:v});}}
                      style={{width:44,height:24,borderRadius:12,cursor:"pointer",transition:"all .25s",
                        background:metaAtivo?T.accent:"#cbd5e1",position:"relative",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:metaAtivo?23:3,
                        width:18,height:18,borderRadius:"50%",background:"white",
                        boxShadow:"0 1px 4px rgba(0,0,0,.25)",transition:"left .25s"}}/>
                    </div>
                  </div>
                  <div style={{padding:"14px 0",borderTop:`1px solid ${T.border}`}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}}>Valor da Meta</div>
                    <div style={{fontSize:11,color:T.muted,marginBottom:10,lineHeight:1.4,fontStyle:"italic"}}>
                      (Opcional) - atribua um valor monetário à meta
                    </div>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                        fontSize:13,color:T.muted2,fontWeight:600}}>$</span>
                      <input type="number" value={metaValor}
                        onChange={e=>{setMetaValor(e.target.value);save({metaValor:e.target.value});}}
                        placeholder="0"
                        style={{...inp,paddingLeft:28,textAlign:"right",color:T.muted2}}
                        onFocus={e=>e.target.style.borderColor=T.accent}
                        onBlur={e=>e.target.style.borderColor=T.border}/>
                    </div>
                  </div>
                  <div style={{padding:"14px 0",borderTop:`1px solid ${T.border}`}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}}>Nome do objetivo</div>
                    <div style={{fontSize:11,color:T.muted,marginBottom:10,fontStyle:"italic"}}>opcional</div>
                    <input type="text" value={metaNome}
                      onChange={e=>{setMetaNome(e.target.value);save({metaNome:e.target.value});}}
                      placeholder="Meu objetivo"
                      style={{...inp,color:T.muted2,textAlign:"right"}}
                      onFocus={e=>e.target.style.borderColor=T.accent}
                      onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
      </>
      )}

      {/* ... mais */}
      {tab==="..."&&moreOpen&&(
        <div className="fade-down" style={{background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:10,padding:"6px 0",marginTop:6,
          boxShadow:"0 8px 28px rgba(0,0,0,.15)",minWidth:220}}>
          <div style={{padding:"4px 14px 10px"}}>
            <label style={lbl}>Rótulo</label>
            <input value={nameVal}
              onChange={e=>{setNameVal(e.target.value);save({label:e.target.value});}}
              style={inp}
              onFocus={e=>e.target.style.borderColor=T.accent}
              onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,margin:"4px 0"}}/>
          {[
            {icon:"⧉",label:"Copiar",      kbd:"ctrl+c",  danger:false, action:()=>onCopy(node.id)},
            {icon:"❐",label:"Duplicar",    kbd:"ctrl+d",  danger:false, action:()=>onDuplicate(node.id,"duplicate")},
            {icon:"🗑",label:"Excluir",     kbd:"del",     danger:true,  action:()=>onDelete(node.id)},
          ].map(it=>(
            <div key={it.label} onClick={it.action}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",
                cursor:"pointer",color:it.danger?"#ef4444":T.text,fontSize:13,transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{width:18,fontSize:14}}>{it.icon}</span>
              <span style={{flex:1}}>{it.label}</span>
              <span style={{fontSize:10,color:T.muted,background:T.surface2,padding:"2px 5px",
                borderRadius:4,border:`1px solid ${T.border}`}}>{it.kbd}</span>
            </div>
          ))}
          <div style={{borderTop:`1px solid ${T.border}`,margin:"4px 0"}}/>
          {[{icon:"⬆",label:"Trazer à frente",kbd:"ctrl+]"},{icon:"⬇",label:"Enviar para trás",kbd:"ctrl+["}].map(it=>(
            <div key={it.label}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",
                cursor:"pointer",color:T.text,fontSize:13,transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{width:18}}>{it.icon}</span>
              <span style={{flex:1}}>{it.label}</span>
              <span style={{fontSize:10,color:T.muted,background:T.surface2,padding:"2px 5px",
                borderRadius:4,border:`1px solid ${T.border}`}}>{it.kbd}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FUNNEL BUILDER ──────────────────────────────────────────────────
function FunnelBuilder({ funnel: init, user, onBack }) {
  const T = useT();
  const [funnel,setFunnel]           = useState(init);
  const [nodes,setNodes]             = useState(init.nodes||{});
  const [connections,setConns]       = useState(init.connections||[]);
  const [selected,setSelected]       = useState(null);
  const [saving,setSaving]           = useState(false);
  const [toast,setToast]             = useState(null);
  const [sidebarW,setSidebarW]       = useState(240);
  const [scale,setScale]             = useState(1);
  const [pan,setPan]                 = useState({x:60,y:60});
  const [dragging,setDragging]       = useState(null);
  const [panning,setPanning]         = useState(false);
  const [panStart,setPanStart]       = useState(null);
  const connectingRef                = useRef(null);
  const [connectingState,setCS]      = useState(null);
  const [lineStyleMenu,setLSM]       = useState(null);
  const [mouseScreen,setMouseSc]     = useState({x:0,y:0});
  const [toolbar,setToolbar]         = useState(null);
  const [analyzingUrl,setAnalUrl]    = useState(null);
  const [monitorOpen,setMonitorOpen] = useState(false);
  const [monitorNodeId,setMonitorNodeId] = useState(null);
  const [monPanelW,setMonPanelW]     = useState(640);
  const [monPanelH,setMonPanelH]     = useState(440);
  const [monPanelX,setMonPanelX]     = useState(120);
  const [confirmDelete,setConfirmDelete] = useState(null); // {id, label}
  const [monPanelY,setMonPanelY]     = useState(120);

  const canvasRef   = useRef(null);
  const nodesRef    = useRef(nodes);
  const connRef     = useRef(connections);
  const clipRef     = useRef(null); // clipboard node
  const selectedRef = useRef(selected);
  nodesRef.current    = nodes;
  connRef.current     = connections;
  selectedRef.current = selected;

  function showToast(m,t="success"){setToast({msg:m,type:t});setTimeout(()=>setToast(null),2500);}

  const saveTimer=useRef(null);
  function triggerSave(n,c){
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>doSave(n,c),1500);
  }
  async function doSave(n,c){
    setSaving(true);
    const data={...funnel,nodes:n,connections:c,updatedAt:Date.now()};
    await dbSaveFunnel(user.id, data);
    setSaving(false);
  }

  function addNode(type,x,y){
    const id="n"+Date.now();
    const def=NODE_DEFS[type]||NODE_DEFS.landing;
    const n={id,type,x,y,label:def.label,visitors:0,convRate:0,urlInsight:"",creatives:[]};
    setNodes(prev=>{const ns={...prev,[id]:n};triggerSave(ns,connRef.current);return ns;});
  }
  function updateNode(id,patch){
    setNodes(prev=>{const ns={...prev,[id]:{...prev[id],...patch}};triggerSave(ns,connRef.current);return ns;});
  }
  function requestDelete(id){
    const n = nodesRef.current[id]; if(!n) return;
    const def = NODE_DEFS[n.type];
    setConfirmDelete({id, label: n.label || def?.label || "este elemento"});
  }
  function executeDelete(id){
    setNodes(prev=>{const ns={...prev};delete ns[id];triggerSave(ns,connRef.current);return ns;});
    setConns(prev=>{const c=prev.filter(x=>x.from!==id&&x.to!==id);triggerSave(nodesRef.current,c);return c;});
    if(selected===id){setSelected(null);setToolbar(null);}
    setConfirmDelete(null);
  }
  function deleteNode(id){ requestDelete(id); }
  function duplicateNode(id, mode) {
    const orig = nodesRef.current[id]; if(!orig) return;
    const newId = "n"+Date.now();
    const copy = {...orig, id:newId, x:orig.x+40, y:orig.y+40,
      label: mode==="copy" ? "Cópia de "+orig.label : orig.label};
    setNodes(prev=>{const ns={...prev,[newId]:copy};triggerSave(ns,connRef.current);return ns;});
    showToast(mode==="copy"?"📋 Copiado!":"⧉ Duplicado!");
    setSelected(newId);
    setToolbar({nodeId:newId, tab:"Estilo"});
  }
  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(()=>{
    function onKey(e){
      const tag = document.activeElement?.tagName;
      const typing = tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT";

      // ctrl+c — copy selected node
      if(e.ctrlKey&&e.key==="c"&&!typing){
        const id = selectedRef.current;
        if(!id||!nodesRef.current[id]) return;
        clipRef.current = {...nodesRef.current[id]};
        showToast("📋 Nó copiado!");
        e.preventDefault();
      }
      // ctrl+v — paste copied node
      if(e.ctrlKey&&e.key==="v"&&!typing){
        const orig = clipRef.current;
        if(!orig) return;
        const newId = "n"+Date.now();
        const paste = {...orig, id:newId, x:orig.x+48, y:orig.y+48};
        setNodes(prev=>{const ns={...prev,[newId]:paste};triggerSave(ns,connRef.current);return ns;});
        setSelected(newId);
        const def__=NODE_DEFS[paste.type];
        if(def__?.isTraffic||def__?.iconType==="page") setToolbar({nodeId:newId,tab:"Estilo"});
        // shift clipboard so next paste staggers
        clipRef.current = {...orig, x:orig.x+48, y:orig.y+48};
        showToast("📌 Nó colado!");
        e.preventDefault();
      }
      // ctrl+d — duplicate selected node
      if(e.ctrlKey&&e.key==="d"&&!typing){
        const id = selectedRef.current;
        if(id) { duplicateNode(id,"duplicate"); e.preventDefault(); }
      }
      // Delete / Backspace — delete selected node
      if((e.key==="Delete"||e.key==="Backspace")&&!typing){
        const id = selectedRef.current;
        if(id){ requestDelete(id); e.preventDefault(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function addConnection(from,to,style="solid",fromPort="right",toPort="left"){
    if(from===to)return;
    if(connRef.current.find(c=>c.from===from&&c.to===to&&c.fromPort===fromPort&&c.toPort===toPort))return;
    setConns(prev=>{const c=[...prev,{from,to,style,fromPort:fromPort||"right",toPort:toPort||"left"}];triggerSave(nodesRef.current,c);return c;});
  }
  function deleteConnection(i){
    setConns(prev=>{const c=prev.filter((_,idx)=>idx!==i);triggerSave(nodesRef.current,c);return c;});
  }

  function screenToCanvas(sx,sy){
    const r=canvasRef.current.getBoundingClientRect();
    return{x:(sx-r.left)/scale-pan.x,y:(sy-r.top)/scale-pan.y};
  }
  function canvasToScreen(cx,cy){return{x:(cx+pan.x)*scale,y:(cy+pan.y)*scale};}
  // portScreen: port = "top"|"right"|"bottom"|"left"
  function portScreen(nodeId, port){
    const n=nodesRef.current[nodeId];if(!n)return{x:0,y:0};
    const def=NODE_DEFS[n.type]||NODE_DEFS.landing;
    const {x,y}=canvasToScreen(n.x,n.y);
    let W,H;
    if(def.iconType==="page")        { W=90*scale;  H=108*scale; }
    else if(def.iconType==="action") { W=64*scale;  H=64*scale;  }
    else if(def.iconType==="pessoa") { W=64*scale;  H=64*scale;  }
    else if(def.iconType==="forma"){
      const circ=["conector","ou","e"],sq=["decisao"],tall=["bdados"];
      if(circ.includes(def.formaShape))     { W=58*scale; H=58*scale; }
      else if(sq.includes(def.formaShape))  { W=80*scale; H=56*scale; }
      else if(tall.includes(def.formaShape)){ W=72*scale; H=68*scale; }
      else                                  { W=110*scale;H=52*scale; }
    } else { W=(NODE_W)*scale; H=(NODE_ICO)*scale; }
    switch(port){
      case "top":    return {x:x+W/2, y:y};
      case "bottom": return {x:x+W/2, y:y+H};
      case "left":   return {x:x,     y:y+H/2};
      case "right":  return {x:x+W,   y:y+H/2};
      default:       return {x:x+W,   y:y+H/2};
    }
  }
  function bezier(x1,y1,x2,y2,p1,p2){
    // p1=fromPort, p2=toPort: controls curve direction
    const dist=Math.sqrt((x2-x1)**2+(y2-y1)**2);
    const str=Math.max(40,dist*0.45);
    const cp=(p,str)=>{
      if(p==="right")  return [str,0];
      if(p==="left")   return [-str,0];
      if(p==="top")    return [0,-str];
      if(p==="bottom") return [0,str];
      return [str,0];
    };
    const [dx1,dy1]=cp(p1||"right",str);
    const [dx2,dy2]=cp(p2||"left",str);
    return `M${x1},${y1} C${x1+dx1},${y1+dy1} ${x2-dx2},${y2-dy2} ${x2},${y2}`;
  }

  function onCanvasMouseDown(e){
    if(!e.target.classList.contains("canvas-bg")&&e.target!==canvasRef.current)return;
    setSelected(null);setToolbar(null);setLSM(null);
    connectingRef.current=null;setCS(null);
    setPanning(true);setPanStart({cx:e.clientX,cy:e.clientY,px:pan.x,py:pan.y});
  }
  function onMouseMove(e){
    if(canvasRef.current){
      const r=canvasRef.current.getBoundingClientRect();
      setMouseSc({x:e.clientX-r.left,y:e.clientY-r.top});
    }
    if(dragging){
      const {x,y}=screenToCanvas(e.clientX,e.clientY);
      updateNode(dragging.id,{x:x-dragging.offX,y:y-dragging.offY});
      return;
    }
    if(panning&&panStart){
      setPan({x:panStart.px+(e.clientX-panStart.cx)/scale,y:panStart.py+(e.clientY-panStart.cy)/scale});
    }
  }
  function onMouseUp(){
    if(dragging){setDragging(null);return;}
    if(panning){setPanning(false);setPanStart(null);return;}
    if(connectingRef.current){connectingRef.current=null;setCS(null);}
  }
  function onNodeMouseDown(e,id){
    // Ignore clicks originating from port dots or delete button
    if(e.target.closest(".node-port")||e.target.closest(".del-btn"))return;
    e.stopPropagation();
    setSelected(id);
    const def_=NODE_DEFS[nodesRef.current[id]?.type];
    const t=def_?.iconType;
    if(t==="produto") setToolbar({nodeId:id,tab:"Análises"});
    else if(def_?.isTraffic||t==="page"||t==="action"||t==="pessoa"||t==="forma")setToolbar({nodeId:id,tab:"Estilo"});
    else setToolbar(null);
    const {x,y}=screenToCanvas(e.clientX,e.clientY);
    const n=nodesRef.current[id];
    setDragging({id,offX:x-n.x,offY:y-n.y});
  }
  function onPickStyle(style){
    const m=lineStyleMenu;if(!m?.nodeId)return;
    connectingRef.current={fromId:m.nodeId,fromPort:m.port||"right",style};
    setCS({fromId:m.nodeId,fromPort:m.port||"right",style});setLSM(null);
  }
  // ── 4-port dots — top / right / bottom / left ────────────────────
  function NodePorts({id, W, H, accent, xOffset=0, yOffset=0}){
    const isActive = connectingState?.fromId===id;
    const ps = Math.max(10, 12*scale);
    const half = ps/2;

    const ports = [
      {dir:"top",    left:xOffset+W/2,  top:yOffset},
      {dir:"right",  left:xOffset+W,    top:yOffset+H/2},
      {dir:"bottom", left:xOffset+W/2,  top:yOffset+H},
      {dir:"left",   left:xOffset,      top:yOffset+H/2},
    ];

    return ports.map(({dir,left,top})=>(
      <div key={dir}
        className="node-port"
        data-active={isActive?"1":"0"}
        style={{
          position:"absolute",
          left:left-half,
          top:top-half,
          width:ps,
          height:ps,
          borderRadius:"50%",
          background: isActive ? accent : T.surface,
          border:`2px solid ${isActive ? accent : T.border2}`,
          cursor:"crosshair",
          zIndex:25,
          transition:"opacity .1s, transform .12s, background .12s",
          boxSizing:"border-box",
          opacity: isActive ? 1 : 0,
        }}
        // Prevent port clicks from starting a node drag
        onMouseDown={e=>e.stopPropagation()}
        // Start connection: click on port → show line-style picker
        onClick={e=>{
          e.stopPropagation();
          if(connectingRef.current){
            // Second click on origin node cancels
            if(connectingRef.current.fromId===id){
              connectingRef.current=null; setCS(null); setLSM(null);
            }
            return;
          }
          const r=canvasRef.current.getBoundingClientRect();
          setLSM({nodeId:id, port:dir, x:e.clientX-r.left+8, y:e.clientY-r.top+8});
        }}
        // Finish connection: release mouse on target port
        onMouseUp={e=>{
          e.stopPropagation();
          if(connectingRef.current && connectingRef.current.fromId!==id){
            addConnection(
              connectingRef.current.fromId, id,
              connectingRef.current.style,
              connectingRef.current.fromPort||"right",
              dir
            );
            connectingRef.current=null; setCS(null);
          }
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.opacity="1";
          e.currentTarget.style.background=accent;
          e.currentTarget.style.borderColor=accent;
          e.currentTarget.style.transform="scale(1.6)";
        }}
        onMouseLeave={e=>{
          if(!isActive) e.currentTarget.style.opacity="0";
          e.currentTarget.style.background=isActive?accent:T.surface;
          e.currentTarget.style.borderColor=isActive?accent:T.border2;
          e.currentTarget.style.transform="scale(1)";
        }}
        title="Conectar"
      />
    ));
  }

  function onWheel(e){
    e.preventDefault();
    setScale(s=>Math.min(2.5,Math.max(0.25,s+(e.deltaY>0?-0.08:0.08))));
  }
  function onDrop(e){
    e.preventDefault();
    const type=e.dataTransfer.getData("nodeType");if(!type)return;
    const {x,y}=screenToCanvas(e.clientX,e.clientY);
    addNode(type,x-NODE_W/2,y-NODE_ICO/2);
  }
  function autoLayout(){
    const ids=Object.keys(nodes);if(!ids.length)return;
    const cols=Math.ceil(Math.sqrt(ids.length));
    const updated={...nodes};
    ids.forEach((id,i)=>{updated[id]={...updated[id],x:60+230*(i%cols),y:60+150*Math.floor(i/cols)};});
    setNodes(updated);triggerSave(updated,connections);showToast("✨ Layout organizado!");
  }
  async function analyzeUrl(nodeId,url){
    if(!url||!url.startsWith("http"))return;
    setAnalUrl(nodeId);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:300,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Analise esta URL: ${url}\nResponda APENAS em JSON: {"visitors":3500,"convRate":12,"insight":"descrição curta"}`}]
        })
      });
      const data=await res.json();
      const text=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const json=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(json.visitors&&json.convRate){
        updateNode(nodeId,{visitors:parseInt(json.visitors)||0,convRate:Math.min(99,parseInt(json.convRate)||0),urlInsight:json.insight||""});
        showToast("✅ Métricas estimadas pela IA!");
      }
    }catch{showToast("⚠️ Não foi possível analisar a URL","error");}
    setAnalUrl(null);
  }

  const selNode=selected?nodes[selected]:null;
  const isConnecting=!!connectingState;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,overflow:"hidden"}}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <GlobalCss T={T}/>
      {toast&&<Toast {...toast}/>}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete&&(
        <div style={{position:"fixed",inset:0,zIndex:9000,
          display:"flex",alignItems:"center",justifyContent:"center",
          background:"rgba(0,0,0,0.55)",backdropFilter:"blur(3px)"}}
          onClick={()=>setConfirmDelete(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:16,padding:"28px 32px",width:360,maxWidth:"90vw",
              boxShadow:"0 24px 64px rgba(0,0,0,0.35)",
              display:"flex",flexDirection:"column",alignItems:"center",gap:16,
              animation:"fadeUp .2s ease"}}>
            <div style={{width:56,height:56,borderRadius:"50%",
              background:"rgba(239,68,68,0.12)",border:"1.5px solid rgba(239,68,68,0.3)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
              🗑
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>
                Excluir elemento
              </div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>
                Tem certeza que deseja excluir{" "}
                <span style={{fontWeight:600,color:T.text}}>
                  "{confirmDelete.label}"
                </span>
                ?<br/>
                Esta ação não pode ser desfeita.
              </div>
            </div>
            <div style={{display:"flex",gap:10,width:"100%",marginTop:4}}>
              <button onClick={()=>setConfirmDelete(null)}
                style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${T.border}`,
                  background:T.surface2,color:T.text,fontSize:13,fontWeight:600,
                  cursor:"pointer",fontFamily:"Outfit,sans-serif"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface3}
                onMouseLeave={e=>e.currentTarget.style.background=T.surface2}>
                Cancelar
              </button>
              <button onClick={()=>executeDelete(confirmDelete.id)}
                style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",
                  background:"#ef4444",color:"white",fontSize:13,fontWeight:700,
                  cursor:"pointer",fontFamily:"Outfit,sans-serif"}}
                onMouseEnter={e=>e.currentTarget.style.background="#dc2626"}
                onMouseLeave={e=>e.currentTarget.style.background="#ef4444"}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{height:52,background:T.surface,borderBottom:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,zIndex:100}}>
        <button onClick={onBack}
          style={{padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,
            borderRadius:8,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
          ← Dashboard
        </button>
        <div style={{width:1,height:24,background:T.border}}/>
        <input value={funnel.name} onChange={e=>setFunnel(f=>({...f,name:e.target.value}))}
          onBlur={()=>doSave(nodes,connections)}
          style={{fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:14,background:"transparent",
            border:"1px solid transparent",borderRadius:6,color:T.text,padding:"4px 8px",outline:"none",minWidth:200}}
          onFocus={e=>e.target.style.borderColor=T.border}
          onBlurCapture={e=>e.target.style.borderColor="transparent"}/>
        <div style={{flex:1}}/>
        {isConnecting&&(
          <div style={{fontSize:11,color:T.accent,fontWeight:600,background:T.accent+"18",
            padding:"4px 10px",borderRadius:6,border:`1px solid ${T.accent}44`}}>
            {connectingState?.style==="dashed"?"- - -":"———"} Clique na porta de entrada
          </div>
        )}
        <button onClick={autoLayout}
          style={{padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,
            borderRadius:8,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
          ⚡ Auto Layout
        </button>
        <div style={{display:"flex",alignItems:"center",gap:6,color:T.muted,fontSize:11}}>
          {saving
            ?<><div style={{width:14,height:14,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite"}}/><span>Salvando...</span></>
            :<span style={{color:T.green}}>✓ Salvo</span>}
        </div>
        <button onClick={()=>doSave(nodes,connections)}
          style={{padding:"6px 16px",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
            border:"none",borderRadius:8,color:"white",fontSize:12,fontWeight:700,
            cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>💾 Salvar</button>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <SidebarPanel
          onDragStart={(type,e)=>e.dataTransfer.setData("nodeType",type)}
          width={sidebarW}
          onResize={setSidebarW}
        />

        {/* Canvas */}
        <div ref={canvasRef} className={`canvas-bg${connectingState?" connecting":""}`}
          style={{flex:1,position:"relative",overflow:"hidden",
            background:T.canvasBg,
            backgroundImage:`linear-gradient(${T.canvasGrid} 1px,transparent 1px),linear-gradient(90deg,${T.canvasGrid} 1px,transparent 1px)`,
            backgroundSize:`${32*scale}px ${32*scale}px`,
            backgroundPosition:`${pan.x*scale}px ${pan.y*scale}px`,
            cursor:panning?"grabbing":isConnecting?"crosshair":"default"}}
          onMouseDown={onCanvasMouseDown} onWheel={onWheel}
          onDragOver={e=>e.preventDefault()} onDrop={onDrop}>

          {/* SVG connections */}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",
            pointerEvents:"none",zIndex:3,overflow:"visible"}}>
            <defs>
              <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L9,3.5 z" fill={T.connLine}/>
              </marker>
              <marker id="arr-t" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L9,3.5 z" fill={T.accent}/>
              </marker>
            </defs>
            {connections.map((c,i)=>{
              const f=portScreen(c.from,c.fromPort||"right"),t=portScreen(c.to,c.toPort||"left");
              return(
                <g key={i} style={{pointerEvents:"stroke",cursor:"pointer"}} onClick={()=>deleteConnection(i)}>
                  <path d={bezier(f.x,f.y,t.x,t.y)} fill="none" stroke="transparent" strokeWidth={12}/>
                  <path d={bezier(f.x,f.y,t.x,t.y,c.fromPort||"right",c.toPort||"left")} fill="none"
                    stroke={c.style==="dashed"?T.accent2:T.connLine} strokeWidth={2}
                    strokeDasharray={c.style==="dashed"?"8 5":"none"} markerEnd="url(#arr)"/>
                </g>
              );
            })}
            {(()=>{
              if(!connectingState)return null;
              const f=portScreen(connectingState.fromId,connectingState.fromPort||"right");
              return(
                <path d={bezier(f.x,f.y,mouseScreen.x,mouseScreen.y,connectingState.fromPort||"right","left")} fill="none"
                  stroke={T.accent} strokeWidth={2}
                  strokeDasharray={connectingState.style==="dashed"?"7 4":"none"}
                  opacity={0.85} markerEnd="url(#arr-t)"/>
              );
            })()}
          </svg>

          {/* Nodes */}
          {Object.values(nodes).map(n=>{
            const def=NODE_DEFS[n.type]||NODE_DEFS.landing;
            const isSel=selected===n.id;
            const sp=canvasToScreen(n.x,n.y);
            const isPage    = def.iconType==="page";
            const isAction  = def.iconType==="action";
            const isPessoa  = def.iconType==="pessoa";
            const isForma   = def.iconType==="forma";
            const isProduto = def.iconType==="produto";

            if(isForma) {
              // ── Flowchart shape node ──────────────────────────────
              // Sizes: circles/diamonds smaller, others wider
              const circShapes = ["conector","ou","e"];
              const tallShapes = ["bdados"];
              const sqShapes   = ["decisao"];
              let FW, FH;
              if(circShapes.includes(def.formaShape))      { FW=58*scale; FH=58*scale; }
              else if(sqShapes.includes(def.formaShape))   { FW=80*scale; FH=56*scale; }
              else if(tallShapes.includes(def.formaShape)) { FW=72*scale; FH=68*scale; }
              else                                          { FW=110*scale; FH=52*scale; }

              const bg = def.formaBg||"#3b82f6";
              const col = def.formaColor||"white";

              return (
                <div key={n.id}
                  style={{position:"absolute",left:sp.x,top:sp.y,
                    width:FW,display:"flex",flexDirection:"column",alignItems:"center",
                    cursor:"grab",userSelect:"none",zIndex:5}}
                  onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                  {/* Delete btn */}
                  <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                    style={{position:"absolute",top:-6*scale,right:-4*scale,
                      width:16*scale,height:16*scale,borderRadius:"50%",
                      background:"#ef4444",border:`${scale}px solid ${T.canvasBg}`,
                      color:"white",fontSize:8*scale,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                  {/* Shape */}
                  <div style={{
                    filter:isSel?`drop-shadow(0 0 ${5*scale}px ${bg}cc)`:"drop-shadow(0 2px 6px rgba(0,0,0,.22))",
                    transition:"filter .15s",
                  }}>
                    <FormaShapeSVG
                      shape={def.formaShape} w={FW} h={FH}
                      bg={bg} color={col}
                      label={n.label}
                      selected={isSel} scale={scale}
                      fontSize={10*scale}/>
                  </div>
                  <NodePorts id={n.id} W={FW} H={FH} accent={bg}/>
                </div>
              );
            }

            if(isProduto) {
              // ── Produto node — rounded card ───────────────────────
              const PW=80*scale, PH=80*scale;
              const bg = def.produtoBg||"#6366f1";
              return (
                <div key={n.id}
                  style={{position:"absolute",left:sp.x,top:sp.y,
                    width:PW, display:"flex",flexDirection:"column",alignItems:"center",
                    cursor:"grab",userSelect:"none",zIndex:5}}
                  onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                  <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                    style={{position:"absolute",top:-6*scale,right:0,
                      width:16*scale,height:16*scale,borderRadius:"50%",
                      background:"#ef4444",border:`${scale}px solid ${T.canvasBg}`,
                      color:"white",fontSize:8*scale,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                  <div style={{
                    width:PW, height:PH,
                    borderRadius:14*scale,
                    background:bg,
                    overflow:"hidden",
                    border:isSel?`${2.5*scale}px solid white`:"none",
                    boxShadow:isSel
                      ?`0 0 0 ${2*scale}px ${bg}, 0 6px 20px ${bg}66`
                      :`0 4px 16px ${bg}55`,
                    transition:"all .15s",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    position:"relative",
                  }}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",
                      background:"rgba(255,255,255,0.12)",borderRadius:`${14*scale}px ${14*scale}px 60% 60%`}}/>
                    <div style={{width:PW*0.78,height:PH*0.78,color:bg,position:"relative",zIndex:1}}>
                      {PRODUTO_SVGS[def.produtoIcon]||<span style={{fontSize:PW*0.4}}>📦</span>}
                    </div>
                  </div>
                  <div style={{marginTop:5*scale,fontSize:10*scale,fontWeight:700,
                    color:T.nodeLabel,textAlign:"center",lineHeight:1.3,
                    maxWidth:PW+20,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    pointerEvents:"none"}}>
                    {n.label}
                  </div>
                  <NodePorts id={n.id} W={PW} H={PH} accent={bg}/>
                </div>
              );
            }

            if(isPessoa) {
              // ── Pessoa node — circle avatar ───────────────────────
              const PS = 64*scale;
              const bg = def.pessoaBg||"#6366f1";
              return (
                <div key={n.id}
                  style={{position:"absolute",left:sp.x,top:sp.y,
                    width:PS, display:"flex",flexDirection:"column",alignItems:"center",
                    cursor:"grab",userSelect:"none",zIndex:5}}
                  onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                  {/* Delete btn */}
                  <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                    style={{position:"absolute",top:-6*scale,right:0,
                      width:16*scale,height:16*scale,borderRadius:"50%",
                      background:"#ef4444",border:`${scale}px solid ${T.canvasBg}`,
                      color:"white",fontSize:8*scale,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                  {/* Avatar circle */}
                  <div style={{
                    width:PS, height:PS, borderRadius:"50%",
                    background:bg, overflow:"hidden",
                    border:isSel?`${2.5*scale}px solid white`:`${1.5*scale}px solid ${bg}88`,
                    boxShadow:isSel?`0 0 0 ${2*scale}px ${bg}, 0 4px 16px ${bg}55`:`0 3px 10px ${bg}44`,
                    transition:"all .15s", flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <div style={{width:"100%",height:"100%"}}>
                      {PESSOA_SVGS[def.pessoaIcon]||<span style={{color:"white",fontSize:PS*0.5}}>👤</span>}
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{marginTop:5*scale,fontSize:10*scale,fontWeight:700,
                    color:T.nodeLabel,textAlign:"center",lineHeight:1.3,
                    maxWidth:PS+20,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    pointerEvents:"none"}}>
                    {n.label}
                  </div>
                  {/* Role badge */}
                  <div style={{marginTop:2*scale,fontSize:8*scale,fontWeight:500,
                    color:"white",background:bg,borderRadius:20*scale,
                    padding:`${1.5*scale}px ${6*scale}px`,pointerEvents:"none",
                    maxWidth:PS+20,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {def.label}
                  </div>
                  <NodePorts id={n.id} W={PS} H={PS} accent={bg}/>
                </div>
              );
            }

            if(isAction) {
              // ── Diamond action node ───────────────────────────────
              const DS = 64*scale; // diamond bounding box size
              const accent = def.actionBg||"#22c55e";
              return (
                <div key={n.id}
                  style={{position:"absolute",left:sp.x,top:sp.y,
                    width:DS, display:"flex",flexDirection:"column",alignItems:"center",
                    cursor:"grab",userSelect:"none",zIndex:5}}
                  onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                  {/* Delete btn */}
                  <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                    style={{position:"absolute",top:-4*scale,right:-4*scale,
                      width:16*scale,height:16*scale,borderRadius:"50%",
                      background:"#ef4444",border:`${scale}px solid ${T.canvasBg}`,
                      color:"white",fontSize:8*scale,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                  {/* Diamond */}
                  <div style={{
                    width:DS, height:DS, position:"relative",
                    filter:isSel?`drop-shadow(0 0 ${6*scale}px ${accent}88)`:"drop-shadow(0 3px 6px rgba(0,0,0,.25))",
                    transition:"filter .15s",
                  }}>
                    <svg width={DS} height={DS} viewBox="0 0 64 64" style={{position:"absolute",inset:0}}>
                      <rect x="5" y="5" width="54" height="54" rx="7"
                        fill={accent}
                        stroke={isSel?"white":"none"} strokeWidth={isSel?2:0}
                        transform="rotate(45 32 32)"/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",
                      alignItems:"center",justifyContent:"center",padding:DS*0.22}}>
                      {ACTION_SVGS[def.actionIcon]?ACTION_SVGS[def.actionIcon]("white"):<span style={{color:"white",fontSize:DS*0.35}}>●</span>}
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{marginTop:5*scale,fontSize:10*scale,fontWeight:600,
                    color:T.nodeLabel,textAlign:"center",lineHeight:1.3,
                    maxWidth:DS+16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    pointerEvents:"none"}}>
                    {n.label}
                  </div>
                  <NodePorts id={n.id} W={DS} H={DS} accent={accent}/>
                </div>
              );
            }

            if(isPage) {
              // ── Browser mockup node ───────────────────────────────
              const NW=90*scale, NH=108*scale, BAR=11*scale;
              const accent = def.accent||"#4f8ef7";
              return (
                <div key={n.id}
                  style={{position:"absolute",left:sp.x,top:sp.y,
                    width:NW,display:"flex",flexDirection:"column",alignItems:"center",
                    cursor:"grab",userSelect:"none",zIndex:5}}
                  onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                  {/* Delete btn */}
                  <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                    style={{position:"absolute",top:-6*scale,right:4*scale,
                      width:16*scale,height:16*scale,borderRadius:"50%",
                      background:"#ef4444",border:`${scale}px solid ${isSel?"#fff":T.canvasBg}`,
                      color:"white",fontSize:8*scale,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                  {/* Browser window */}
                  <div style={{
                    width:NW, height:NH,
                    borderRadius:4*scale,
                    border:isSel?`${2*scale}px solid ${accent}`:`${1.5*scale}px solid #c8d6e5`,
                    background:"white",
                    boxShadow:isSel
                      ?`0 0 0 ${3*scale}px ${accent}44, 0 6px 20px rgba(0,0,0,.22)`
                      :`0 3px 12px rgba(0,0,0,.15)`,
                    overflow:"hidden",
                    transition:"border-color .15s,box-shadow .15s",
                  }}>
                    {/* Title bar */}
                    <div style={{height:BAR,background:"#f1f5f9",
                      borderBottom:`${scale}px solid #e2e8f0`,
                      display:"flex",alignItems:"center",gap:2*scale,
                      padding:`0 ${4*scale}px`,flexShrink:0}}>
                      {["#f87171","#fbbf24","#34d399"].map((c,i)=>(
                        <div key={i} style={{width:3.5*scale,height:3.5*scale,
                          borderRadius:"50%",background:c}}/>
                      ))}
                      <div style={{flex:1,height:3*scale,background:"#e2e8f0",
                        borderRadius:2*scale,margin:`0 ${3*scale}px`}}/>
                    </div>
                    {/* Wireframe content */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
                      height:NH-BAR,padding:3*scale}}>
                      <PageWireframe type={def.pageIcon} w={(NW-6*scale)/1} h={NH-BAR-6*scale} accent={accent}/>
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{marginTop:5*scale,fontSize:10*scale,fontWeight:600,
                    color:T.nodeLabel,textAlign:"center",lineHeight:1.3,
                    maxWidth:NW+10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    pointerEvents:"none"}}>
                    {n.label}
                  </div>
                  {/* 4-port connectors */}
                  <NodePorts id={n.id} W={NW} H={NH} accent={accent}/>
                </div>
              );
            }

            // ── Circle icon node (traffic sources + actions) ──────────
            const ICO=NODE_ICO*scale,TW=NODE_W*scale;
            return(
              <div key={n.id}
                style={{position:"absolute",left:sp.x,top:sp.y,width:TW,height:NODE_H*scale,
                  display:"flex",flexDirection:"column",alignItems:"center",
                  cursor:"grab",userSelect:"none",zIndex:5}}
                onMouseDown={e=>onNodeMouseDown(e,n.id)}>
                <button className="del-btn" onClick={e=>{e.stopPropagation();deleteNode(n.id);}}
                  style={{position:"absolute",top:0,right:TW/2-ICO/2-4*scale,
                    width:16*scale,height:16*scale,borderRadius:"50%",
                    background:"#ef4444",border:`${scale}px solid ${T.canvasBg}`,
                    color:"white",fontSize:8*scale,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    zIndex:30,fontWeight:900,lineHeight:1,padding:0}}>✕</button>
                <div style={{width:ICO,height:ICO,borderRadius:"50%",background:def.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:def.iconType==="text"?ICO*0.38:ICO*0.44,fontWeight:800,
                  color:def.iconType==="text"?def.iconColor:undefined,
                  border:isSel?`${2.5*scale}px solid ${T.accent}`:def.bg==="#fff"?`${1.5*scale}px solid #d1d5db`:`${1.5*scale}px solid transparent`,
                  boxShadow:isSel?`0 0 0 ${3*scale}px ${T.accent}33,0 4px 16px rgba(0,0,0,.25)`:`0 3px 12px rgba(0,0,0,.2)`,
                  transition:"border-color .15s,box-shadow .15s",flexShrink:0}}>
                  {def.iconType==="svg"&&SVG_ICONS[def.icon]?SVG_ICONS[def.icon](ICO):def.icon}
                </div>
                <div style={{marginTop:6*scale,fontSize:10.5*scale,fontWeight:600,
                  color:T.nodeLabel,textAlign:"center",lineHeight:1.3,
                  maxWidth:TW,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  pointerEvents:"none"}}>
                  {n.label}
                </div>
                {/* 4-port connectors — offset so ports align with icon circle */}
                <NodePorts id={n.id} W={ICO} H={ICO} accent={def.accent}
                  xOffset={(TW-ICO)/2} yOffset={0}/>
              </div>
            );
          })}

          {/* Line style picker */}
          {lineStyleMenu&&(
            <div style={{position:"absolute",left:lineStyleMenu.x,top:lineStyleMenu.y,
              zIndex:200,background:T.surface2,border:`1px solid ${T.border2}`,
              borderRadius:12,padding:8,boxShadow:"0 8px 32px rgba(0,0,0,.2)",
              display:"flex",flexDirection:"column",gap:4}}>
              {[{style:"solid",label:"Linha contínua",color:T.connLine},{style:"dashed",label:"Linha pontilhada",color:T.accent2}].map(opt=>(
                <div key={opt.style} onClick={()=>onPickStyle(opt.style)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                    borderRadius:8,cursor:"pointer",transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface3}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <svg width="40" height="12">
                    <defs>
                      <marker id={`m-${opt.style}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill={opt.color}/>
                      </marker>
                    </defs>
                    <line x1="2" y1="6" x2="34" y2="6" stroke={opt.color} strokeWidth="2"
                      strokeDasharray={opt.style==="dashed"?"5 3":"none"}
                      markerEnd={`url(#m-${opt.style})`}/>
                  </svg>
                  <span style={{fontSize:12,fontWeight:500,color:T.text}}>{opt.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty hint */}
          {Object.keys(nodes).length===0&&(
            <div style={{position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",opacity:.4}}>
              <div style={{fontSize:52,marginBottom:12}}>🗺️</div>
              <div style={{fontWeight:700,fontSize:16,color:T.muted}}>Arraste elementos para o canvas</div>
              <div style={{fontSize:12,color:T.muted2,marginTop:4}}>Use a barra lateral para começar</div>
            </div>
          )}

          {/* Zoom controls */}
          <div style={{position:"absolute",bottom:16,right:16,display:"flex",gap:4,zIndex:50}}>
            {[["−",()=>setScale(s=>Math.max(0.25,s-0.1))],[`${Math.round(scale*100)}%`,null],["＋",()=>setScale(s=>Math.min(2.5,s+0.1))],["⊹",()=>{setScale(1);setPan({x:60,y:60});}]].map(([l,fn],i)=>(
              <button key={i} onClick={fn||undefined}
                style={{minWidth:32,height:32,padding:"0 8px",background:T.surface,
                  border:`1px solid ${T.border}`,borderRadius:8,color:fn?T.muted:T.muted2,
                  fontSize:i===1?11:15,cursor:fn?"pointer":"default",
                  fontFamily:"Outfit,sans-serif",fontWeight:500,transition:"all .15s"}}
                onMouseEnter={e=>{if(fn)e.currentTarget.style.borderColor=T.accent;}}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                {l}
              </button>
            ))}
          </div>

          {/* Node Toolbar */}
          {toolbar&&nodes[toolbar.nodeId]&&(["isTraffic","page","action","pessoa","forma","produto"].some(t=>t==="isTraffic"?NODE_DEFS[nodes[toolbar.nodeId].type]?.isTraffic:NODE_DEFS[nodes[toolbar.nodeId].type]?.iconType===t))&&(
            <NodeToolbar
              node={nodes[toolbar.nodeId]} tab={toolbar.tab} T={T}
              scale={scale} canvasToScreen={canvasToScreen}
              onTabChange={tab=>setToolbar(t=>t?{...t,tab}:t)}
              onDelete={id=>{deleteNode(id);setToolbar(null);}}
              onDuplicate={(id,mode)=>duplicateNode(id,mode)}
              onCopy={id=>{const n=nodesRef.current[id];if(n){clipRef.current={...n};showToast("📋 Nó copiado!");}}}
              onStyleChange={(id,type)=>updateNode(id,{type,label:NODE_DEFS[type]?.label||""})}
              updateNode={updateNode}
              onOpenMonitor={()=>{
                setMonitorNodeId(toolbar.nodeId);
                setMonitorOpen(true);
                // center panel in viewport
                setMonPanelX(Math.max(60, window.innerWidth/2 - 320));
                setMonPanelY(Math.max(60, window.innerHeight/2 - 220));
              }}/>
          )}

          {/* Monitor Panel — fixed floating, draggable & resizable */}
          {monitorOpen&&monitorNodeId&&nodes[monitorNodeId]&&(
            <MonitorPanel T={T}
              node={nodes[monitorNodeId]}
              save={p=>{
                if(p._closeMonitor){setMonitorOpen(false);return;}
                updateNode(monitorNodeId,p);
              }}
              panelW={monPanelW} setPanelW={setMonPanelW}
              panelH={monPanelH} setPanelH={setMonPanelH}
              panelX={monPanelX} setPanelX={setMonPanelX}
              panelY={monPanelY} setPanelY={setMonPanelY}
            />
          )}
        </div>

        {/* Properties panel — non-traffic only */}
        {selNode&&!NODE_DEFS[selNode.type]?.isTraffic&&!["page","action","pessoa","forma","produto"].includes(NODE_DEFS[selNode.type]?.iconType)&&(()=>{
          const def=NODE_DEFS[selNode.type];
          const creatives=selNode.creatives||[];
          function addCreative(){updateNode(selected,{creatives:[...creatives,{id:Date.now(),url:"",label:""}]});}
          function updCreative(cid,p){updateNode(selected,{creatives:creatives.map(c=>c.id===cid?{...c,...p}:c)});}
          function remCreative(cid){updateNode(selected,{creatives:creatives.filter(c=>c.id!==cid)});}
          return(
            <div style={{width:230,background:T.surface,borderLeft:`1px solid ${T.border}`,
              padding:16,flexShrink:0,overflowY:"auto"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:14,
                display:"flex",alignItems:"center",gap:8,color:T.text}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:def?.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,
                  color:def?.iconType==="text"?def?.iconColor:"inherit",
                  border:def?.bg==="#fff"?"1px solid #e5e7eb":"none",flexShrink:0}}>
                  {def?.iconType==="svg"&&SVG_ICONS[def?.icon]?SVG_ICONS[def.icon](24):def?.icon}
                </div>
                Propriedades
              </div>
              {[
                {lbl:"Nome",key:"label",val:selNode.label||"",type:"text"},
                {lbl:"URL da página",key:"url",val:selNode.url||"",type:"text",
                  onBlur:v=>{if(v)analyzeUrl(selected,v);}},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:12}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",
                    letterSpacing:"0.8px",color:T.muted2,marginBottom:5}}>{f.lbl}</label>
                  <input type={f.type} value={f.val}
                    onChange={e=>updateNode(selected,{[f.key]:e.target.value})}
                    onBlur={f.onBlur?e=>f.onBlur(e.target.value):undefined}
                    onKeyDown={f.key==="url"?e=>{if(e.key==="Enter")analyzeUrl(selected,selNode.url);}:undefined}
                    placeholder={f.key==="url"?"https://suapagina.com":"Nome do passo"}
                    style={{width:"100%",padding:"7px 10px",background:T.bg,border:`1px solid ${T.border}`,
                      borderRadius:8,color:T.text,fontSize:12,outline:"none",fontFamily:"Outfit,sans-serif"}}
                    onFocus={e=>e.target.style.borderColor=T.accent}
                    onBlurCapture={e=>e.target.style.borderColor=T.border}/>
                  {f.key==="url"&&selNode.urlInsight&&(
                    <div style={{fontSize:10,color:T.muted2,marginTop:4}}>💡 {selNode.urlInsight}</div>
                  )}
                </div>
              ))}
              <div style={{borderTop:`1px solid ${T.border}`,margin:"14px 0"}}/>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",
                letterSpacing:"0.8px",color:T.muted2,marginBottom:10}}>Métricas</div>
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",
                  letterSpacing:"0.8px",color:T.muted2,marginBottom:5}}>Visitantes / mês</label>
                <input type="number" value={selNode.visitors||0}
                  onChange={e=>updateNode(selected,{visitors:parseInt(e.target.value)||0})}
                  style={{width:"100%",padding:"7px 10px",background:T.bg,border:`1px solid ${T.border}`,
                    borderRadius:8,color:T.accent,fontSize:13,fontWeight:700,outline:"none",fontFamily:"Outfit,sans-serif"}}
                  onFocus={e=>e.target.style.borderColor=T.accent}
                  onBlur={e=>e.target.style.borderColor=T.border}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",
                  letterSpacing:"0.8px",color:T.muted2,marginBottom:5}}>Conversão %</label>
                <input type="number" min="0" max="100" value={selNode.convRate||0}
                  onChange={e=>updateNode(selected,{convRate:Math.min(100,parseInt(e.target.value)||0)})}
                  style={{width:"100%",padding:"7px 10px",background:T.bg,border:`1px solid ${T.border}`,
                    borderRadius:8,color:T.green,fontSize:13,fontWeight:700,outline:"none",fontFamily:"Outfit,sans-serif"}}
                  onFocus={e=>e.target.style.borderColor=T.accent}
                  onBlur={e=>e.target.style.borderColor=T.border}/>
                <div style={{height:4,background:T.surface2,borderRadius:2,overflow:"hidden",marginTop:6}}>
                  <div style={{height:"100%",width:`${selNode.convRate||0}%`,borderRadius:2,
                    background:`linear-gradient(90deg,${def?.accent||T.accent},${def?.accent||T.accent}88)`}}/>
                </div>
              </div>
              <div style={{borderTop:`1px solid ${T.border}`,marginTop:14,paddingTop:14}}>
                <button onClick={()=>deleteNode(selected)}
                  style={{width:"100%",padding:"8px 0",background:"rgba(239,68,68,0.1)",
                    border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#ef4444",
                    fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.1)"}>
                  🗑 Excluir elemento
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]       = useState("loading");
  const [user,setUser]           = useState(null);
  const [openFunnel,setOpenFunnel] = useState(null);
  const [dark,setDark]           = useState(false);
  const T = makeTheme(dark);

  useEffect(()=>{
    // Check existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if(session?.user){
        const profile = await dbGetProfile(session.user.id);
        setUser({
          id:    session.user.id,
          email: session.user.email,
          name:  profile?.name || session.user.user_metadata?.name || session.user.email.split("@")[0]
        });
        setScreen("dashboard");
      } else {
        setScreen("login");
      }
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if(event==="SIGNED_OUT" || !session){ setUser(null); setScreen("login"); }
    });
    return () => subscription.unsubscribe();
  },[]);

  async function handleLogin(u){setUser(u);setScreen("dashboard");}
  async function handleLogout(){await supabase.auth.signOut();setUser(null);setScreen("login");}
  function openBuilder(f){setOpenFunnel(f);setScreen("builder");}

  const toggleBtn=(
    <button onClick={()=>setDark(d=>!d)} title={dark?"Modo claro":"Modo escuro"}
      style={{position:"fixed",bottom:20,left:20,zIndex:9999,width:40,height:40,
        background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,
        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:18,boxShadow:"0 2px 12px rgba(0,0,0,.15)",transition:"all .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.transform="scale(1.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="scale(1)";}}>
      {dark?"☀️":"🌙"}
    </button>
  );

  if(screen==="loading") return(
    <ThemeCtx.Provider value={T}>
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}>
        <GlobalCss T={T}/>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16}}>🗺️</div>
          <div style={{width:24,height:24,border:`2px solid ${T.border2}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto"}}/>
        </div>
      </div>
    </ThemeCtx.Provider>
  );

  return(
    <ThemeCtx.Provider value={T}>
      {screen==="login"     && <LoginScreen onLogin={handleLogin}/>}
      {screen==="dashboard" && <Dashboard user={user} onOpen={openBuilder} onLogout={handleLogout}/>}
      {screen==="builder"   && <FunnelBuilder funnel={openFunnel} user={user} onBack={()=>setScreen("dashboard")}/>}
      {screen!=="builder"   && toggleBtn}
    </ThemeCtx.Provider>
  );
}
