/* ═══ VISTORA EDU — admin.html logic (requires js/config.js) ═══ */
(function(){
"use strict";
var STAGES=["Application Received","Under Review","Counselling","College Shortlisted","Application Submitted","Admission Processing","Admission Confirmed"];
var settings={counsellors:[]}, adminToken=null;
var A={students:[],feedback:[]}, adminTab="overview", openApp=null;

function dbAdminLogin(pass){
  return api("adminLogin",{pass:pass}).then(function(r){if(!r||!r.ok)throw new Error(r&&r.error||"Login failed");return r;});
}
function authed(action,data){return api(action,data,adminToken);}
function dbListStudents(){return authed("listStudents").then(function(r){if(!r||!r.ok)throw new Error(r&&r.error||"Failed");return r.students;});}
function dbSaveStudent(s){return authed("saveStudent",s).then(function(r){if(!r||!r.ok)throw new Error(r&&r.error||"Failed");return r;});}
function dbListFeedback(){return authed("listFeedback").then(function(r){if(!r||!r.ok)throw new Error("Failed");return r.feedback;});}
function dbSetFeedback(id,st){return authed("setFeedback",{fbId:id,status:st});}
function dbDelFeedback(id){return authed("delFeedback",{fbId:id});}
function dbGetSettings(){return api("getSettings").then(function(r){if(!r||!r.ok)throw new Error("Failed");return r.settings;});}
function dbSaveSettings(s){return authed("saveSettings",s);}

 $("adminLoginForm").addEventListener("submit",function(e){
  e.preventDefault();
  var err=$("gErr"); err.classList.remove("show");
  dbAdminLogin($("gPass").value).then(function(r){
    adminToken=r.token; $("gPass").value="";
    $("view-alogin").style.display="none"; $("view-admin").classList.add("on");
    renderAdmin();
  }).catch(function(ex){err.textContent=ex.message||"Login failed.";err.classList.add("show");});
});

function renderAdmin(){
  Promise.all([dbListStudents(),dbListFeedback(),dbGetSettings()]).then(function(res){
    A.students=res[0]; A.feedback=res[1]; settings=res[2]||{};
    var total=A.students.length;
    $("adminRoot").innerHTML='<div class="card"><div style="display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:space-between;align-items:center">'
      +'<h2 style="font-size:1.3rem">Vistora Admin</h2><div class="btn-row"><button class="btn btn-outline btn-sm" id="adLogout">Logout</button></div></div></div>'
      +'<div class="tabs">'+tabBtn("overview","Dashboard")+tabBtn("students","Students ("+total+")")
      +tabBtn("feedback","Feedback ("+A.feedback.filter(function(f){return f.status==="Pending";}).length+' pending)')+
      tabBtn("settings","Settings / CMS")+'</div><div id="adminBody"></div>';
    $("adLogout").onclick=function(){adminToken=null;$("view-admin").classList.remove("on");$("view-alogin").style.display="block";};
    Array.prototype.forEach.call($("adminRoot").querySelectorAll(".tabs button"),function(b){b.onclick=function(){adminTab=b.dataset.tab;openApp=null;renderTab();};});
    renderTab();
  }).catch(function(ex){alert("Could not load admin data: "+(ex.message||ex));});
}
function tabBtn(id,l){return '<button data-tab="'+id+'" class="'+(adminTab===id?"on":"")+'">'+l+'</button>';}
function stat(n,l){return '<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>';}
function stuByApp(id){return A.students.filter(function(s){return s.appId===id;})[0];}

function renderTab(){
  var body=$("adminBody");
  if(adminTab==="overview"){
    body.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:18px">'
      +stat(A.students.length,"Total Students")
      +stat(A.students.filter(function(s){return s.stage==="Application Received";}).length,"New Enquiries")
      +stat(A.students.filter(function(s){return["Counselling","College Shortlisted"].indexOf(s.stage)>-1;}).length,"Active Counselling")
      +stat(A.students.filter(function(s){return["Application Submitted","Admission Processing"].indexOf(s.stage)>-1;}).length,"Applications")
      +stat(A.students.filter(function(s){return s.stage==="Admission Confirmed";}).length,"Admissions Confirmed")
      +stat(A.students.filter(function(s){return!s.counsellor;}).length,"Pending Follow-ups")+'</div>';
  }
  else if(adminTab==="students")renderStudents(body);
  else if(adminTab==="feedback")renderFeedback(body);
  else renderSettings(body);
}

function renderStudents(body){
  body.innerHTML='<input id="adSearch" style="max-width:320px;width:100%;padding:11px 14px;border:1.5px solid var(--line-2);border-radius:11px;font-family:var(--font)" placeholder="Search name / ID / phone…">'
    +'<div class="tbl-wrap" style="margin-top:14px"><table><thead><tr><th>App ID</th><th>Student</th><th>Course</th><th>Stage</th><th>Counsellor</th><th></th></tr></thead><tbody id="adRows"></tbody></table></div><div id="adEditor"></div>';
  function rows(){
    var q=($("adSearch").value||"").toLowerCase();
    $("adRows").innerHTML=A.students.filter(function(s){return!q||(s.name+" "+s.appId+" "+s.phone).toLowerCase().indexOf(q)>-1;}).map(function(s){
      return '<tr><td><b>'+esc(s.appId)+'</b></td><td>'+esc(s.name)+'<div class="small" style="color:var(--muted)">'+esc(s.phone)+'</div></td><td>'+esc(s.course)+'</td>'
      +'<td><select data-stage="'+esc(s.appId)+'">'+STAGES.map(function(x){return '<option'+(x===s.stage?" selected":"")+'>'+esc(x)+'</option>';}).join("")+'</select></td>'
      +'<td><select data-couns="'+esc(s.appId)+'"><option value="">— assign —</option>'+(settings.counsellors||[]).map(function(c){return '<option value="'+esc(c.name)+"|"+esc(c.phone)+'"'+(c.name===s.counsellor?" selected":"")+'>'+esc(c.name)+'</option>';}).join("")+'</select></td>'
      +'<td><button class="btn btn-outline btn-sm" data-open="'+esc(s.appId)+'">Open</button></td></tr>';
    }).join("")||'<tr><td colspan="6" class="muted center" style="padding:24px">No applications yet — new submissions appear here from the Google Sheet.</td></tr>';
  }
  rows(); $("adSearch").oninput=rows;
  $("adRows").addEventListener("change",function(e){
    var t=e.target,sid=t.getAttribute("data-stage")||t.getAttribute("data-couns"); if(!sid)return;
    var s=stuByApp(sid); if(!s)return;
    if(t.getAttribute("data-stage"))s.stage=t.value;
    else{var p=t.value.split("|");s.counsellor=p[0]||"";s.counsellorPhone=p[1]||"";}
    dbSaveStudent(s);
  });
  $("adRows").addEventListener("click",function(e){
    if(!e.target.closest)return;
    var b=e.target.closest("[data-open]"); if(b)renderEditor(b.getAttribute("data-open"));
  });
  if(openApp)renderEditor(openApp);
}

function fld(id,label,val){return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" value="'+esc(val)+'"></div>';}
function fldD(id,label,val){return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="date" value="'+esc(val)+'"></div>';}
function flash(id){var el=$(id);el.classList.add("show");setTimeout(function(){el.classList.remove("show");},1800);}

function renderEditor(appId){
  openApp=appId; var s=stuByApp(appId); if(!s)return;
  var ed=$("adEditor"); if(!ed)return;
  var recs=(s.recommendations||[]).map(function(r,i){
    return '<div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:10px"><b style="color:var(--ink)">'+esc(r.college)+'</b> '
      +'<span class="badge '+(r.published?"p-ok":"p-grey")+'">'+(r.published?"Published":"Draft")+'</span>'
      +'<p class="small">'+esc(r.course)+(r.location?' · '+esc(r.location):'')+(r.fee?' · '+esc(r.fee):'')+'</p>'
      +(r.remarks?'<p class="small" style="color:var(--muted)">'+esc(r.remarks)+'</p>':'')
      +'<div class="btn-row" style="margin-top:8px;justify-content:flex-start"><button class="btn btn-sm '+(r.published?"btn-outline":"btn-blue")+'" data-recpub="'+i+'">'+(r.published?"Unpublish":"Publish to Student")+'</button>'
      +'<button class="btn btn-red btn-sm" data-recdel="'+i+'">Delete</button></div></div>';
  }).join("")||'<p class="muted small" style="margin-top:8px">No recommendations yet.</p>';
  var docs=(s.documents||[]).map(function(d,i){return '<div style="display:flex;gap:10px;align-items:center;margin-top:8px"><b class="small" style="flex:1;color:var(--ink)">'+esc(d.name)+'</b>'
    +'<select data-docst="'+i+'"><option'+(d.status==="Requested"?" selected":"")+'>Requested</option><option'+(d.status==="Received"?" selected":"")+'>Received</option><option'+(d.status==="Verified"?" selected":"")+'>Verified</option></select>'
    +'<button class="btn btn-red btn-sm" data-docdel="'+i+'">✕</button></div>';}).join("");
  var adm=s.admission||{college:"",course:s.course,fee:"",counsellor:s.counsellor,date:new Date().toISOString().slice(0,10),confirmed:false};
  ed.innerHTML='<div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'
    +'<h3 style="font-size:1.15rem">'+esc(s.name)+' <span class="muted">('+esc(s.appId)+')</span></h3><button class="btn btn-outline btn-sm" id="edClose">Close</button></div>'
    +'<div class="fgrid" style="margin-top:16px">'
    +fld("edName","Full Name",s.name)+fldD("edDob","Date of Birth",s.dob)+fld("edPhone","Phone",s.phone)+fld("edWa","WhatsApp",s.whatsapp)+fld("edEmail","Email",s.email||"")
    +fld("edCourse","Course",s.course)+fld("edExam","Entrance",s.entrance)+fld("edRank","Rank",s.rank)+fld("edScore","Score",s.score)+fld("edCat","Category",s.category)
    +fld("edState","Preferred State",s.prefState)+fld("edBudget","Budget",s.budget)+fld("edPref","Preferred College",s.prefCollege||"")
    +'</div>'
    +'<div class="field" style="margin-top:12px"><label>Address</label><textarea id="edAddr" style="min-height:50px">'+esc(s.address||"")+'</textarea></div>'
    +'<div class="field" style="margin-top:10px"><label>Other requirements</label><textarea id="edNotes" style="min-height:50px">'+esc(s.notes||"")+'</textarea></div>'
    +'<div class="field" style="margin-top:10px"><label>Admin notes (internal)</label><textarea id="edAdmin" style="min-height:50px">'+esc(s.adminNote||"")+'</textarea></div>'
    +'<div class="btn-row" style="margin-top:14px;justify-content:flex-start"><button class="btn btn-blue" id="edSave">Save to Google Sheet</button><span class="okmsg" id="edSaved">Saved ✓</span></div>'
    +'<hr class="divider"><h4 style="color:var(--ink)">🎓 College Recommendations</h4>'+recs
    +'<div class="fgrid" style="margin-top:12px">'+fld("rcCollege","College","")+fld("rcCourse","Course","")+fld("rcLoc","Location","")+fld("rcFee","Fee information","")+'</div>'
    +'<div class="field" style="margin-top:10px"><label>Remarks</label><input id="rcRem"></div>'
    +'<button class="btn btn-cyan btn-sm" id="rcAdd" style="margin-top:10px">+ Add Recommendation</button>'
    +'<hr class="divider"><h4 style="color:var(--ink)">📄 Documents</h4>'+docs
    +'<div class="fgrid" style="margin-top:10px">'+fld("dcName","Document name","")+'</div><button class="btn btn-cyan btn-sm" id="dcAdd" style="margin-top:10px">+ Add Document</button>'
    +'<hr class="divider"><h4 style="color:var(--ink)">🎓 Admission Record (enables student PDF when confirmed)</h4>'
    +'<div class="fgrid" style="margin-top:12px">'+fld("adCollege","College",adm.college)+fld("adCourse","Course",adm.course)+fld("adFee","Fee details",adm.fee||"")+fld("adCouns","Counsellor",adm.counsellor||"")+fldD("adDate","Date",adm.date)+'</div>'
    +'<label style="display:flex;gap:10px;align-items:center;margin-top:12px;font-weight:700;color:var(--ink)"><input type="checkbox" id="adConf" '+(adm.confirmed?"checked":"")+'> Admission CONFIRMED</label>'
    +'<div class="btn-row" style="margin-top:12px;justify-content:flex-start"><button class="btn btn-blue" id="adSave">Save Admission Record</button><span class="okmsg" id="adSaved">Saved ✓</span></div></div>';

  $("edClose").onclick=function(){openApp=null;ed.innerHTML="";};
  function readForm(){
    s.name=$("edName").value.trim();s.dob=$("edDob").value;s.phone=$("edPhone").value.trim();s.whatsapp=$("edWa").value.trim();
    s.email=$("edEmail").value.trim();s.course=$("edCourse").value;s.entrance=$("edExam").value;s.rank=$("edRank").value.trim();
    s.score=$("edScore").value.trim();s.category=$("edCat").value;s.prefState=$("edState").value;s.budget=$("edBudget").value;
    s.prefCollege=$("edPref").value.trim();s.address=$("edAddr").value.trim();s.notes=$("edNotes").value.trim();s.adminNote=$("edAdmin").value.trim();
  }
  $("edSave").onclick=function(){readForm();dbSaveStudent(s).then(function(){flash("edSaved");});};
  $("rcAdd").onclick=function(){
    var c=$("rcCollege").value.trim(); if(!c){alert("Enter college name");return;}
    s.recommendations.push({college:c,course:$("rcCourse").value.trim(),location:$("rcLoc").value.trim(),fee:$("rcFee").value.trim(),remarks:$("rcRem").value.trim(),published:false,ts:Date.now()});
    dbSaveStudent(s).then(function(){renderEditor(appId);});
  };
  ed.querySelectorAll("[data-recpub]").forEach(function(b){b.onclick=function(){var r=s.recommendations[+b.getAttribute("data-recpub")];r.published=!r.published;dbSaveStudent(s).then(function(){renderEditor(appId);});};});
  ed.querySelectorAll("[data-recdel]").forEach(function(b){b.onclick=function(){s.recommendations.splice(+b.getAttribute("data-recdel"),1);dbSaveStudent(s).then(function(){renderEditor(appId);});};});
  $("dcAdd").onclick=function(){
    var n=$("dcName").value.trim(); if(!n)return;
    s.documents.push({name:n,status:"Requested"}); dbSaveStudent(s).then(function(){renderEditor(appId);});
  };
  ed.querySelectorAll("[data-docst]").forEach(function(b){b.onchange=function(){s.documents[+b.getAttribute("data-docst")].status=b.value;dbSaveStudent(s);};});
  ed.querySelectorAll("[data-docdel]").forEach(function(b){b.onclick=function(){s.documents.splice(+b.getAttribute("data-docdel"),1);dbSaveStudent(s).then(function(){renderEditor(appId);});};});
  $("adSave").onclick=function(){
    s.admission={college:$("adCollege").value.trim(),course:$("adCourse").value.trim(),fee:$("adFee").value.trim(),counsellor:$("adCouns").value.trim(),date:$("adDate").value,confirmed:$("adConf").checked};
    if(s.admission.confirmed)s.stage="Admission Confirmed";
    dbSaveStudent(s).then(function(){flash("adSaved");renderEditor(appId);});
  };
}

function renderFeedback(body){
  body.innerHTML=A.feedback.length?A.feedback.map(function(f){
    return '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div><b style="color:var(--ink)">'+esc(f.name)+'</b> <span class="muted small">('+esc(f.appId)+') · '+'★'.repeat(f.rating)+'</span>'
      +'<p style="margin-top:6px">"'+esc(f.text||"—")+'"</p></div>'
      +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select data-fbst="'+esc(f.fbId)+'">'
      +["Pending","Published","Hidden"].map(function(x){return '<option'+(f.status===x?" selected":"")+'>'+x+'</option>';}).join("")+'</select>'
      +'<button class="btn btn-red btn-sm" data-fbdel="'+esc(f.fbId)+'">Delete</button></div></div></div>';
  }).join(""):'<div class="card center"><p class="muted">No feedback yet — student submissions from the portal appear here.</p></div>';
  body.onchange=function(e){var t=e.target;if(t.getAttribute&&t.getAttribute("data-fbst"))dbSetFeedback(t.getAttribute("data-fbst"),t.value);};
  body.onclick=function(e){if(!e.target.closest)return;var b=e.target.closest("[data-fbdel]");if(b)dbDelFeedback(b.getAttribute("data-fbdel")).then(renderTab);};
}

function renderSettings(body){
  function fld(id,label,val){return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" value="'+esc(val)+'"></div>';}
  body.innerHTML='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">Website &amp; Contact Settings (CMS — saved to Google Sheet)</h3>'
    +'<div class="fgrid" style="margin-top:14px">'+fld("sWa","WhatsApp number (digits)",settings.wa||"919946439474")+fld("sPhone","Phone display",settings.phone||"")+fld("sEmail","Email",settings.email||"")+fld("sIg","Instagram URL",settings.instagram||"")+'</div>'
    +'<div class="field" style="margin-top:12px"><label>Portal home title</label><input id="sHomeT" value="'+esc(settings.homeTitle||"")+'"></div>'
    +'<div class="field" style="margin-top:10px"><label>Portal home description</label><textarea id="sHomeN">'+esc(settings.homeNote||"")+'</textarea></div>'
    +'<button class="btn btn-blue" id="sSave" style="margin-top:14px">Save Settings</button><span class="okmsg" id="sSaved" style="margin-left:10px">Saved ✓</span>'
    +'<hr class="divider"><h4 style="color:var(--ink)">Counsellors</h4><div id="cList"></div>'
    +'<div class="fgrid" style="margin-top:10px">'+fld("cName","Counsellor name","")+fld("cPhone","Counsellor WhatsApp (digits)","")+'</div>'
    +'<button class="btn btn-cyan btn-sm" id="cAdd" style="margin-top:10px">+ Add Counsellor</button>'
    +'<hr class="divider"><h4 style="color:var(--ink)">Security</h4>'
    +'<div class="fgrid" style="margin-top:12px"><div class="field"><label for="sPass">Change admin password</label><input id="sPass" type="password" placeholder="New password (min 6 chars)"></div></div>'
    +'<button class="btn btn-blue btn-sm" id="pSave" style="margin-top:12px">Update Password</button></div>';
  function clist(){
    $("cList").innerHTML=(settings.counsellors||[]).map(function(c,i){return '<div style="display:flex;gap:10px;align-items:center;margin-top:8px"><b class="small" style="flex:1;color:var(--ink)">'+esc(c.name)+' · +91 '+esc(c.phone)+'</b><button class="btn btn-red btn-sm" data-cdel="'+i+'">Remove</button></div>';}).join("")||'<p class="muted small" style="margin-top:6px">No counsellors added.</p>';
    $("cList").querySelectorAll("[data-cdel]").forEach(function(b){b.onclick=function(){settings.counsellors.splice(+b.getAttribute("data-cdel"),1);clist();};});
  }
  clist();
  $("sSave").onclick=function(){
    settings.wa=digits($("sWa").value)||settings.wa; settings.phone=$("sPhone").value; settings.email=$("sEmail").value;
    settings.instagram=$("sIg").value; settings.homeTitle=$("sHomeT").value; settings.homeNote=$("sHomeN").value;
    dbSaveSettings(settings).then(function(){flash("sSaved");});
  };
  $("cAdd").onclick=function(){
    var n=$("cName").value.trim(),p=digits($("cPhone").value);
    if(!n||!validPhone(p)){alert("Enter name and valid WhatsApp number");return;}
    settings.counsellors.push({name:n,phone:p}); dbSaveSettings(settings).then(clist);
  };
  $("pSave").onclick=function(){
    var v=$("sPass").value; if(v.length<6){alert("Use at least 6 characters");return;}
    dbSaveSettings({adminPass:v}).then(function(){$("sPass").value="";alert("Password updated on the server.");});
  };
}

 $("yy").textContent=new Date().getFullYear();
})();
