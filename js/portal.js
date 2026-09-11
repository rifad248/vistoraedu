/* ═══ VISTORA EDU — portal.html logic (requires js/config.js) ═══ */
(function(){
"use strict";
var STAGES=["Application Received","Under Review","Counselling","College Shortlisted","Application Submitted","Admission Processing","Admission Confirmed"];
var DEF={wa:WA_NUMBER,phone:"+91 99464 39474",email:"vistoraedu@gmail.com",instagram:"https://www.instagram.com/vistoraedu/",
  homeTitle:"Vistora Edu — Student Admission & Guidance Portal",
  homeNote:"Apply once, track everything. Personalised admission guidance for Nursing, BPT, BBA, BCA, B.Com, Engineering and more — Kerala, Karnataka & Tamil Nadu."};
var settings=Object.assign({},DEF);
var K={S:"ve_students",F:"ve_feedback"};
function LSg(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function LSs(k,v){localStorage.setItem(k,JSON.stringify(v));}
var lStudents=LSg(K.S,[]),lFeedback=LSg(K.F,[]);
var SK="ve_session2",sess=null; try{sess=JSON.parse(localStorage.getItem(SK));}catch(e){}
function setSess(v){sess=v;v?localStorage.setItem(SK,JSON.stringify(v)):localStorage.removeItem(SK);}

/* backend with offline fallback */
function dbApply(s){
  return api("apply",s).then(function(r){if(!r||!r.ok)throw new Error(r&&r.error||"Failed");return r;})
  .catch(function(){
    var id="VIS-"+Math.floor(10000+Math.random()*89999);
    s.appId=id;s.createdAt=s.updatedAt=new Date().toISOString();s.stage="Application Received";
    s.counsellor="";s.counsellorPhone="";s.recommendations=[];s.documents=[];s.admission=null;s.feedbackGiven=false;
    lStudents.push(s);LSs(K.S,lStudents);return {ok:true,appId:id,offline:true};
  });
}
function dbLogin(phone,dob){
  return api("login",{phone:phone,dob:dob}).then(function(r){if(!r||!r.ok)throw new Error(r&&r.error||"Failed");return r;})
  .catch(function(){
    var s=lStudents.filter(function(x){return digits(x.phone).slice(-10)===digits(phone).slice(-10)&&x.dob===dob;})[0];
    if(!s)throw new Error("No application found for this phone number and date of birth.");
    return {ok:true,student:s};
  });
}
function dbGetStudent(appId,phone){
  return api("getStudent",{appId:appId,phone:phone}).then(function(r){if(!r||!r.ok)throw new Error("Not found");return r;})
  .catch(function(){
    var s=lStudents.filter(function(x){return x.appId===appId;})[0];
    if(!s)throw new Error("Not found");return {ok:true,student:s};
  });
}
function dbSaveFeedback(fb){
  return api("saveFeedback",fb).then(function(r){if(!r||!r.ok)throw new Error("Failed");return r;})
  .catch(function(){fb.fbId=(fb.appId||"ANON")+"-"+Date.now();fb.status="Pending";lFeedback.push(fb);LSs(K.F,lFeedback);return {ok:true};});
}
function dbPublicFeedback(){
  return api("publicFeedback").then(function(r){if(!r||!r.ok)throw new Error("Failed");return r.feedback;})
  .catch(function(){return lFeedback.filter(function(f){return f.status==="Published";});});
}
function dbGetSettings(){
  return api("getSettings").then(function(r){if(!r||!r.ok)throw new Error("Failed");return r.settings;})
  .catch(function(){return Object.assign({},DEF);});
}

/* router */
var VIEWS=["home","apply","applydone","slogin","student"];
function go(v){
  VIEWS.forEach(function(x){$("view-"+x).classList.toggle("on",x===v);});
  ["home","slogin","apply"].forEach(function(b){var el=$("nb-"+b);if(el)el.classList.toggle("on",(b==="home"&&v==="home")||(b==="slogin"&&(v==="student"||v==="slogin"))||(b==="apply"&&v==="apply"));});
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",function(e){
  if(!e.target.closest)return;
  var t=e.target.closest("[data-go]"); if(!t)return; e.preventDefault();
  var v=t.getAttribute("data-go");
  if(v==="student"){ if(sess&&sess.role==="student")loadStudent(); else go("slogin"); return; }
  go(v);
});

/* apply */
 $("applyForm").addEventListener("submit",function(e){
  e.preventDefault();
  var err=$("aErr"); err.classList.remove("show");
  function bad(m){err.textContent=m;err.classList.add("show");}
  var name=$("aName").value.trim(),dob=$("aDob").value,phone=$("aPhone").value.trim(),wa=$("aWa").value.trim();
  if(!name)return bad("Please enter the student's full name.");
  if(!dob)return bad("Please select the date of birth.");
  if(new Date(dob)>new Date())return bad("Date of birth cannot be in the future.");
  if(!validPhone(phone))return bad("Please enter a valid phone number.");
  if(!validPhone(wa))return bad("Please enter a valid WhatsApp number.");
  var btn=$("aSubmit"); btn.disabled=true; btn.textContent="SUBMITTING…";
  dbApply({name:name,dob:dob,gender:$("aGender").value,phone:phone,whatsapp:wa,email:$("aEmail").value.trim(),
    course:$("aCourse").value,entrance:$("aExam").value,rank:$("aRank").value.trim(),score:$("aScore").value.trim(),
    category:$("aCat").value,prefState:$("aState").value,budget:$("aBudget").value,prefCollege:$("aPref").value.trim(),
    address:$("aAddr").value.trim(),notes:$("aNotes").value.trim()})
  .then(function(r){
    trackEvent("lead_submit",{source:"Student Admission Portal",course:$("aCourse").value});
    $("doneId").textContent=r.appId;
    $("doneWa").href=waLink(null,"🔔 NEW ADMISSION ENQUIRY\n\nStudent: "+name+"\nPhone: "+phone+"\nCourse: "+$("aCourse").value+"\nExam: "+$("aExam").value+"\nRank: "+$("aRank").value.trim()+"\nCategory: "+$("aCat").value+"\nBudget: "+$("aBudget").value+"\nPreferred State: "+$("aState").value+"\n\nApplication ID: "+r.appId+"\n\nPlease contact the student.");
    this.reset(); btn.disabled=false; btn.textContent="SUBMIT APPLICATION";
    go("applydone");
  }.bind(this))
  .catch(function(){btn.disabled=false;btn.textContent="SUBMIT APPLICATION";bad("Could not submit. Please check your connection and try again.");});
});

/* login */
 $("loginForm").addEventListener("submit",function(e){
  e.preventDefault();
  var err=$("lErr"); err.classList.remove("show");
  var btn=$("lSubmit"); btn.disabled=true;
  dbLogin($("lPhone").value.trim(),$("lDob").value).then(function(r){
    setSess({role:"student",appId:r.student.appId,phone:$("lPhone").value.trim()});
    this.reset(); btn.disabled=false; renderStudent(r.student);
  }.bind(this)).catch(function(ex){btn.disabled=false;err.textContent=ex.message||"Login failed.";err.classList.add("show");});
});

/* dashboard */
function loadStudent(){
  dbGetStudent(sess.appId,sess.phone).then(function(r){renderStudent(r.student);})
  .catch(function(){setSess(null);go("slogin");});
}
function kv(k,v){return '<div><b>'+esc(k)+'</b><span>'+esc(v)+'</span></div>';}
function fmtDate(iso){if(!iso)return"—";var p=String(iso).split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:iso;}
function renderStudent(st){
  var co=(st.counsellorPhone&&st.counsellor)?{name:st.counsellor,phone:st.counsellorPhone}:{name:st.counsellor||null,phone:settings.wa};
  var si=Math.max(0,STAGES.indexOf(st.stage));
  var seen=LSg("ve_seen_"+st.appId,null), hasUpdate=!seen||st.updatedAt>seen;
  var newRecs=(st.recommendations||[]).filter(function(r){return r.published&&(!seen||r.ts>seen);}).length;
  var html='<div class="card"><div style="display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:space-between;align-items:flex-start">'
    +'<div><h2 style="font-size:1.35rem">Welcome, '+esc(st.name.split(" ")[0])+' 👋</h2><p class="muted">Application ID: <b style="color:var(--blue)">'+esc(st.appId)+'</b></p></div>'
    +'<div class="btn-row"><button class="btn btn-outline btn-sm" id="stRefresh">Refresh</button><button class="btn btn-red btn-sm" id="stLogout">Logout</button></div></div>'
    +(hasUpdate?'<p class="okmsg show" style="margin-top:12px">🔔 Your admission status was recently updated by the Vistora team.</p>':'')
    +'<p style="margin-top:14px;font-weight:700;color:var(--ink)">Admission Status: <span class="badge p-blue">'+esc(st.stage)+'</span></p>'
    +'<div class="tl">'+STAGES.map(function(s,i){return '<span class="'+(i<si?"done":i===si?"now":"")+'">'+esc(s)+'</span>';}).join("")+'</div></div>';
  html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">💬 Your Counsellor</h3>'
    +(st.counsellor?'<p style="margin-top:6px;font-weight:700;color:var(--ink)">'+esc(st.counsellor)+'</p><p class="muted small">Your dedicated admission counsellor</p>':'<p class="muted" style="margin-top:6px">A counsellor will be assigned shortly. Meanwhile, the Vistora admission team is available.</p>')
    +'<div class="btn-row" style="margin-top:14px;justify-content:flex-start">'
    +'<a class="btn btn-cyan" target="_blank" rel="noopener" href="'+waLink(co.phone,"Hello, I am "+st.name+". My Application ID is "+st.appId+". I would like to know about my admission status.")+'">💬 WhatsApp Counsellor</a>'
    +'<a class="btn btn-outline" href="tel:+91'+digits(co.phone).slice(-10)+'">📞 Call</a></div></div>';
  html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">📋 My Admission Details</h3>'
    +'<p class="small" style="font-weight:700;color:var(--ink);margin-top:12px">Personal Details</p><div class="kv">'+kv("Name",st.name)+kv("Date of Birth",fmtDate(st.dob))+kv("Gender",st.gender)+kv("Phone",st.phone)+kv("WhatsApp",st.whatsapp)+(st.email?kv("Email",st.email):"")+kv("Address",st.address||"—")+'</div>'
    +'<p class="small" style="font-weight:700;color:var(--ink);margin-top:16px">Academic Details</p><div class="kv">'+kv("Course",st.course)+kv("Entrance Exam",st.entrance)+kv("Rank",st.rank||"—")+kv("Score / Marks",st.score||"—")+kv("Category",st.category)+'</div>'
    +'<p class="small" style="font-weight:700;color:var(--ink);margin-top:16px">Preferences</p><div class="kv">'+kv("Preferred State",st.prefState)+kv("Budget",st.budget)+kv("Preferred College",st.prefCollege||"—")+(st.notes?kv("Other Requirements",st.notes):"")+'</div></div>';
  var recs=(st.recommendations||[]).filter(function(r){return r.published;});
  html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">🎓 Recommended Colleges '+(newRecs?'<span class="badge p-cyan">'+newRecs+' NEW</span>':'')+'</h3>';
  html+=recs.length?recs.map(function(r){return '<div style="border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:12px">'+(r.ts>(seen||0)?'<span class="badge p-cyan" style="float:right">NEW</span>':'')+'<b style="color:var(--ink)">'+esc(r.college)+'</b><p class="small">'+esc(r.course)+(r.location?' · '+esc(r.location):'')+(r.fee?' · Fee: '+esc(r.fee):'')+'</p>'+(r.remarks?'<p class="small" style="color:var(--muted)">'+esc(r.remarks)+'</p>':'')+'</div>';}).join(''):'<p class="muted" style="margin-top:8px">Your counsellor\'s college recommendations will appear here as they are added.</p>';
  html+='</div>';
  html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">📄 Documents</h3>';
  html+=(st.documents||[]).length?'<div class="tbl-wrap" style="margin-top:12px"><table style="min-width:420px"><thead><tr><th>Document</th><th>Status</th></tr></thead><tbody>'+st.documents.map(function(d){return '<tr><td>'+esc(d.name)+'</td><td><span class="badge '+(d.status==="Verified"?"p-ok":d.status==="Received"?"p-blue":"p-warn")+'">'+esc(d.status)+'</span></td></tr>';}).join("")+'</tbody></table></div>':'<p class="muted" style="margin-top:8px">Your document checklist will appear here. General list: 10th &amp; Plus Two marks cards, TC, ID proof, photos.</p>';
  html+='</div>';
  if(st.admission&&st.admission.confirmed){
    html+='<div class="card" style="border-color:#BFE5CE"><h3 style="margin-top:0;font-size:1.1rem">🎓 Admission Details</h3>'
      +'<div class="kv">'+kv("College",st.admission.college)+kv("Course",st.admission.course)+(st.admission.fee?kv("Fee Details",st.admission.fee):"")+kv("Date",st.admission.date)+'</div>'
      +'<button class="btn btn-blue" id="dlPdf" style="margin-top:16px">⬇ DOWNLOAD ADMISSION PDF</button></div>';
  }
  if(si>=2&&!st.feedbackGiven){
    html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">⭐ How was your experience?</h3>'
      +'<div class="stars" id="fbStars" style="margin-top:10px">'+[1,2,3,4,5].map(function(i){return '<button type="button" data-v="'+i+'">★</button>';}).join("")+'</div>'
      +'<div class="field" style="margin-top:12px"><label for="fbText">Your feedback</label><textarea id="fbText"></textarea></div>'
      +'<button class="btn btn-blue" id="fbSend" style="margin-top:12px">Submit Feedback</button>'
      +'<p class="fnote" style="margin-top:8px">Feedback is reviewed by Vistora before appearing on the website.</p></div>';
  }else if(st.feedbackGiven){
    html+='<div class="card"><h3 style="margin-top:0;font-size:1.1rem">⭐ Feedback</h3><p class="muted" style="margin-top:6px">Thank you — we\'ve received your feedback. 💙</p></div>';
  }
  html+='<div class="ig-card"><div><h3>📸 Follow Vistora Education</h3><p>Get admission updates, career tips &amp; important notifications.</p></div>'
    +'<a class="btn btn-white" href="'+esc(settings.instagram)+'" target="_blank" rel="noopener">Follow us on Instagram</a></div>';
  $("studentRoot").innerHTML=html;
  LSs("ve_seen_"+st.appId,new Date().toISOString());
  $("stLogout").onclick=function(){setSess(null);go("slogin");};
  $("stRefresh").onclick=loadStudent;
  var dp=$("dlPdf"); if(dp)dp.onclick=function(){buildPDF(st);};
  var fb=$("fbSend");
  if(fb){
    var rating=0;
    Array.prototype.forEach.call($("fbStars").children,function(b){b.onclick=function(){rating=+b.dataset.v;Array.prototype.forEach.call($("fbStars").children,function(x){x.classList.toggle("fill",+x.dataset.v<=rating);});};});
    fb.onclick=function(){
      if(!rating){alert("Please select a star rating.");return;}
      dbSaveFeedback({appId:st.appId,name:st.name,rating:rating,text:$("fbText").value.trim()}).then(loadStudent);
    };
  }
}

/* PDF */
function buildPDF(st){
  $("printSheet").innerHTML='<div class="psheet-logo"><span class="m">V</span><div><b>VISTORA EDUCATION</b><div style="font-size:.72rem;letter-spacing:.14em;color:#667">ADMISSION &amp; CAREER GUIDANCE</div></div></div>'
    +'<div class="ps-title">ADMISSION CONFIRMATION</div>'
    +'<div class="ps-row"><b>Student</b>'+esc(st.name)+'</div><div class="ps-row"><b>Application ID</b>'+esc(st.appId)+'</div>'
    +'<div class="ps-row"><b>Course</b>'+esc(st.admission.course||st.course)+'</div><div class="ps-row"><b>College</b>'+esc(st.admission.college)+'</div>'
    +(st.admission.fee?'<div class="ps-row"><b>Fee Details</b>'+esc(st.admission.fee)+'</div>':'')
    +'<div class="ps-row"><b>Admission Status</b><span style="color:#0E7A3C;font-weight:800">CONFIRMED</span></div>'
    +'<div class="ps-row"><b>Counsellor</b>'+esc(st.admission.counsellor||st.counsellor||"Vistora Admission Team")+'</div>'
    +'<div class="ps-row"><b>Date</b>'+esc(st.admission.date)+'</div>'
    +'<div class="ps-stamp"><span>Student Signature</span><span>Authorised Signatory — Vistora Education</span></div>'
    +'<div class="ps-foot">Vistora Edu · '+esc(settings.phone)+' · '+esc(settings.email)+' · Generated from the Vistora Student Portal on '+new Date().toLocaleDateString("en-IN")+'.</div>';
  window.print();
}

/* home */
function renderHome(){
  $("homeTitle").textContent=settings.homeTitle;
  $("homeNote").textContent=settings.homeNote;
  dbPublicFeedback().then(function(pub){
    $("homeStories").innerHTML=pub.length?pub.map(function(f){
      return '<div class="card"><p style="color:#F5B301;font-size:1.05rem;margin:0">'+"★".repeat(f.rating)+'</p><p style="margin-top:8px;color:var(--ink)">"'+esc(f.text||"")+'"</p><p class="muted small" style="margin-top:10px">— '+esc(f.name)+'</p></div>';
    }).join(""):'<div class="card center" style="grid-column:1/-1"><p class="muted">Verified student and parent stories will appear here.</p></div>';
  });
}

/* init */
 $("yy").textContent=new Date().getFullYear();
dbGetSettings().then(function(s){settings=Object.assign({},DEF,s);renderHome();}).catch(renderHome);
 $("footContact").innerHTML=esc(settings.phone)+' · <a href="mailto:'+esc(settings.email)+'">'+esc(settings.email)+'</a>';
if(sess&&sess.role==="student")loadStudent(); else go("home");
})();
