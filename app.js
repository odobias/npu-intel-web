(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const deck = document.querySelector('#deck');
  const stage = document.querySelector('#presentation-stage');
  const label = document.querySelector('#slide-label');
  const progressTitle = document.querySelector('#progress-title');
  const progressBar = document.querySelector('#progress-bar');
  const notesPanel = document.querySelector('#notes-panel');
  const notesCopy = document.querySelector('#notes-copy');
  const chrome = document.querySelector('.chrome');
  let current = 0;
  let transitionToken = 0;

  const fitStage = () => {
    const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    stage.style.setProperty('--stage-scale', String(Math.max(0.01, scale)));
  };
  window.addEventListener('resize', fitStage);
  document.addEventListener('fullscreenchange', fitStage);
  fitStage();

  const timingValues = (text) => [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((match) => Number(match[0].replaceAll(',', '')));

  const decorateTimingCell = (cell, kind, color, values, max) => {
    cell.classList.add('metric-cell', ...kind.split(/\s+/));
    cell.style.setProperty('--bar-color', color);
    if (values.length && max > 0) {
      cell.style.setProperty('--bar', `${Math.max(4, Math.min(100, (values[0] / max) * 100))}%`);
      if (values[1] !== undefined) cell.style.setProperty('--bar-secondary', `${Math.max(4, Math.min(100, (values[1] / max) * 100))}%`);
    }
    const original = cell.innerHTML;
    cell.innerHTML = `<span class="cell-bar" aria-hidden="true"></span><span class="cell-text">${original}</span>`;
  };

  const enhanceTimingTables = () => {
    document.querySelectorAll('.timing-table').forEach((table) => {
      const rows = [...table.querySelectorAll('tbody tr')];
      const meanMax = Math.max(0, ...rows.flatMap((row) => [...row.cells].slice(1, 4).flatMap((cell) => timingValues(cell.textContent))));
      const startupMax = Math.max(0, ...rows.flatMap((row) => [...row.cells].slice(4, 6).flatMap((cell) => timingValues(cell.textContent))));
      const tailMax = Math.max(0, ...rows.flatMap((row) => timingValues(row.cells[6]?.textContent || '')));

      rows.forEach((row) => {
        const cells = [...row.cells];
        const meanCells = cells.slice(1, 4);
        const meanValues = meanCells.map((cell) => timingValues(cell.textContent));
        meanCells.forEach((cell, index) => decorateTimingCell(cell, `mean-cell mean-${index}`, ['#5865f2', '#7443ee', '#0e8f68'][index], meanValues[index], meanMax));

        const startupCells = cells.slice(4, 6);
        const startupValues = startupCells.map((cell) => timingValues(cell.textContent));
        startupCells.forEach((cell, index) => decorateTimingCell(cell, `startup-cell startup-${index}`, '#c2730d', startupValues[index], startupMax));

        const tailCell = cells[6];
        if (tailCell) {
          const tailValues = timingValues(tailCell.textContent);
          decorateTimingCell(tailCell, 'tail-cell', '#0e8f68', tailValues, tailMax);
        }

        const labelCell = cells[0];
        const cpu = meanValues[0]?.[0];
        const npu = meanValues[2]?.[0];
        if (labelCell && cpu && npu) {
          const speedup = document.createElement('span');
          speedup.className = 'timing-speedup';
          speedup.textContent = `${(cpu / npu).toFixed(1)}× NPU vs CPU`;
          labelCell.appendChild(speedup);
        }
      });
    });
  };

  slides.forEach((slide) => {
    const foot = document.createElement('div');
    foot.className = 'slide-foot';
    foot.innerHTML = `<span class="foot-brand">Gen <em>/</em> Intel NPU</span><span class="foot-page">${slide.dataset.num}</span>`;
    slide.appendChild(foot);
  });
  enhanceTimingTables();

  const readHash = () => {
    const match = window.location.hash.match(/slide-(\d+)/i);
    if (!match) return 0;
    const parsed = Number(match[1]) - 1;
    return Number.isFinite(parsed) ? Math.max(0, Math.min(slides.length - 1, parsed)) : 0;
  };

  const setHash = (index) => {
    const nextHash = `#slide-${index + 1}`;
    if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
  };

  const updateNotes = () => {
    notesCopy.textContent = slides[current].dataset.notes || 'No speaker notes for this slide.';
  };

  const show = (index, updateUrl = true, immediate = false) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    const previous = current;
    const oldSlide = slides[previous];
    const newSlide = slides[target];
    const moving = target !== previous;
    const direction = target > previous ? 'forward' : 'backward';
    const token = ++transitionToken;

    if (moving && !immediate) {
      slides.forEach((slide) => {
        slide.classList.remove('entering', 'leaving', 'forward', 'backward');
        if (slide !== oldSlide && slide !== newSlide) slide.classList.remove('active');
      });
      oldSlide.classList.add('leaving', direction);
      newSlide.classList.add('active', 'entering', direction);
      window.setTimeout(() => {
        if (token !== transitionToken) return;
        oldSlide.classList.remove('active', 'leaving', 'forward', 'backward');
        newSlide.classList.remove('entering', 'forward', 'backward');
      }, 540);
    } else {
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'entering', 'leaving', 'forward', 'backward');
        slide.classList.toggle('active', i === target);
      });
    }
    current = target;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
    const slide = slides[current];
    const dark = slide.classList.contains('slide-dark');
    chrome.classList.toggle('dark-chrome', dark);
    document.body.classList.toggle('dark-ui', dark);
    label.textContent = `${slide.dataset.num} / ${String(slides.length).padStart(2, '0')}`;
    progressTitle.textContent = slide.dataset.title;
    progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    updateNotes();
    if (updateUrl) setHash(current);
    document.title = `${slide.dataset.title} · Intel NPU`;
    document.querySelector('#prev-button').disabled = current === 0;
    document.querySelector('#next-button').disabled = current === slides.length - 1;
  };

  const next = () => show(current + 1);
  const previous = () => show(current - 1);

  document.querySelector('#next-button').addEventListener('click', next);
  document.querySelector('#prev-button').addEventListener('click', previous);

  const toggleNotes = () => {
    const isOpen = notesPanel.classList.toggle('open');
    notesPanel.setAttribute('aria-hidden', String(!isOpen));
  };
  document.querySelector('#notes-button').addEventListener('click', toggleNotes);
  document.querySelector('#close-notes').addEventListener('click', toggleNotes);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.warn('Fullscreen is unavailable in this browser context.', error);
    }
  };
  document.querySelector('#fullscreen-button').addEventListener('click', toggleFullscreen);

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); next(); }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); previous(); }
    if (event.key === 'Home') { event.preventDefault(); show(0); }
    if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key === 'Escape' && notesPanel.classList.contains('open')) toggleNotes();
  });

  deck.addEventListener('click', (event) => {
    if (event.target.closest('button, a, .notes-panel, .chrome')) return;
    const bounds = deck.getBoundingClientRect();
    if (event.clientX < bounds.left + bounds.width / 2) previous();
    else next();
  });

  window.addEventListener('hashchange', () => show(readHash(), false));
  show(readHash(), false, true);
})();
