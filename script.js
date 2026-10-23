// Behaviour for the portfolio. No dependencies, and nothing here is required to read the page:
// with JavaScript off, every section is visible and complete.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  /* ------------------------------------------------ hero name: shrink long names to fit their column */

  const heroName = document.querySelector('.hero__name');

  function fitName() {
    if (!heroName) return;
    heroName.style.fontSize = '';
    heroName.classList.add('is-measuring');
    const available = heroName.querySelector('.hero__line').clientWidth;
    const widest = Math.max(
      ...[...heroName.querySelectorAll('.hero__line-inner')].map((line) => line.getBoundingClientRect().width)
    );
    heroName.classList.remove('is-measuring');
    if (widest > available) {
      const size = parseFloat(getComputedStyle(heroName).fontSize);
      heroName.style.fontSize = `${Math.floor((size * available * 0.98) / widest)}px`;
    }
  }

  /* ------------------------------------------------ hero glow: pause while it's off screen */

  const heroBg = document.querySelector('[data-hero-bg]');
  if (heroBg && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => heroBg.toggleAttribute('data-paused', !entry.isIntersecting)).observe(heroBg);
  }

  /* ------------------------------------------------ header + section nav */

  const header = document.querySelector('[data-header]');
  const links = [...document.querySelectorAll('[data-nav-link]')];
  const activeCopy = document.querySelector('[data-nav-active]');
  let activeId = null;

  function placePill() {
    const link = links.find((l) => l.hash === `#${activeId}`);
    links.forEach((l) => (l === link ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current')));
    if (!activeCopy) return;
    if (!link || activeCopy.offsetParent === null) {
      activeCopy.removeAttribute('data-visible');
      return;
    }

    const left = link.offsetLeft;
    const top = link.offsetTop;
    const right = activeCopy.clientWidth - (left + link.offsetWidth);
    const bottom = activeCopy.clientHeight - (top + link.offsetHeight);
    // Appearing from nothing: place the pill first, then fade it in, so it doesn't slide in from the left edge.
    const instant = !activeCopy.hasAttribute('data-visible') || reduceMotion.matches;

    if (instant) activeCopy.setAttribute('data-instant', '');
    activeCopy.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 999px)`;
    activeCopy.setAttribute('data-visible', '');
    if (instant) {
      void getComputedStyle(activeCopy).clipPath;
      activeCopy.removeAttribute('data-instant');
    }
  }

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id === 'top' ? null : entry.target.id;
          if (id !== activeId) {
            activeId = id;
            placePill();
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    document.querySelectorAll('#top, main > section[id]').forEach((s) => spy.observe(s));
  }

  /* ------------------------------------------------ mobile menu */

  const menuButton = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-menu]');
  let closeTimer;

  function openMenu() {
    clearTimeout(closeTimer);
    menu.hidden = false;
    menu.dataset.state = 'closed';
    void menu.offsetWidth;
    menu.dataset.state = 'open';
    menuButton.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onKey);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    menu.dataset.state = 'closed';
    menuButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside);
    document.removeEventListener('keydown', onKey);
    closeTimer = setTimeout(() => {
      if (menu.dataset.state === 'closed') menu.hidden = true;
    }, 160);
    if (restoreFocus) menuButton.focus();
  }

  function onOutside(event) {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  }

  function onKey(event) {
    if (event.key === 'Escape') closeMenu({ restoreFocus: true });
  }

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      menuButton.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  /* ------------------------------------------------ scroll reveals */
  // Content starts visible. Just before an element scrolls into view, it plays a short rise from
  // below. Elements already on screen at load are left alone, so nothing ever waits at opacity 0.

  if (!reduceMotion.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    const targets = [
      ...document.querySelectorAll('[data-reveal]'),
      ...[...document.querySelectorAll('[data-reveal-group]')].flatMap((group) => [...group.children]),
    ];

    const reveal = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((entry, index) => {
            reveal.unobserve(entry.target);
            entry.target.animate(
              [
                { opacity: 0, transform: 'translateY(24px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 800, delay: index * 70, easing: EASE_OUT, fill: 'backwards' }
            );
            // Grade bars draw out to their value, clipped so the rounded end keeps its shape.
            const bar = entry.target.querySelector('.grade__fill');
            if (bar) {
              bar.animate(
                [{ clipPath: 'inset(0 100% 0 0 round 999px)' }, { clipPath: 'inset(0 0 0 0 round 999px)' }],
                { duration: 1100, delay: index * 70 + 150, easing: EASE_OUT, fill: 'backwards' }
              );
            }
          });
      },
      { rootMargin: '0px 0px 6% 0px' }
    );

    targets.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) reveal.observe(el);
    });
  }

  /* ------------------------------------------------ experience timeline */

  const timeline = document.querySelector('[data-timeline]');
  const progress = document.querySelector('[data-timeline-progress]');
  const roles = [...document.querySelectorAll('[data-role]')];
  const cssDrivesLine = window.CSS && CSS.supports('animation-timeline: view()');

  function updateTimeline() {
    if (!timeline) return;
    const middle = window.innerHeight / 2;

    // Fallback for browsers without scroll-driven animations: same maths, set on the element directly.
    if (!cssDrivesLine && !reduceMotion.matches) {
      const box = timeline.getBoundingClientRect();
      const amount = Math.min(1, Math.max(0, (middle - box.top) / box.height));
      progress.style.transform = `scaleY(${amount})`;
    }

    roles.forEach((role) => {
      const marker = role.querySelector('.role__marker');
      role.toggleAttribute('data-passed', reduceMotion.matches || marker.getBoundingClientRect().top < middle);
    });
  }

  function monthsBetween(from, to) {
    const [fy, fm] = from.split('-').map(Number);
    const [ty, tm] = to.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm) + 1;
  }

  function formatDuration(months) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (rest) parts.push(`${rest} ${rest === 1 ? 'mo' : 'mos'}`);
    return parts.join(' ') || '1 mo';
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  document.querySelectorAll('[data-from]').forEach((el) => {
    el.textContent = formatDuration(monthsBetween(el.dataset.from, el.dataset.to || thisMonth));
  });

  /* ------------------------------------------------ local time next to the portrait */

  const clock = document.querySelector('[data-local-time]');
  if (clock) {
    try {
      const format = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', timeZone: clock.dataset.tz });
      const tick = () => {
        clock.textContent = `${format.format(new Date())} local time`;
      };
      tick();
      clock.hidden = false;
      setTimeout(() => {
        tick();
        setInterval(tick, 60_000);
      }, 60_000 - (Date.now() % 60_000));
    } catch {
      // Unknown time zone: leave the clock hidden.
    }
  }

  /* ------------------------------------------------ copy email */

  const copyButton = document.querySelector('[data-copy]');
  const copyStatus = document.querySelector('[data-copy-status]');
  let copiedTimer;

  function showCopied() {
    copyButton.setAttribute('data-copied', '');
    if (copyStatus) copyStatus.textContent = 'Email address copied';
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copyButton.removeAttribute('data-copied');
      if (copyStatus) copyStatus.textContent = '';
    }, 1800);
  }

  function selectAddress() {
    const address = document.querySelector('.contact__address');
    const range = document.createRange();
    range.selectNodeContents(address);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const text = copyButton.dataset.copy;
      const fallback = () => {
        selectAddress();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        }
        if (ok) showCopied();
        // If copying is blocked, the address stays selected so it can be copied by hand.
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ------------------------------------------------ footer year */

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(now.getFullYear());
  });

  /* ------------------------------------------------ scroll + resize wiring */

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
      updateTimeline();
      ticking = false;
    });
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitName();
      if (activeCopy) activeCopy.removeAttribute('data-visible');
      placePill();
      updateTimeline();
    }, 120);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  fitName();
  onScroll();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fitName();
      if (activeCopy) activeCopy.removeAttribute('data-visible');
      placePill();
    });
  }
})();
