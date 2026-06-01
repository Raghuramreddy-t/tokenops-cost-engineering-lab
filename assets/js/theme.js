(() => {
 const key='tokenops-theme', root=document.documentElement, button=document.getElementById('theme-toggle');
 const saved=localStorage.getItem(key); if(saved==='light'||saved==='dark') root.dataset.theme=saved;
 button?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem(key,root.dataset.theme);});
})();
