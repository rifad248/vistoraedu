/* ═══ VISTORA EDU — SHARED CONFIG (loaded by ALL pages) ═══ */
var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbt4ct8JGiBQhkPatsPjo9LAFD8Aoc9W9I_m2EWcwhglIlwv2s9i9WQPKh2Zo-9ApX/exec";
var ANALYTICS_CONFIG = { ga4MeasurementId: "" }; // EDIT: add real GA4 ID when ready
var WA_NUMBER = "919946439474";
var CONFIG = { googleRating:null, googleCount:null, reviews:[], partners:[] }; // genuine data only
window.dataLayer = window.dataLayer || [];

function trackEvent(name, data){
  try{
    console.log("[Vistora Event]", name, data||{});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({event:name}, data||{}));
    if (ANALYTICS_CONFIG.ga4MeasurementId && typeof window.gtag === "function") window.gtag("event", name, data||{});
  }catch(e){}
}
function submitLead(lead, done){
  lead.ts = new Date().toISOString();
  if(!lead.stage) lead.stage = "New Enquiry";
  lead.page_url = window.location.href; lead.page_title = document.title;
  var p = new URLSearchParams(window.location.search);
  lead.utm_source=p.get("utm_source")||""; lead.utm_medium=p.get("utm_medium")||"";
  lead.utm_campaign=p.get("utm_campaign")||""; lead.utm_content=p.get("utm_content")||"";
  lead.utm_term=p.get("utm_term")||"";
  fetch(GOOGLE_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(lead)})
    .then(function(){console.log("[Vistora Lead Saved]",lead);if(done)done(lead);})
    .catch(function(e){console.error("[Vistora Lead Error]",e);if(done)done(lead);});
}
/* Portal/Admin API (Apps Script actions) */
function api(action, data, token){
  return fetch(GOOGLE_SCRIPT_URL,{
    method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"},
    body: JSON.stringify({action:action, data:data||{}, token:token||undefined})
  }).then(function(r){ return r.json(); });
}
/* helpers */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function digits(v){ return String(v||"").replace(/\D/g,""); }
function validPhone(v){ var d=digits(v); return d.length>=10 && d.length<=13; }
function waLink(phone, text){ return "https://wa.me/"+digits(phone||WA_NUMBER)+"?text="+encodeURIComponent(text||""); }

/* SVG icon sprite — injected once on every page */
(function(){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'
  +'<symbol id="i-wa" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></symbol>'
  +'<symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.9z"/></symbol>'
  +'<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></symbol>'
  +'<symbol id="i-ig" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></symbol>'
  +'<symbol id="i-fb" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></symbol>'
  +'<symbol id="i-star" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 2l2.9 6.26 6.6.56-5 4.4 1.5 6.5L12 16.9 5.99 19.72l1.5-6.5-5-4.4 6.6-.56L12 2z"/></symbol>'
  +'<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></symbol>'
  +'<symbol id="i-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></symbol>'
  +'<symbol id="i-list" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></symbol>'
  +'<symbol id="i-brief" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></symbol>'
  +'<symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></symbol>'
  +'<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></symbol>'
  +'<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></symbol>'
  +'<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></symbol>'
  +'<symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>'
  +'<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></symbol>'
  +'<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></symbol>'
  +'<symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>'
  +'<symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></symbol>'
  +'<symbol id="i-building" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16"/><path d="M10 7h1M13 7h1M10 11h1M13 11h1M10 15h1M13 15h1"/></symbol>'
  +'<symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></symbol>'
  +'<symbol id="i-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>'
  +'<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></symbol>'
  +'<symbol id="i-send" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></symbol>'
  +'</svg>';
  document.addEventListener("DOMContentLoaded", function(){
    var d=document.createElement("div"); d.innerHTML=svg;
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  });
})();
