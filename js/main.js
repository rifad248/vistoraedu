/* ═══ VISTORA EDU — index.html logic (requires js/config.js) ═══ */
(function(){
"use strict";

/* nav */
var navToggle=$("navToggle");
if(navToggle){
  navToggle.addEventListener("click",function(){
    var open=document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded",open?"true":"false");
  });
  Array.prototype.forEach.call(document.querySelectorAll("#navMenu a"),function(a){
    a.addEventListener("click",function(){document.body.classList.remove("nav-open");navToggle.setAttribute("aria-expanded","false");});
  });
}

/* global conversion tracking */
document.addEventListener("click",function(e){
  if(!e.target.closest) return;
  var wa=e.target.closest("a[href*='wa.me']");
  if(wa){trackEvent("whatsapp_click",{label:wa.getAttribute("data-wa-label")||"general"});return;}
  var tel=e.target.closest("a[href^='tel:']");
  if(tel){trackEvent("phone_click",{label:tel.getAttribute("data-tel-label")||"general"});}
});

/* marquee — the only animation */
(function(){
  var track=$("mqTrack"); if(!track) return;
  var names = CONFIG.partners.length ? CONFIG.partners.map(function(p){return p.name;})
    : (function(){var a=[];for(var i=0;i<10;i++)a.push("Education Partner");return a;})();
  var set=names.map(function(n){return '<div class="mq-card"><svg class="ic" aria-hidden="true"><use href="#i-building"/></svg><b>'+esc(n)+'</b></div>';}).join("");
  track.innerHTML=set+set;
})();

/* ═══ COURSE FINDER (7 steps + contact; NO budget) ═══ */
var QUIZ=[
 {q:"Where are you right now in your studies?",opts:[["After 10th","Choosing your next step"],["Studying Plus One / Plus Two","Planning a degree after school"],["Plus Two completed","Ready for degree admission"],["Diploma completed","Planning higher studies"],["Degree final year / completed","Planning the next step"]]},
 {q:"Which stream did you study / are you studying?",opts:[["Science (PCB / PCMB)","Biology group"],["Science (PCM / Other)","Maths or combined"],["Commerce","Business, accounts, economics"],["Humanities / Arts",""],["Mixed / Not sure",""]]},
 {q:"Which area interests you most right now?",opts:[["Business & Management","BBA and business paths"],["Computing & IT","BCA, software and data"],["Commerce & Finance","B.Com, accounting, banking"],["Nursing & Healthcare","Nursing, BPT, allied health"],["Engineering & Technology","B.Tech and design paths"],["Not sure yet","Exploring — that's what guidance is for"]]},
 {q:"What is your main goal after the course?",opts:[["Get job-ready soon","Practical skills and placements"],["Higher studies / professional exams","PG route ahead"],["Start something of my own","Business or freelance"],["Still exploring","Open to different futures"]]},
 {q:"Where would you prefer to study?",opts:[["My home city / town in Kerala","Stay close to family"],["Elsewhere in Kerala",""],["Karnataka",""],["Tamil Nadu",""],["Flexible — guide me","Location isn't deciding"]]},
 {q:"When do you plan to start?",opts:[["This admission season","Ready to apply now"],["Next academic year","Planning ahead"],["Just exploring","No fixed timeline yet"]]}
];
var CATS=[
 {short:"BBA",t:"BBA — Bachelor of Business Administration",d:"Management, marketing, HR and finance foundations — suits future managers, founders and business careers."},
 {short:"BCA",t:"BCA — Bachelor of Computer Applications",d:"Software, apps, data and IT foundations with strong, career-oriented paths."},
 {short:"B.Com",t:"B.Com — Bachelor of Commerce",d:"Accounting, taxation, banking and finance — a versatile commerce core with professional options."},
 {short:"B.Sc Nursing",t:"B.Sc Nursing & Healthcare",d:"Nursing and healthcare professions — we map eligibility, college options in Kerala, Karnataka and Tamil Nadu, and the admission process."},
 {short:"Engineering",t:"Engineering (B.Tech / B.E.)",d:"Technology and core engineering specialisations — we'll map entrance routes and college options."},
 {short:"BPT",t:"BPT — Bachelor of Physiotherapy",d:"Physiotherapy careers with clear clinical pathways — we check eligibility and suitable colleges with you."},
 {short:"Allied Health",t:"Allied Health Sciences",d:"Allied health and paramedical programs with strong professional registration paths."},
 {short:"Other Degree Programs",t:"Other Degree Programs",d:"BA, BSc and emerging interdisciplinary degrees matched to your goals and strengths."},
 {short:"Not sure yet — need guidance",t:"Guided Exploration Session",d:"You're open to options — the strongest next step is a short conversation. We'll map your interests to 2–3 degree starting points."}
];
var PRIMARY=[0,1,2,3,4,8], ALSO=[[2,1],[4,0],[0,1],[5,6],[1,7],[]];
var qi=0, answers=new Array(QUIZ.length).fill(null), qc={name:"",phone:"",mode:"WhatsApp",note:""}, qBusy=false;
var quizForm=$("quizForm"),quizStep=$("quizStep"),quizDots=$("quizDots"),quizCount=$("quizCount"),
    quizHint=$("quizHint"),quizBack=$("quizBack"),quizNext=$("quizNext"),quizResult=$("quizResult"),quizTop=$("quizTop");
var TOTAL=QUIZ.length+1;
if(quizForm){
  Array.prototype.forEach.call(QUIZ,function(){var s=document.createElement("span");quizDots.appendChild(s);});
  function renderStep(){
    quizCount.textContent="Step "+(qi+1)+" of "+TOTAL;
    Array.prototype.forEach.call(quizDots.children,function(d,i){d.className=i<=qi?"on":"";});
    quizBack.disabled=(qi===0); quizHint.classList.remove("show");
    var html="";
    if(qi<QUIZ.length){
      quizNext.textContent="Next";
      var step=QUIZ[qi];
      html='<fieldset class="q-step"><legend>'+esc(step.q)+'</legend><div class="q-opts">';
      Array.prototype.forEach.call(step.opts,function(o,i){
        html+='<label class="pill"><input type="radio" name="q'+qi+'" value="'+i+'"'+(answers[qi]===i?" checked":"")+'><span>'+esc(o[0])+(o[1]?'<small>'+esc(o[1])+'</small>':'')+'</span></label>';
      });
      html+='</div></fieldset>';
    }else{
      quizNext.textContent="GET MY COURSE DIRECTION";
      html='<fieldset class="q-step"><legend>Where should we send your personalised result?</legend><div class="form-grid">'
        +'<div class="field"><label for="qName">Student\'s name *</label><input id="qName" type="text" value="'+esc(qc.name)+'"></div>'
        +'<div class="field"><label for="qPhone">Phone / WhatsApp *</label><input id="qPhone" type="tel" value="'+esc(qc.phone)+'"></div>'
        +'<div class="field full"><label for="qMode">Preferred contact mode</label><select id="qMode"><option>WhatsApp</option><option>Phone call</option><option>Either</option></select></div>'
        +'<div class="field full"><label for="qNote">Anything we should know (optional)</label><textarea id="qNote" style="min-height:70px">'+esc(qc.note)+'</textarea></div>'
        +'</div><p style="font-size:.82rem;color:var(--muted);margin-top:12px">We use these details only to guide you — nothing else. Your result appears instantly.</p></fieldset>';
      $("qMode").value=qc.mode;
    }
    quizStep.innerHTML=html;
  }
  quizStep.addEventListener("change",function(e){
    if(qi<QUIZ.length&&e.target.name&&e.target.name.indexOf("q")===0){answers[qi]=parseInt(e.target.value,10);quizHint.classList.remove("show");}
  });
  quizBack.addEventListener("click",function(){if(qi>0){qi--;renderStep();}});
  quizNext.addEventListener("click",function(){
    if(qBusy)return;
    if(qi<QUIZ.length){
      if(answers[qi]===null){quizHint.textContent="Please choose an option to continue.";quizHint.classList.add("show");return;}
      qi++;renderStep();return;
    }
    var name=$("qName").value.trim(),phone=$("qPhone").value.trim();
    qc.mode=$("qMode").value; qc.note=$("qNote").value.trim();
    if(!name){quizHint.textContent="Please enter your name.";quizHint.classList.add("show");$("qName").focus();return;}
    if(!validPhone(phone)){quizHint.textContent="Please enter a valid phone / WhatsApp number.";quizHint.classList.add("show");$("qPhone").focus();return;}
    qc.name=name; qc.phone=phone; finishQuiz();
  });
  function qrCard(tag,t,d,strong){
    return '<div class="qr-card"><span class="qr-tag'+(strong?"":" alt")+'">'+esc(tag)+'</span><div><h4>'+esc(t)+'</h4><p>'+esc(d)+'</p></div></div>';
  }
  function finishQuiz(){
    qBusy=true;
    var interest=answers[2], pIdx=PRIMARY[interest], primary=CATS[pIdx];
    var lead={source:"Course Discovery Quiz",name:qc.name,phone:qc.phone,whatsapp:qc.phone,course:primary.short,
      qualification:QUIZ[0].opts[answers[0]][0],stream:QUIZ[1].opts[answers[1]][0],interests:QUIZ[2].opts[interest][0],
      career:QUIZ[3].opts[answers[3]][0],location:QUIZ[4].opts[answers[4]][0],timing:QUIZ[5].opts[answers[5]][0],
      mode:qc.mode,note:qc.note||"Course Finder completion"};
    trackEvent("lead_submit",{source:"Course Discovery Quiz",course:primary.short});
    trackEvent("course_finder_complete",{course:primary.short});
    var waMsg="Hi Vistora Edu! Course Finder result — Interest: "+QUIZ[2].opts[interest][0]+" · Qualification: "+lead.qualification+" · Location: "+lead.location+" · Timing: "+lead.timing+". Please guide me on suitable courses.";
    var html='<p class="qr-title">Your course starting points</p><p class="qr-sub">Based on your answers — final choices are always yours, made with a counsellor.</p><div class="qr-cards">';
    html+=qrCard(pIdx===8?"Start here":"Strong match",primary.t,primary.d,true);
    Array.prototype.forEach.call(ALSO[interest],function(i){html+=qrCard("Also explore",CATS[i].t,CATS[i].d,false);});
    html+='</div><div class="next-step"><h4>YOUR NEXT STEP</h4><p>Based on your answers, let\'s identify suitable course directions for you.</p>'
      +'<div class="btn-row" style="justify-content:flex-start">'
      +'<a class="btn btn-white" href="portal.html">APPLY NOW — STUDENT PORTAL</a>'
      +'<a class="btn btn-cyan" target="_blank" rel="noopener" href="'+waLink(null,waMsg)+'" data-wa-label="quiz_result_whatsapp"><svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg> WHATSAPP VISTORA EDU</a>'
      +'<a class="btn btn-ghost" href="#contact">REQUEST COUNSELLING</a>'
      +'</div></div>';
    quizResult.innerHTML=html; quizResult.classList.add("show");
    quizForm.style.display="none"; quizTop.style.display="none";
    qBusy=false;
    submitLead(lead);
  }
  renderStep();
}

/* ═══ ADMISSION READINESS CHECK ═══ */
var readyForm=$("readyForm");
if(readyForm){
  readyForm.addEventListener("submit",function(e){
    e.preventDefault();
    var v={qualification:$("rQual").value,course:$("rCourse").value,stream:$("rStream").value,location:$("rLoc").value,
      timing:$("rTime").value,elig:(readyForm.querySelector('input[name="rElig"]:checked')||{}).value||"",
      docs:(readyForm.querySelector('input[name="rDocs"]:checked')||{}).value||""};
    var decision=(v.course==="Not sure yet")?{cls:"st-guide",label:"Needs Guidance",hint:"Pick 1–2 directions with a counsellor — the Course Finder helps."}:{cls:"st-ready",label:"Ready",hint:"You have a clear course in mind."};
    var elig=v.elig==="Checked — looks eligible"?{cls:"st-ready",label:"Ready",hint:"Basic eligibility looks fine — we verify per college before applying."}:v.elig==="Not sure"?{cls:"st-guide",label:"Needs Guidance",hint:"Eligibility depends on each college's criteria — we check it with you."}:{cls:"st-not",label:"Not Started",hint:"Share your marks with our team for a quick check."};
    var docs=v.docs==="All ready"?{cls:"st-ready",label:"Ready",hint:"Documents are in order — applications can move fast."}:v.docs==="Some ready"?{cls:"st-partial",label:"Partially Ready",hint:"Collect the rest into one folder — we'll give you the exact list."}:{cls:"st-not",label:"Not Started",hint:"Start with marks card, TC, ID proof and photos."};
    var app=(decision.label==="Ready"&&elig.label==="Ready"&&docs.label==="Ready"&&v.timing==="This admission season")?{cls:"st-ready",label:"Ready",hint:"You're set — talk to us and apply with confidence."}:v.timing==="Just exploring"?{cls:"st-guide",label:"Needs Guidance",hint:"No rush — explore first, we'll map your timeline."}:{cls:"st-partial",label:"Partially Ready",hint:"A few steps remain — we'll help you finish them."};
    var st=[{t:"Course Decision",s:decision},{t:"Eligibility",s:elig},{t:"Documents",s:docs},{t:"Application",s:app}];
    $("readyStatuses").innerHTML=st.map(function(x){return '<div class="status-card"><b>'+esc(x.t)+'</b><span class="st '+x.s.cls+'">'+esc(x.s.label)+'</span><small>'+esc(x.s.hint)+'</small></div>';}).join("");
    $("readyHonest").textContent="Honest note: eligibility is only ever confirmed against the specific criteria of each college — Vistora verifies this with you before you apply. Nothing here is a guarantee.";
    $("readyWa").href=waLink(null,"Hi Vistora Edu Admission Team! Readiness check — Course: "+v.course+" · Qualification: "+v.qualification+" · Stream: "+v.stream+" · Location: "+v.location+" · Timing: "+v.timing+" · Eligibility: "+v.elig+" · Documents: "+v.docs+". Please guide me on next steps.");
    $("readyIntro").hidden=true; $("readyResult").hidden=false;
    trackEvent("eligibility_check_complete",{course:v.course,timing:v.timing});
    $("readyLeadForm").setAttribute("data-summary","Course: "+v.course+" | Qual: "+v.qualification+" | Stream: "+v.stream+" | Loc: "+v.location+" | Timing: "+v.timing+" | Elig: "+v.elig+" | Docs: "+v.docs+" | Statuses: "+st.map(function(x){return x.t+"="+x.s.label;}).join(", "));
    $("readyResult").scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  var rlf=$("readyLeadForm");
  rlf.addEventListener("submit",function(e){
    e.preventDefault();
    if(rlf.submitting)return;
    var name=$("rName").value.trim(),phone=$("rPhone").value.trim();
    if(!name){$("rName").focus();return;}
    if(!validPhone(phone)){$("rPhone").focus();return;}
    rlf.submitting=true;
    submitLead({source:"Admission Readiness Check",name:name,phone:phone,whatsapp:phone,course:$("rCourse").value,
      qualification:$("rQual").value,stream:$("rStream").value,location:$("rLoc").value,timing:$("rTime").value,
      mode:"Phone call",note:"Readiness: "+rlf.getAttribute("data-summary")},function(){
      var s=$("rStatus");
      s.textContent="Thank you, "+name+" — your readiness was saved. Our admission team will call you shortly.";
      s.classList.add("show");
      Array.prototype.forEach.call(rlf.querySelectorAll("button"),function(b){b.disabled=true;});
    });
  });
}

/* ═══ CONTACT FORM (12 enquiry types) ═══ */
var ENQ={"Request a Callback":"callback_request","Book Parent Consultation":"parent_consultation","Enquire About Admissions":"admission_enquiry","Book a Counselling Session":"counselling_request"};
var contactForm=$("contactForm");
if(contactForm){
  contactForm.addEventListener("submit",function(e){
    e.preventDefault();
    if(contactForm.submitting)return;
    var name=$("cName").value.trim(),phone=$("cPhone").value.trim();
    if(!name){$("cName").focus();return;}
    if(!validPhone(phone)){$("cPhone").focus();return;}
    contactForm.submitting=true;
    var type=$("cType").value,course=$("cInterest").value,msg=$("cMsg").value.trim();
    trackEvent("lead_submit",{source:type});
    if(ENQ[type])trackEvent(ENQ[type],{source:type});
    window.open(waLink(null,"Hi Vistora Edu! "+type+" — Name: "+name+" · Phone: "+phone+" · Course: "+course+(msg?" · Note: "+msg:"")),"_blank");
    submitLead({source:type,name:name,phone:phone,whatsapp:phone,course:course,note:msg||(type+" — via website enquiry form"),mode:"WhatsApp"},function(){
      var s=$("formStatus");
      s.textContent="Thank you, "+name+" — your enquiry is saved. WhatsApp opened with your message ready; our team will reach out shortly.";
      s.classList.add("show");
      contactForm.submitting=false; contactForm.reset();
    });
  });
}

/* ═══ FINAL CTA ═══ */
var finalForm=$("finalForm");
if(finalForm){
  finalForm.addEventListener("submit",function(e){
    e.preventDefault();
    if(finalForm.submitting)return;
    var name=$("fName").value.trim(),phone=$("fPhone").value.trim();
    if(!name){$("fName").focus();return;}
    if(!validPhone(phone)){$("fPhone").focus();return;}
    finalForm.submitting=true;
    trackEvent("lead_submit",{source:"Final CTA"}); trackEvent("admission_enquiry",{source:"Final CTA"});
    submitLead({source:"Final CTA",name:name,phone:phone,whatsapp:phone,note:"Final CTA — requests personalised admission guidance",mode:"Phone call"},function(){
      finalForm.hidden=true; $("fSuccess").hidden=false;
    });
  });
}

/* delegated CTA presets */
document.addEventListener("click",function(e){
  if(!e.target.closest)return;
  var el=e.target.closest("[data-act]"); if(!el)return;
  var act=el.getAttribute("data-act");
  if(act==="quiz"){
    var intr=el.getAttribute("data-interest"),loc=el.getAttribute("data-loc");
    if(intr!==null&&intr!=="")answers[2]=parseInt(intr,10);
    if(loc!==null&&loc!=="")answers[4]=parseInt(loc,10);
    qi=(intr!==null&&intr!=="")?2:((loc!==null&&loc!=="")?4:0);
    if(quizResult){quizResult.classList.remove("show");quizForm.style.display="";quizTop.style.display="";renderStep();}
    var fq=$("find-course"); if(fq)fq.scrollIntoView({behavior:"smooth"});
  }else if(act==="ready"){
    var c=el.getAttribute("data-course"); if(c)$("rCourse").value=c;
    var fr=$("ready"); if(fr)fr.scrollIntoView({behavior:"smooth"});
  }
});

 $("year").textContent=new Date().getFullYear();
})();
