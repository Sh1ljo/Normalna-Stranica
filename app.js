(() => {
  'use strict';

  // ---------------------------------------------------------------- config
  // Local testing only: ?stage=N jumps to a stage, ?reset starts over, ?fast shortens every delay.
  const DEV = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const params = new URLSearchParams(location.search);
  const SPEED = DEV && params.has('fast') ? 0.1 : 1;
  const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // How long the "operator" keeps the visitor waiting. The story says a few minutes; the prototype uses seconds.
  const OPERATOR_WAIT_MS = 9000;

  const STAGE_KEY = 'ns_stage';
  const PDF_URL = 'dokument.pdf';
  const PDF_NAME = 'TK-INT-2025-0417.pdf';
  const LAST_LEVEL = 4; // stages 1-4 are puzzles, 5 is the cutscene, 6 is the final page

  const app = document.getElementById('app');
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * SPEED));

  // --------------------------------------------------------------- storage
  const memory = {};
  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        console.warn('localStorage unavailable, progress will not survive a reload.', err);
        return memory[key] ?? null;
      }
    },
    set(key, value) {
      memory[key] = value;
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn('localStorage unavailable, progress will not survive a reload.', err);
      }
    },
  };

  if (DEV && params.has('reset')) {
    store.set(STAGE_KEY, '1');
  }
  if (DEV && params.has('stage')) store.set(STAGE_KEY, String(Number(params.get('stage'))));

  let stage = Number(store.get(STAGE_KEY)) || 1;
  const setStage = (n) => {
    stage = n;
    store.set(STAGE_KEY, String(n));
  };

  // --------------------------------------------------------------- answers
  // Prototype only: answers live in the client. Before going public, checkAnswer becomes a
  // fetch() to a server function and the content of the next stage is only sent after a correct answer.
  const normalizeMoney = (v) =>
    v.toLowerCase().replace(/eur|€|\s/g, '').replace(/[.,]00$/, '').replace(/[.,]/g, '');

  const CHECKERS = {
    1: (v) => v.trim() === '12345',
    2: (v) => v.trim() === '16180',
    3: (v) => v.trim().toLowerCase() === 'maska',
    4: (v) => normalizeMoney(v) === '25050',
  };

  async function checkAnswer(level, value) {
    return CHECKERS[level](value);
  }

  // ---------------------------------------------------------------- levels
  const TITLE = '<h1>Normalna stranica</h1>';

  // Plain strings stay as they are; one-element arrays are rendered in the highlight colour.
  function highlight(parts) {
    return parts.map((p) => (Array.isArray(p) ? `<span class="m">${p[0]}</span>` : p)).join('');
  }

  const LEVELS = {
    1: {
      body: `<p>Dobrodošli na normalnu stranicu. Hvala što ste posjetili. Želimo Vam ugodan ostatak dana.</p>`,
      label: 'Unesite kod',
      afterField: `<p class="faint">12345</p>`,
    },
    2: {
      body: `
        <p>Uspjeli ste! Pronašli ste kod. Hvala puno što ste posjetili ovu stranicu, i želimo Vam ugodan ostatak dana.</p>
        <p class="invisible">16180</p>`,
      label: 'Unesite kod',
    },
    3: {
      // The highlighted letters, read in order, spell the code: M-A-S-K-A.
      body: `<p>${highlight([
        'Još ste tu? Nis', ['m'], 'o očekiv', ['a'], 'li da ćete dogurati ovako daleko. Ali ', ['s'],
        'vejedno hvala što ste uspjeli. Sad Vas molimo da napustite stranicu. Ugodan ostata', ['k'],
        ' d', ['a'], 'na.',
      ])}</p>`,
      label: 'Unesite kod',
    },
    4: {
      wide: true,
      label: 'Unesite ukupan iznos (u eurima) isplaćen osobama označenima kao inspektori.',
    },
  };

  function renderLevel(level) {
    const cfg = LEVELS[level];
    document.body.className = '';
    document.title = 'Normalna stranica';

    const doc =
      level === 4
        ? `<iframe class="doc-frame" id="doc" src="dokument.html" title="Dokument tvrtke Tvrtka Kompanija d.o.o."></iframe>`
        : '';

    app.innerHTML = `
      <main class="${cfg.wide ? 'wide' : ''}">
        ${TITLE}
        ${cfg.body || ''}
        ${doc}
        <form autocomplete="off" novalidate>
          <label for="code">${cfg.label}</label>
          <div class="row">
            <input id="code" name="code" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">
            <button type="submit">Potvrdi</button>
          </div>
          ${cfg.afterField || ''}
          <p class="msg" role="alert"></p>
        </form>
      </main>`;

    if (level === 4) wireDocument();

    const form = app.querySelector('form');
    const input = form.querySelector('input');
    const msg = form.querySelector('.msg');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      msg.textContent = '';

      let ok;
      try {
        ok = await checkAnswer(level, input.value);
      } catch (err) {
        console.error('Answer check failed', err);
        msg.textContent = 'Došlo je do pogreške. Pokušajte ponovno.';
        return;
      }

      if (!ok) {
        msg.textContent = 'Netočan kod.';
        input.select();
        return;
      }

      setStage(level + 1);
      render();
    });
  }

  function wireDocument() {
    const frame = document.getElementById('doc');
    window.addEventListener('message', (event) => {
      if (event.source !== frame.contentWindow) return;
      if (event.data && event.data.type === 'doc-height') frame.style.height = `${event.data.height + 2}px`;
    });
  }

  // ------------------------------------------------------------- cutscene
  async function typeInto(el, text, delay = 28) {
    if (REDUCED_MOTION) {
      el.textContent += text;
      return;
    }
    for (const ch of text) {
      el.textContent += ch;
      await sleep(delay);
    }
  }

  function addLine(container, text = '', className = '') {
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    container.appendChild(p);
    return p;
  }

  async function bootAnimation() {
    document.body.className = '';
    app.innerHTML = `
      <main class="boot">
        <p id="b1"></p>
        <p id="b2"></p>
        <p id="b3"></p>
        <div class="bar" aria-hidden="true"><i id="fill"></i></div>
      </main>`;
    const [b1, b2, b3] = ['b1', 'b2', 'b3'].map((id) => document.getElementById(id));
    const fill = document.getElementById('fill');

    await typeInto(b1, 'Pristup odobren.');
    await sleep(700);
    await typeInto(b2, 'Dobrodošli u Tvrtka Kompanija d.o.o.');
    await sleep(700);
    b3.textContent = 'Učitavanje sučelja… 0%';

    let pct = 0;
    while (pct < 100) {
      pct = Math.min(100, pct + 1 + Math.floor(Math.random() * 8));
      fill.style.width = `${pct}%`;
      b3.textContent = `Učitavanje sučelja… ${pct}%`;
      await sleep(pct % 37 === 0 || Math.random() < 0.06 ? 450 : 70);
    }
    await sleep(700);
  }

  const OPERATOR_MESSAGES = [
    'Dobar dan. Ovdje operater tvrtke Tvrtka Kompanija d.o.o.',
    'Zabilježili smo neovlašten pristup našem internom sustavu s Vašeg uređaja.',
    'Ovo niste smjeli učiniti.',
    'Tijekom pristupa bili ste izloženi dokumentima koji su strogo povjerljivi. Molimo Vas da ih ne dijelite ni s kim i da nikome ne otkrivate njihov sadržaj.',
    'Sada Vas molimo da ovdje pričekate nekoliko minuta dok naš operater ne provede potrebne radnje.',
  ];

  async function scrambleChat(chat) {
    const lines = [...chat.querySelectorAll('p:not(.note)')];
    const originals = lines.map((p) => p.textContent);
    const glyphs = '01#%&@/\\<>[]{}';
    for (let frame = 0; frame < 14; frame++) {
      const chance = (frame + 1) / 14;
      lines.forEach((p, i) => {
        p.textContent = [...originals[i]]
          .map((ch) => (ch !== ' ' && Math.random() < chance ? glyphs[Math.floor(Math.random() * glyphs.length)] : ch))
          .join('');
      });
      await sleep(70);
    }
  }

  async function flicker() {
    if (REDUCED_MOTION) {
      await sleep(400);
      return;
    }
    document.body.classList.add('shake');
    for (let i = 0; i < 6; i++) {
      document.body.classList.toggle('invert');
      await sleep(90);
    }
    document.body.classList.remove('invert', 'shake');
  }

  let cutsceneRunning = false;

  async function cutscene() {
    if (cutsceneRunning) return;
    cutsceneRunning = true;
    document.title = 'Normalna stranica';

    await bootAnimation();

    // Back on the normal page, with a command prompt opening at the bottom.
    app.innerHTML = `
      <main class="has-term">
        ${TITLE}
        <p>Dobrodošli na normalnu stranicu. Hvala što ste posjetili. Želimo Vam ugodan ostatak dana.</p>
        <div class="chat idle" id="chat" role="log" aria-live="polite"></div>
      </main>
      <div class="term" id="term" role="log" aria-label="Naredbeni redak"></div>`;
    const term = document.getElementById('term');
    const chat = document.getElementById('chat');

    setTimeout(() => term.classList.add('open'), 30); // after first paint so the slide-up transition runs
    await sleep(700);

    const t1 = addLine(term, '> ');
    await typeInto(t1, 'Pristup odbijen. Razlog: Neautorizirani login.');
    await sleep(600);
    const t2 = addLine(term, '> ');
    await typeInto(t2, 'Spajanje s vanjskim operatorom');
    for (let i = 0; i < 4; i++) {
      await sleep(500);
      t2.textContent += '.';
    }
    await sleep(600);
    addLine(term, '> Veza uspostavljena.');
    await sleep(900);

    // The operator writes; the visitor can only read. The log is a scroll area, kept scrolled to the newest line.
    const toBottom = () => { chat.scrollTop = chat.scrollHeight; };
    chat.classList.remove('idle');
    for (const text of OPERATOR_MESSAGES) {
      const typing = addLine(chat, 'Operater piše…', 'typing');
      toBottom();
      await sleep(900 + text.length * 22);
      typing.remove();
      const line = document.createElement('p');
      const who = document.createElement('b');
      who.textContent = 'Operater: ';
      line.append(who, text);
      chat.appendChild(line);
      toBottom();
      await sleep(700);
    }
    addLine(chat, 'Ovaj razgovor je samo za čitanje.', 'note');
    addLine(chat, 'Operater piše…', 'typing');
    toBottom();
    await sleep(OPERATOR_WAIT_MS);

    // Something else takes over the connection.
    addLine(term, '> UPOZORENJE: neovlaštena promjena veze.');
    await sleep(500);
    addLine(term, '> Izvor: nepoznat.');
    await flicker();
    await scrambleChat(chat);
    addLine(term, '> Preusmjeravanje…');
    await flicker();
    await sleep(600);

    setStage(6);
    cutsceneRunning = false;
    finalPage(true);
  }

  // ----------------------------------------------------------- final page
  // Stage 6: intro + name of the owner. Stage 7: the five-image code. Stage 8: end of what is written so far.
  const HACKER_INTRO = [
    'Veza je preusmjerena. Ne zatvarajte ovu stranicu.',
    'Nisam iz te tvrtke. Ne brinite, niste u opasnosti.',
    'Ne vjerujte svemu što vidite. Ni ovoj stranici, ni toj tvrtki, ni većini onoga što Vam se pokazuje.',
    'I nije samo ova tvrtka. Cijela zemlja je takva. Cijeli svijet je takav.',
    'Sve ću Vam objasniti poslije. Sada mi trebate pomoći s nečim.',
    'Dokument koji ste vidjeli mora ostati kod Vas. Preuzmite ga u konzoli ispod.',
  ];
  const HACKER_SITE = [
    'Tvrtka ima vlastitu internetsku stranicu: tvrtkakompanija.com. Otvorite je u konzoli ispod.',
    'Negdje na njoj piše tko je vlasnik. Trebam njegovo ime i prezime. Upišite ga u konzolu.',
  ];
  const HACKER_CODE = [
    'To je to. Hvala Vam.',
    'Naravno, potrebna mi je i šifra. Zašto bi sve trebalo biti tako lako.',
    'Ta tvrtka voli da ljudi gledaju samo ono što je na površini. Pogledajte pažljivije, i ne stanite na vrhu.',
    'Nije sve na jednom mjestu. Ali ni tvrtka nije baš nasumična: sve ima svoj red.',
    'Kad nešto nađete, znat ćete. Upišite šifru u konzolu.',
  ];
  const HACKER_END = [
    'To je ta šifra. Sve je sjelo na svoje mjesto.',
    'Hvala Vam. Ostalo ću objasniti kad dođe vrijeme.',
  ];

  // Prototype: local copy of the company site. Becomes https://tvrtkakompanija.com when it is deployed.
  const SITE_URL = 'tvrtkakompanija/index.html';
  const SITE_LABEL = 'tvrtkakompanija.com';

  const plain = (v) =>
    v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim().split(/\s+/).sort().join(' ');
  const OWNER = plain('Zvonimir Magonić'); // words are sorted, so "Magonić Zvonimir" works too
  const FINAL_CODE = '16180';

  const FINAL_CHECKERS = {
    6: (v) => plain(v) === OWNER,
    7: (v) => v.replace(/\s|-/g, '') === FINAL_CODE,
  };

  // One line in the console with a text field. Resolves when the answer is right; wrong answers stay in the log.
  function askInConsole(term, level, label, wrong) {
    return new Promise((resolve) => {
      const ask = () => {
        const line = addLine(term, `> ${label} `);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'term-input';
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        input.setAttribute('aria-label', label);
        line.appendChild(input);
        term.scrollTop = term.scrollHeight;
        input.focus({ preventScroll: true });

        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          const value = input.value;
          input.replaceWith(document.createTextNode(value));
          if (FINAL_CHECKERS[level](value)) {
            resolve(value);
          } else {
            addLine(term, `> ${wrong}`);
            ask();
          }
        });
      };
      ask();
    });
  }

  async function finalPage(animate) {
    document.body.className = 'dark';
    document.title = '…';
    app.innerHTML = `
      <main id="out" class="has-term"></main>
      <div class="term" id="term" role="log" aria-label="Naredbeni redak"></div>`;
    const out = document.getElementById('out');
    const term = document.getElementById('term');
    const scrollDown = () => window.scrollTo(0, document.body.scrollHeight);

    let last = null;
    const say = async (lines, live) => {
      for (const text of lines) {
        if (last) last.classList.remove('cursor');
        last = addLine(out, '', 'cursor');
        if (live) {
          await typeInto(last, text, 24);
          scrollDown();
          await sleep(900);
        } else {
          last.textContent = text;
        }
      }
      if (last) last.classList.remove('cursor');
    };

    // The download and the site link are only offered in the console, after the hacker asks for them.
    const addFile = () => {
      const line = addLine(term, '> Datoteka spremna: ');
      const link = document.createElement('a');
      link.href = PDF_URL;
      link.download = PDF_NAME;
      link.textContent = PDF_NAME;
      line.appendChild(link);
    };
    const addSite = () => {
      const line = addLine(term, '> Otvori: ');
      const link = document.createElement('a');
      link.href = SITE_URL;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = SITE_LABEL;
      line.appendChild(link);
    };
    const openTerm = async (live) => {
      term.classList.add('open');
      if (live) await sleep(700);
    };

    // On reload, what the visitor already got through is replayed instantly; only new text is typed out.
    await say(HACKER_INTRO, animate);
    await openTerm(animate);
    addFile();
    await say(HACKER_SITE, animate);
    addSite();

    if (stage === 6) {
      await askInConsole(term, 6, 'Ime i prezime vlasnika:', 'Netočno. Pogledajte bolje.');
      setStage(7);
      await sleep(600);
      await say(HACKER_CODE, true);
    } else {
      await say(HACKER_CODE, false);
    }

    if (stage === 7) {
      await askInConsole(term, 7, 'Šifra:', 'Netočno. Provjerite sve slike, redom.');
      setStage(8);
      await sleep(600);
      await say(HACKER_END, true);
    } else {
      await say(HACKER_END, false);
    }
    addLine(out, '[ nastavak slijedi ]', 'dim cursor');
    scrollDown();
  }

  // ----------------------------------------------------------- test reset
  // Testing helper: set to false before the game goes public.
  const SHOW_RESET_BUTTON = true;

  function addResetButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'reset';
    button.textContent = 'Resetiraj';
    button.addEventListener('click', () => {
      setStage(1);
      location.href = location.pathname; // also drops any ?stage= from the URL
    });
    document.body.appendChild(button);
  }

  // ------------------------------------------------------------------ main
  function render() {
    if (stage >= 1 && stage <= LAST_LEVEL) renderLevel(stage);
    else if (stage === LAST_LEVEL + 1) cutscene();
    else finalPage(false);
    window.scrollTo(0, 0);
  }

  if (SHOW_RESET_BUTTON) addResetButton();
  render();
})();
