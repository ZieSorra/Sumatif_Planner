/* Semester/filter consistency fix */
(function(){
 if(window.__semesterFix)return; window.__semesterFix=true;
 function ensureSelect(id){const s=document.getElementById(id);if(!s||s.dataset.semesterFix)return;s.dataset.semesterFix="1";if(!s.querySelector('option[value=""]'))s.insertAdjacentHTML("afterbegin",'<option value="">Pilih Semester</option>');}
 function firstMonth(){const s=document.getElementById("calendarPlannerSemester"),y=document.getElementById("calendarPlannerYear");if(!s||!y||!s.value||!y.value)return;const text=y.options[y.selectedIndex]?.textContent||"",m=text.match(/(20\d{2})\s*\/\s*(20\d{2})/);if(!m)return;const yy=Number(s.value)===1?Number(m[1]):Number(m[2]),mm=Number(s.value)===1?5:0;if(typeof calendarPlannerState!=="undefined"){calendarPlannerState.year=yy;calendarPlannerState.month=mm;}}
 document.addEventListener("change",e=>{if(e.target.id==="calendarPlannerSemester"){firstMonth();setTimeout(firstMonth,50);}},true);
 const obs=new MutationObserver(()=>{ensureSelect("calendarPlannerSemester");ensureSelect("reportSemester");});obs.observe(document.body,{childList:true,subtree:true});
 const timer=setInterval(()=>{ensureSelect("calendarPlannerSemester");ensureSelect("reportSemester");},500);setTimeout(()=>clearInterval(timer),15000);
})();