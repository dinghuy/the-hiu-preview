/** Native gallery, lightbox and responsive layout behavior. */
const header = document.querySelector('.site-header');
if (header) new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`)).observe(header);
const gallery=document.querySelector('[data-gallery]'),dialog=document.getElementById('photo-lightbox');
if (gallery && dialog) {
  const thumbs=[...gallery.querySelectorAll('.showcase-thumb-btn')];
  const photos=thumbs.length?thumbs:[...gallery.querySelectorAll('[data-photo]')];
  const mainImg=gallery.querySelector('[data-showcase-main-img]');
  const mainFrame=gallery.querySelector('[data-main-photo-frame]');
  const showcaseCounter=gallery.querySelector('[data-showcase-counter]');
  const prevBtn=gallery.querySelector('[data-showcase-prev]');
  const nextBtn=gallery.querySelector('[data-showcase-next]');
  const image=dialog.querySelector('[data-lightbox-image]'),count=dialog.querySelector('[data-lightbox-count]'),caption=dialog.querySelector('[data-lightbox-caption]');
  let current=0,trigger;

  function setActivePhoto(index, swapMain=true){
    current=(index+photos.length)%photos.length;
    const photo=photos[current].querySelector('img');
    if (swapMain && mainImg && photo){
      mainImg.style.opacity='0.7';
      mainImg.src=photos[current].dataset.src||photo.src;
      mainImg.alt=photos[current].dataset.alt||photo.alt;
      setTimeout(()=>{mainImg.style.opacity='1';},120);
    }
    if (showcaseCounter) showcaseCounter.textContent=`${current+1} / ${photos.length}`;
    thumbs.forEach((th,i)=>{
      if (i===current){
        th.classList.add('is-active');
        th.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
      } else {
        th.classList.remove('is-active');
      }
    });
  }

  function show(index){
    current=(index+photos.length)%photos.length;
    const photo=photos[current].querySelector('img');
    image.src=photos[current].dataset.src||photo.src;
    image.alt=photos[current].dataset.alt||photo.alt;
    count.textContent=`${current+1} / ${photos.length}`;
    caption.textContent=photos[current].dataset.alt||photo.alt;
    setActivePhoto(current, true);
  }

  function open(index,button){
    trigger=button;
    show(index);
    dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.querySelector('[data-close-lightbox]').focus();
  }

  function close(){
    dialog.close();
    document.body.classList.remove('modal-open');
    trigger?.focus();
  }

  // Thumbnails click: switch main image
  thumbs.forEach((thumb,index)=>{
    thumb.addEventListener('click',e=>{
      e.preventDefault();
      setActivePhoto(index,true);
    });
  });

  // Clicking main photo opens lightbox
  mainImg?.addEventListener('click',()=>open(current,mainImg));

  document.querySelectorAll('[data-view-all]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      open(current,btn);
    });
  });

  prevBtn?.addEventListener('click',e=>{
    e.preventDefault();
    setActivePhoto(current-1,true);
  });

  nextBtn?.addEventListener('click',e=>{
    e.preventDefault();
    setActivePhoto(current+1,true);
  });

  // Swipe on main photo frame
  if (mainFrame){
    let touchStart;
    mainFrame.addEventListener('touchstart',e=>{
      const t=e.changedTouches[0];
      touchStart={x:t.clientX,y:t.clientY};
    },{passive:true});

    mainFrame.addEventListener('touchend',e=>{
      if(!touchStart)return;
      const t=e.changedTouches[0];
      const dx=t.clientX-touchStart.x;
      const dy=t.clientY-touchStart.y;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.5){
        if(dx<0) setActivePhoto(current+1,true);
        else setActivePhoto(current-1,true);
      }
      touchStart=null;
    },{passive:true});
  }

  // Lightbox controls
  dialog.querySelector('[data-close-lightbox]').addEventListener('click',close);
  dialog.querySelector('[data-photo-prev]').addEventListener('click',()=>show(current-1));
  dialog.querySelector('[data-photo-next]').addEventListener('click',()=>show(current+1));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}
  });

  let start;
  dialog.addEventListener('touchstart',event=>{const t=event.changedTouches[0];start={x:t.clientX,y:t.clientY};},{passive:true});
  dialog.addEventListener('touchend',event=>{
    if(!start)return;
    const t=event.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)show(current+(dx<0?1:-1));
    start=null;
  },{passive:true});

  const counter=document.querySelector('[data-gallery-count]');
  if(counter)counter.textContent=`1 / ${photos.length}`;
}
// Keep keyboard traversal inside an open dialog, including at its first/last control.
for (const modal of document.querySelectorAll('dialog')) {
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length && !el.hidden);
    const first = controls[0], last = controls.at(-1);
    if (!first) {event.preventDefault(); return;}
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {event.preventDefault();first.focus();}
  });
}

// Scroll-craft: Adaptive Header frosted glass on scroll
const siteHeader = document.querySelector('.site-header');
function handleScroll() {
  if (siteHeader) {
    if (window.scrollY > 30) siteHeader.classList.add('is-scrolled');
    else siteHeader.classList.remove('is-scrolled');
  }
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// Scroll-craft: Silky smooth reveal-on-scroll timeline observer
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
}

// Mobile navigation drawer toggle
const mobileMenuBtn = document.querySelector('[data-mobile-menu-toggle]');
const mobileDrawer = document.getElementById('mobile-nav-drawer');
if (mobileMenuBtn && mobileDrawer) {
  const closeBtns = mobileDrawer.querySelectorAll('[data-close-drawer]');
  
  function openDrawer() {
    mobileDrawer.removeAttribute('hidden');
    void mobileDrawer.offsetWidth;
    mobileDrawer.classList.add('is-open');
    document.body.classList.add('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    const closeBtn = mobileDrawer.querySelector('.mobile-nav-close');
    closeBtn?.focus();
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      if (!mobileDrawer.classList.contains('is-open')) {
        mobileDrawer.setAttribute('hidden', '');
      }
    }, 280);
    mobileMenuBtn.focus();
  }

  mobileMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (mobileDrawer.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeDrawer();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}

// Hydration readiness signals
document.documentElement.dataset.appReady = 'true';
window.__appReady = true;

