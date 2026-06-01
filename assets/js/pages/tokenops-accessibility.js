export function setupTabs() {
 const tabs=Array.from(document.querySelectorAll('[role="tab"]'));
 function activate(selected) {
  tabs.forEach(tab => {
   const active = tab === selected;
   tab.classList.toggle('active', active);
   tab.setAttribute('aria-selected', String(active));
   const panel=document.getElementById(tab.getAttribute('aria-controls'));
   if(panel){panel.hidden=!active;panel.classList.toggle('active',active);}
  });
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activate(tab));
  tab.addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
   event.preventDefault();
   let next=index;
   if(event.key==='ArrowRight') next=(index+1)%tabs.length;
   if(event.key==='ArrowLeft') next=(index-1+tabs.length)%tabs.length;
   if(event.key==='Home') next=0;
   if(event.key==='End') next=tabs.length-1;
   tabs[next].focus(); activate(tabs[next]);
  });
 });
}
