/* C0DΞX HUB Mobile — ModJS
   Danilo | Desenvolvedor | Delphi
   Licença MIT
*/
(() => {
  'use strict';

  const APP_VERSION = '3.1.0';
  const PFX = 'codex_hub_';
  const DEFAULT_STATE = Object.freeze({
    settings: {
      displayName: 'Danilo | Desenvolvedor | Delphi',
      pin: '1234',
      theme: 'dark',
      avatar: '⚡',
      apiKey: '',
      webhook: ''
    },
    breaks: [],
    activeBreak: null,
    vault: [],
    tasks: [],
    wikiSavedSearches: [],
    layout: {
      blocks: ['pausa', 'wiki', 'vault', 'agenda', 'settings']
    }
  });

  const WIKI_DATA = [
    {
      id: 'try-finally',
      cat: 'Memória',
      icon: '🛡️',
      title: 'Try..Finally e liberação de memória',
      summary: 'Use try..finally quando você cria objetos manualmente. O finally garante liberação mesmo com exceção.',
      tags: ['#Delphi', '#Memoria', '#TryFinally'],
      body: [
        'Em Object Pascal, todo objeto criado com Create precisa ter um dono claro. Quando o dono não é um componente com Owner, a responsabilidade de liberar é sua.',
        'A falha conceitual comum é criar TStringList, TDataSet temporário, TBitmap ou objeto auxiliar e só chamar Free no final do fluxo normal. Se ocorrer exceção antes, haverá vazamento.',
        'Padrão recomendado:',
      ],
      code: `var
  LLista: TStringList;
begin
  LLista := TStringList.Create;
  try
    LLista.Add('Delphi');
    // use o objeto aqui
  finally
    LLista.Free;
  end;
end;`
    },
    {
      id: 'interface-implementation',
      cat: 'Arquitetura',
      icon: '🏗️',
      title: 'Separação entre Interface e Implementation',
      summary: 'A interface expõe contrato. A implementation guarda detalhes internos, funções auxiliares e dependências privadas.',
      tags: ['#Arquitetura', '#Units', '#CleanCode'],
      body: [
        'Em Delphi, a seção interface deve ser pequena e estável. Ela representa o contrato da unit para o restante do sistema.',
        'A seção implementation deve concentrar os detalhes que não precisam ser conhecidos por outras units. Isso reduz acoplamento, recompilação e dependência circular.',
        'Regra prática: se outro formulário, DataModule ou serviço não precisa chamar diretamente, deixe privado ou dentro da implementation.'
      ],
      code: `unit uServicoPausa;

interface

type
  TPausaInfo = record
    Saida: TDateTime;
    Retorno: TDateTime;
  end;

function CalcularRetorno(const ASaida: TDateTime; AMinutos: Integer): TPausaInfo;

implementation

function CalcularRetorno(const ASaida: TDateTime; AMinutos: Integer): TPausaInfo;
begin
  Result.Saida := ASaida;
  Result.Retorno := ASaida + (AMinutos / 1440);
end;

end.`
    },
    {
      id: 'strtofloatdef',
      cat: 'Validação',
      icon: '🧮',
      title: 'Conversão segura com StrToFloatDef',
      summary: 'Evite exceções desnecessárias em campos numéricos usando validação e conversão defensiva.',
      tags: ['#Validacao', '#Conversao', '#Delphi'],
      body: [
        'Quando o valor vem de tela, banco, arquivo ou API, trate como dado não confiável.',
        'StrToFloatDef evita exceção quando o conteúdo não representa número válido. Para regra fiscal, valide também separador decimal, faixa permitida e precisão.',
        'Impacto direto: menos travamento de interface e menor risco de quebrar fluxo de gravação ou emissão.'
      ],
      code: `var
  LValor: Double;
begin
  LValor := StrToFloatDef(edtValor.Text, 0);
  if LValor <= 0 then
    raise Exception.Create('Informe um valor válido.');
end;`
    },
    {
      id: 'datamodule',
      cat: 'Arquitetura',
      icon: '🧩',
      title: 'DataModule como fronteira de dados',
      summary: 'Tela não deve concentrar regra de negócio e SQL. Use DataModule ou service para separar responsabilidade.',
      tags: ['#DataModule', '#SQL', '#Responsabilidade'],
      body: [
        'Uma tela deve coordenar interação visual. Ela não deve virar depósito de SQL, regra fiscal, regra de certificado e regra de workflow.',
        'DataModules são úteis para conexões, queries e transações. Para regras mais complexas, prefira classes de serviço chamadas pela tela.',
        'Essa separação melhora teste, manutenção e evita que eventos de botão fiquem enormes.'
      ],
      code: `type
  TdmSeloParana = class(TDataModule)
  public
    function ConsultarStatusServico: string;
  end;

type
  TServicoExportacaoSelo = class
  public
    procedure ExportarLote(const ALoteId: Integer);
  end;`
    },
    {
      id: 'lazarus-delphi',
      cat: 'Compatibilidade',
      icon: '⚖️',
      title: 'Delphi CE 12 x Lazarus',
      summary: 'Nem todo componente, unit ou recurso visual existe nos dois ambientes. Planeje abstrações.',
      tags: ['#DelphiCE12', '#Lazarus', '#Compatibilidade'],
      body: [
        'Delphi CE 12 e Lazarus compartilham a linguagem Object Pascal em vários pontos, mas divergem em bibliotecas, componentes visuais, RTTI, generics e detalhes de framework.',
        'No Delphi CE 12, não assuma disponibilidade de TSvg nativo como solução universal. Para ícones vetoriais, avalie alternativas como recursos externos, SVG via biblioteca específica ou rasterização controlada.',
        'Quando o projeto precisa rodar nos dois, concentre dependências específicas atrás de adapters.'
      ],
      code: `type
  IIconRenderer = interface
    ['{2C8377BA-4E61-4B0A-A7CB-8040C1F19A01}']
    procedure RenderToCanvas;
  end;`
    }
  ];

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PFX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(PFX + key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(PFX + key);
    },
    dump() {
      const data = {};
      Object.keys(DEFAULT_STATE).forEach((key) => data[key] = State[key]);
      return {
        app: 'C0DEX_HUB_MOBILE',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        data
      };
    }
  };

  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const State = clone(DEFAULT_STATE);

  function loadState() {
    Object.keys(DEFAULT_STATE).forEach((key) => {
      State[key] = Store.get(key, clone(DEFAULT_STATE[key]));
    });
  }

  function persist(key) {
    if (key) {
      Store.set(key, State[key]);
      return;
    }
    Object.keys(DEFAULT_STATE).forEach((k) => Store.set(k, State[k]));
  }

  const Safe = {
    text(value) {
      return String(value ?? '');
    },
    tags(value) {
      return String(value ?? '')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.startsWith('#') ? t : '#' + t)
        .slice(0, 8);
    },
    uid(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  };

  function formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function minutesBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 60000);
  }

  function todayAt(timeValue) {
    if (!/^\d{2}:\d{2}$/.test(timeValue || '')) return null;
    const [hh, mm] = timeValue.split(':').map(Number);
    if (hh > 23 || mm > 59) return null;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  function toast(message, ms = 2200) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('open');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('open'), ms);
  }

  function applyTheme() {
    document.body.classList.remove('theme-light', 'theme-sepia', 'theme-aurora');
    const theme = State.settings.theme || 'dark';
    if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
    $('statTheme').textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#F3F4F8' : '#000000');
  }

  function renderAvatar() {
    const avatar = State.settings.avatar || '⚡';
    const nodes = [$('lockAvatar')].filter(Boolean);
    nodes.forEach((node) => {
      node.textContent = '';
      if (avatar.startsWith('data:image/')) {
        const img = document.createElement('img');
        img.alt = 'Avatar';
        img.src = avatar;
        node.appendChild(img);
      } else {
        node.textContent = avatar;
      }
    });
  }

  function updateClock() {
    const now = new Date();
    $('statusTime').textContent = formatTime(now);
    $('lockTime').textContent = formatTime(now);
    $('lockDate').textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  let currentView = 'home';
  const viewStack = ['home'];

  function showView(name, push = true) {
    const view = $(`view-${name}`);
    if (!view) return;

    currentView = name;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
    $('viewEyebrow').textContent = view.dataset.title || 'Offline-first';
    $('scrollArea').scrollTop = 0;

    if (push && viewStack[viewStack.length - 1] !== name) viewStack.push(name);
    if (name === 'wiki') renderWiki();
    if (name === 'vault') renderVault();
    if (name === 'agenda') renderTasks();
    if (name === 'settings') fillSettings();
    renderHomeStats();
  }

  function goBack() {
    if (currentView === 'wiki' && !$('wikiArticle').hidden) {
      closeArticle();
      return;
    }
    if (viewStack.length > 1) {
      viewStack.pop();
      showView(viewStack[viewStack.length - 1], false);
    } else {
      showView('home', false);
    }
  }

  const Lock = {
    input: '',
    init() {
      const pad = $('pinPad');
      const dots = $('pinDots');
      pad.textContent = '';
      dots.textContent = '';

      for (let i = 0; i < 4; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'pin-dot';
        dots.appendChild(dot);
      }

      const keys = [
        ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
        ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
        ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
        ['', 'empty'], ['0', ''], ['⌫', 'del']
      ];

      keys.forEach(([num, sub]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pin-key ${sub === 'empty' ? 'empty' : ''} ${sub === 'del' ? 'del' : ''}`;
        if (sub === 'empty') {
          btn.tabIndex = -1;
        } else if (sub === 'del') {
          btn.textContent = num;
          btn.addEventListener('click', () => Lock.backspace());
        } else {
          btn.innerHTML = `<span>${num}</span>${sub ? `<span class="sub">${sub}</span>` : ''}`;
          btn.addEventListener('click', () => Lock.push(num));
        }
        pad.appendChild(btn);
      });
    },
    push(n) {
      if (this.input.length >= 8) return;
      this.input += n;
      this.render();
      const pin = String(State.settings.pin || '1234');
      if (this.input.length >= Math.min(4, pin.length)) this.tryUnlock();
    },
    backspace() {
      this.input = this.input.slice(0, -1);
      this.render();
    },
    render() {
      $$('#pinDots .pin-dot').forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < Math.min(this.input.length, 4));
      });
    },
    tryUnlock() {
      const pin = String(State.settings.pin || '1234');
      if (this.input === pin) {
        this.input = '';
        this.render();
        $('lockError').textContent = '';
        $('lockScreen').classList.add('hidden');
        return;
      }
      if (this.input.length >= pin.length) {
        $('lockError').textContent = 'PIN inválido';
        navigator.vibrate?.(60);
        this.input = '';
        this.render();
      }
    },
    lock() {
      this.input = '';
      this.render();
      $('lockScreen').classList.remove('hidden');
    }
  };

  function startBreak(start, durationMin) {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      toast('Hora de saída inválida.');
      return;
    }
    const duration = Number.parseInt(durationMin, 10);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
      toast('Duração inválida.');
      return;
    }

    const end = new Date(start.getTime() + duration * 60000);
    State.activeBreak = {
      id: Safe.uid('break'),
      start: start.toISOString(),
      end: end.toISOString(),
      duration
    };
    persist('activeBreak');
    renderBreak();
    toast('Pausa gravada.');
  }

  function finishBreak() {
    if (!State.activeBreak) {
      toast('Nenhuma pausa ativa.');
      return;
    }

    const item = {
      ...State.activeBreak,
      finishedAt: new Date().toISOString()
    };

    State.breaks.unshift(item);
    State.breaks = State.breaks.slice(0, 50);
    State.activeBreak = null;
    persist('breaks');
    persist('activeBreak');
    renderBreak();
    renderHomeStats();
    toast('Pausa finalizada e salva no histórico.');
  }

  function renderBreak() {
    const active = State.activeBreak;
    const progress = $('pausaProgress');

    if (!active) {
      $('pausaReturn').textContent = '--:--';
      $('pausaStatus').textContent = 'Nenhuma pausa ativa.';
      progress.style.width = '0%';
    } else {
      const now = new Date();
      const start = new Date(active.start);
      const end = new Date(active.end);
      const totalMs = Math.max(1, end.getTime() - start.getTime());
      const elapsedMs = now.getTime() - start.getTime();
      const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      const remaining = minutesBetween(now, end);

      $('pausaReturn').textContent = formatTime(end);
      $('pausaStatus').textContent = remaining >= 0
        ? `Restam aproximadamente ${remaining} min.`
        : `Retorno passou há ${Math.abs(remaining)} min.`;
      progress.style.width = `${pct}%`;

      if (remaining <= 0 && !active.notified) {
        State.activeBreak.notified = true;
        persist('activeBreak');
        notify('Pausa finalizada', 'Seu horário de retorno foi atingido.');
      }
    }

    renderBreakHistory();
  }

  function renderBreakHistory() {
    const list = $('breakHistoryList');
    list.textContent = '';

    if (!State.breaks.length) {
      list.appendChild(emptyState('⏱️', 'Nenhuma pausa no histórico.'));
      return;
    }

    State.breaks.slice(0, 12).forEach((item) => {
      const start = new Date(item.start);
      const end = new Date(item.end);
      const row = document.createElement('div');
      row.className = 'list-item';

      const icon = document.createElement('div');
      icon.className = 'list-icon';
      icon.textContent = '☕';

      const body = document.createElement('div');
      body.className = 'list-body';

      const title = document.createElement('div');
      title.className = 'list-title';
      title.textContent = `${formatTime(start)} → ${formatTime(end)} · ${item.duration} min`;

      const sub = document.createElement('div');
      sub.className = 'list-sub';
      sub.textContent = `Finalizada em ${formatDateTime(item.finishedAt)}`;

      body.append(title, sub);
      row.append(icon, body);
      list.appendChild(row);
    });
  }

  let wikiCategory = 'Todos';
  let currentArticleId = null;

  function categories() {
    return ['Todos', ...Array.from(new Set(WIKI_DATA.map(a => a.cat)))];
  }

  function renderWiki() {
    renderWikiCategories();
    renderWikiResults();
  }

  function renderWikiCategories() {
    const wrap = $('wikiCategories');
    wrap.textContent = '';

    categories().forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `chip ${cat === wikiCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        wikiCategory = cat;
        closeArticle();
        renderWiki();
      });
      wrap.appendChild(btn);
    });
  }

  function wikiFiltered() {
    const q = $('wikiSearchInput')?.value?.trim().toLowerCase() || '';
    return WIKI_DATA.filter((art) => {
      const inCat = wikiCategory === 'Todos' || art.cat === wikiCategory;
      const text = [art.title, art.summary, art.tags.join(' '), art.body.join(' '), art.code].join(' ').toLowerCase();
      return inCat && (!q || text.includes(q));
    });
  }

  function renderWikiResults() {
    const container = $('wikiResults');
    container.textContent = '';
    $('wikiArticle').hidden = true;
    currentArticleId = null;

    const items = wikiFiltered();
    if (!items.length) {
      container.appendChild(emptyState('🔎', 'Nenhum estudo encontrado no cache local.'));
      return;
    }

    const list = document.createElement('div');
    list.className = 'list';

    items.forEach((art) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'list-item';

      const icon = document.createElement('div');
      icon.className = 'list-icon';
      icon.textContent = art.icon;

      const body = document.createElement('div');
      body.className = 'list-body';

      const title = document.createElement('div');
      title.className = 'list-title';
      title.textContent = art.title;

      const sub = document.createElement('div');
      sub.className = 'list-sub';
      sub.textContent = art.summary;

      const tags = document.createElement('div');
      tags.className = 'tag-row';
      art.tags.forEach((tag) => {
        const t = document.createElement('span');
        t.className = 'tag';
        t.textContent = tag;
        tags.appendChild(t);
      });

      body.append(title, sub, tags);
      row.append(icon, body);
      row.addEventListener('click', () => openArticle(art.id));
      list.appendChild(row);
    });

    container.appendChild(list);
  }

  function openArticle(id) {
    const art = WIKI_DATA.find(a => a.id === id);
    if (!art) return;

    currentArticleId = id;
    $('wikiResults').textContent = '';

    const article = $('wikiArticle');
    article.textContent = '';
    article.hidden = false;

    const h2 = document.createElement('h2');
    h2.textContent = `${art.icon} ${art.title}`;

    const badge = document.createElement('span');
    badge.className = 'article-badge';
    badge.textContent = 'Wiki Delphi · PT-BR · Cache local';

    article.append(h2, badge);

    art.body.forEach((p) => {
      const el = document.createElement('p');
      el.textContent = p;
      article.appendChild(el);
    });

    const pre = document.createElement('pre');
    pre.setAttribute('translate', 'no');
    const code = document.createElement('code');
    code.setAttribute('translate', 'no');
    code.textContent = art.code;
    pre.appendChild(code);
    article.appendChild(pre);

    const actions = document.createElement('div');
    actions.className = 'action-row';

    const save = document.createElement('button');
    save.className = 'btn teal';
    save.type = 'button';
    save.textContent = 'Salvar no Vault';
    save.addEventListener('click', () => saveArticleToVault(art));

    const share = document.createElement('button');
    share.className = 'btn orange';
    share.type = 'button';
    share.textContent = 'Compartilhar';
    share.addEventListener('click', () => shareText(`${art.title}\n\n${art.summary}\n\n${art.code}`));

    actions.append(save, share);
    article.appendChild(actions);
  }

  function closeArticle() {
    currentArticleId = null;
    $('wikiArticle').hidden = true;
    renderWikiResults();
  }

  function saveArticleToVault(art) {
    const content = `${art.body.join('\n\n')}\n\n${art.code}`;
    addVaultItem(art.title, content, art.tags);
    toast('Artigo salvo no Vault.');
  }

  function saveCurrentWikiSearch() {
    const q = $('wikiSearchInput').value.trim();
    if (!q) {
      toast('Informe uma busca antes de salvar.');
      return;
    }

    const results = wikiFiltered().map(a => a.title);
    const title = `Busca Wiki: ${q}`;
    const body = results.length
      ? `Consulta: ${q}\n\nResultados em PT-BR:\n- ${results.join('\n- ')}`
      : `Consulta: ${q}\n\nNenhum resultado local encontrado.`;
    addVaultItem(title, body, ['#WikiDelphi', '#Estudo']);
    State.wikiSavedSearches.unshift({ id: Safe.uid('search'), q, at: new Date().toISOString(), results });
    State.wikiSavedSearches = State.wikiSavedSearches.slice(0, 30);
    persist('wikiSavedSearches');
    toast('Busca salva para estudo posterior.');
  }

  function addVaultItem(title, body, tags) {
    const safeTitle = Safe.text(title).trim();
    const safeBody = Safe.text(body).trim();

    if (!safeTitle || !safeBody) {
      toast('Informe título e conteúdo.');
      return false;
    }

    State.vault.unshift({
      id: Safe.uid('vault'),
      title: safeTitle.slice(0, 120),
      body: safeBody.slice(0, 6000),
      tags: Array.isArray(tags) ? tags.slice(0, 8) : Safe.tags(tags),
      createdAt: new Date().toISOString()
    });

    State.vault = State.vault.slice(0, 200);
    persist('vault');
    renderVault();
    renderHomeStats();
    return true;
  }

  function renderVault() {
    const list = $('vaultList');
    list.textContent = '';

    if (!State.vault.length) {
      list.appendChild(emptyState('🧠', 'Nenhuma nota salva no Vault.'));
      return;
    }

    State.vault.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'list-item';

      const icon = document.createElement('div');
      icon.className = 'list-icon';
      icon.textContent = '📝';

      const body = document.createElement('div');
      body.className = 'list-body';

      const title = document.createElement('div');
      title.className = 'list-title';
      title.textContent = item.title;

      const sub = document.createElement('div');
      sub.className = 'list-sub';
      sub.textContent = formatDateTime(item.createdAt);

      const code = document.createElement('div');
      code.className = 'list-code';
      code.textContent = item.body;

      const tags = document.createElement('div');
      tags.className = 'tag-row';
      (item.tags || []).forEach((tag) => {
        const t = document.createElement('span');
        t.className = 'tag';
        t.textContent = tag;
        tags.appendChild(t);
      });

      const actions = document.createElement('div');
      actions.className = 'action-row';
      actions.style.marginTop = '8px';

      const share = document.createElement('button');
      share.type = 'button';
      share.className = 'btn orange';
      share.textContent = 'Enviar';
      share.addEventListener('click', () => shareText(`${item.title}\n\n${item.body}`));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn pink';
      del.textContent = 'Excluir';
      del.addEventListener('click', () => {
        State.vault = State.vault.filter(v => v.id !== item.id);
        persist('vault');
        renderVault();
        renderHomeStats();
      });

      actions.append(share, del);
      body.append(title, sub, code, tags, actions);
      row.append(icon, body);
      list.appendChild(row);
    });
  }

  function addTask() {
    const title = $('taskTitle').value.trim();
    const date = $('taskDate').value;
    const time = $('taskTime').value;

    if (!title) {
      toast('Informe a tarefa.');
      return;
    }

    let dueAt = '';
    if (date && time) {
      const parsed = new Date(`${date}T${time}:00`);
      if (Number.isNaN(parsed.getTime())) {
        toast('Data/hora inválida.');
        return;
      }
      dueAt = parsed.toISOString();
    }

    State.tasks.unshift({
      id: Safe.uid('task'),
      title: title.slice(0, 160),
      dueAt,
      done: false,
      notified: false,
      createdAt: new Date().toISOString()
    });

    persist('tasks');
    $('taskTitle').value = '';
    renderTasks();
    renderHomeStats();
    toast('Tarefa adicionada.');
  }

  function renderTasks() {
    const list = $('taskList');
    list.textContent = '';

    if (!State.tasks.length) {
      list.appendChild(emptyState('✅', 'Nenhuma tarefa cadastrada.'));
      return;
    }

    State.tasks.forEach((task) => {
      const row = document.createElement('div');
      row.className = 'list-item';

      const icon = document.createElement('button');
      icon.type = 'button';
      icon.className = 'list-icon';
      icon.textContent = task.done ? '☑️' : '⬜';
      icon.addEventListener('click', () => {
        task.done = !task.done;
        persist('tasks');
        renderTasks();
        renderHomeStats();
      });

      const body = document.createElement('div');
      body.className = 'list-body';

      const title = document.createElement('div');
      title.className = 'list-title';
      title.textContent = task.done ? `Concluída: ${task.title}` : task.title;

      const sub = document.createElement('div');
      sub.className = 'list-sub';
      sub.textContent = task.dueAt ? `Prazo: ${formatDateTime(task.dueAt)}` : 'Sem prazo definido';

      const actions = document.createElement('div');
      actions.className = 'action-row';
      actions.style.marginTop = '8px';

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn pink';
      del.textContent = 'Excluir';
      del.addEventListener('click', () => {
        State.tasks = State.tasks.filter(t => t.id !== task.id);
        persist('tasks');
        renderTasks();
        renderHomeStats();
      });

      actions.appendChild(del);
      body.append(title, sub, actions);
      row.append(icon, body);
      list.appendChild(row);
    });
  }

  function checkTaskAlerts() {
    const now = Date.now();
    let changed = false;

    State.tasks.forEach((task) => {
      if (task.done || task.notified || !task.dueAt) return;
      const due = new Date(task.dueAt).getTime();
      if (!Number.isNaN(due) && now >= due) {
        task.notified = true;
        changed = true;
        notify('Tarefa pendente', task.title);
      }
    });

    if (changed) {
      persist('tasks');
      renderTasks();
      renderHomeStats();
    }
  }

  function notify(title, body) {
    toast(`${title}: ${body}`, 3500);
    navigator.vibrate?.([80, 40, 80]);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (_) {
        // iOS/Safari pode bloquear em contexto local.
      }
    }
  }

  function askNotifications() {
    if (!('Notification' in window)) {
      toast('Notificações Web não suportadas neste contexto.');
      return;
    }

    Notification.requestPermission()
      .then((permission) => toast(permission === 'granted' ? 'Notificações ativadas.' : 'Notificações não autorizadas.'))
      .catch(() => toast('Não foi possível ativar notificações.'));
  }

  function fillSettings() {
    $('cfgDisplayName').value = State.settings.displayName || '';
    $('cfgTheme').value = State.settings.theme || 'dark';
    $('cfgPin').value = State.settings.pin || '1234';
    $('cfgApiKey').value = State.settings.apiKey || '';
    $('cfgWebhook').value = State.settings.webhook || '';
  }

  function saveSettings() {
    const name = $('cfgDisplayName').value.trim() || DEFAULT_STATE.settings.displayName;
    const theme = $('cfgTheme').value;
    const pin = $('cfgPin').value.trim();

    if (!/^\d{4,8}$/.test(pin)) {
      toast('PIN deve conter de 4 a 8 números.');
      return;
    }

    State.settings.displayName = name.slice(0, 80);
    State.settings.theme = ['dark', 'light', 'sepia', 'aurora'].includes(theme) ? theme : 'dark';
    State.settings.pin = pin;

    persist('settings');
    applyTheme();
    renderIdentity();
    renderHomeStats();
    toast('Configurações salvas.');
  }

  function saveIntegrations() {
    State.settings.apiKey = $('cfgApiKey').value.trim();
    State.settings.webhook = $('cfgWebhook').value.trim();
    persist('settings');
    toast('Placeholders de integração salvos.');
  }

  function renderIdentity() {
    $('lockName').textContent = State.settings.displayName || DEFAULT_STATE.settings.displayName;
    renderAvatar();
  }

  function exportBackup() {
    const payload = Store.dump();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const a = document.createElement('a');

    a.href = url;
    a.download = `Codex_Backup_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup JSON gerado.');
  }

  function importBackup(fileInput) {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (parsed.app !== 'C0DEX_HUB_MOBILE' || !parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Arquivo não reconhecido.');
        }

        Object.keys(DEFAULT_STATE).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
            State[key] = parsed.data[key];
            Store.set(key, State[key]);
          }
        });

        applyTheme();
        renderIdentity();
        renderAll();
        closeSheet();
        toast('Backup importado.');
      } catch (err) {
        toast(`Falha ao importar: ${err.message}`);
      } finally {
        fileInput.value = '';
      }
    };

    reader.onerror = () => {
      toast('Não foi possível ler o arquivo.');
      fileInput.value = '';
    };

    reader.readAsText(file);
  }

  function shareText(text) {
    const payload = encodeURIComponent(String(text || '').slice(0, 3500));
    const url = `https://wa.me/?text=${payload}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function renderHomeStats() {
    const openTasks = State.tasks.filter(t => !t.done).length;
    $('statBreaks').textContent = String(State.breaks.length);
    $('statVault').textContent = String(State.vault.length);
    $('statTasks').textContent = String(openTasks);
    $('homeTaskBadge').textContent = String(openTasks);
    $('homeVaultBadge').textContent = String(State.vault.length);
    $('homePausaBadge').textContent = State.activeBreak ? '1' : '0';
    $('homePausaSub').textContent = State.activeBreak
      ? `Retorno previsto: ${formatTime(new Date(State.activeBreak.end))}`
      : 'Controle de saída, retorno e histórico local.';
  }

  function emptyState(iconText, message) {
    const box = document.createElement('div');
    box.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = iconText;

    const text = document.createElement('div');
    text.textContent = message;

    box.append(icon, text);
    return box;
  }

  function clearBreakHistory() {
    State.breaks = [];
    persist('breaks');
    renderBreakHistory();
    renderHomeStats();
    toast('Histórico limpo.');
  }

  function clearVault() {
    State.vault = [];
    persist('vault');
    renderVault();
    renderHomeStats();
    toast('Vault limpo.');
  }

  function clearDoneTasks() {
    State.tasks = State.tasks.filter(t => !t.done);
    persist('tasks');
    renderTasks();
    renderHomeStats();
    toast('Tarefas concluídas removidas.');
  }

  function openSheet(id) {
    $('sheetBackdrop').classList.add('open');
    $$('.sheet').forEach(s => s.classList.remove('open'));
    $(id)?.classList.add('open');
  }

  function closeSheet() {
    $('sheetBackdrop').classList.remove('open');
    $$('.sheet').forEach(s => s.classList.remove('open'));
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  function initGestures() {
    const area = $('scrollArea');

    area.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    area.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      const dy = t.clientY - touchStartY;
      if (area.scrollTop <= 0 && dy > 55) $('ptrIndicator').classList.add('active');
    }, { passive: true });

    area.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;

      if (dx > 90 && Math.abs(dy) < 70 && dt < 650) goBack();

      if (area.scrollTop <= 0 && dy > 70) {
        $('ptrIndicator').classList.add('active');
        setTimeout(() => {
          renderAll();
          $('ptrIndicator').classList.remove('active');
          toast('Dados locais atualizados.');
        }, 280);
      } else {
        $('ptrIndicator').classList.remove('active');
      }
    }, { passive: true });
  }

  function initSelectionNote() {
    const btn = $('floatNoteBtn');

    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      const article = $('wikiArticle');

      if (!text || text.length < 3 || article.hidden) {
        btn.classList.remove('open');
        return;
      }

      const anchor = sel.anchorNode;
      if (!anchor || !article.contains(anchor.nodeType === Node.TEXT_NODE ? anchor.parentNode : anchor)) {
        btn.classList.remove('open');
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      btn.style.left = `${Math.min(window.innerWidth - 128, Math.max(12, rect.left))}px`;
      btn.style.top = `${Math.max(90, rect.top - 44)}px`;
      btn.classList.add('open');
    });

    btn.addEventListener('click', () => {
      const sel = window.getSelection();
      const selected = sel ? sel.toString().trim() : '';
      if (!selected) return;

      const note = window.prompt('Nota para esta seleção:');
      if (note === null) return;

      addVaultItem('Nota de seleção Wiki Delphi', `Código/texto selecionado:\n${selected}\n\nNota:\n${note}`, ['#Highlight', '#WikiDelphi']);
      btn.classList.remove('open');
      sel.removeAllRanges();
    });
  }

  function protectPascalSyntax(text) {
    const reserved = /\b(begin|end|var|type|interface|implementation|try|finally|except|class|record|unit|uses|procedure|function|const|private|public|protected|published|override|virtual|inherited|nil|True|False)\b/g;
    return String(text).replace(reserved, '⟦$1⟧');
  }

  function buildSelectiveTranslationPayload(root) {
    const excludedSelector = 'code, pre, kbd, script, .syntaxhighlight';
    root.querySelectorAll(excludedSelector).forEach(el => el.setAttribute('translate', 'no'));

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(excludedSelector)) return NodeFilter.FILTER_REJECT;
        if (!parent.matches('p,h1,h2,h3,h4,h5,h6,li,span')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const payload = [];
    let current;
    while ((current = walker.nextNode())) {
      payload.push({
        original: current.nodeValue,
        protectedText: protectPascalSyntax(current.nodeValue)
      });
    }
    return payload;
  }

  function handleAction(action, target) {
    switch (action) {
      case 'open-settings': showView('settings'); break;
      case 'lock': Lock.lock(); break;
      case 'start-break-now': startBreak(new Date(), $('breakDurationInput').value); break;
      case 'start-break-manual': startBreak(todayAt($('breakStartInput').value), $('breakDurationInput').value); break;
      case 'finish-break': finishBreak(); break;
      case 'clear-break-history': clearBreakHistory(); break;
      case 'search-wiki': renderWikiResults(); break;
      case 'close-article': closeArticle(); break;
      case 'save-wiki-search': saveCurrentWikiSearch(); break;
      case 'add-vault':
        if (addVaultItem($('vaultTitle').value, $('vaultBody').value, $('vaultTags').value)) {
          $('vaultTitle').value = '';
          $('vaultBody').value = '';
          $('vaultTags').value = '';
          toast('Nota salva.');
        }
        break;
      case 'share-vault':
        shareText(`C0DΞX HUB — Vault\n\nTotal de notas: ${State.vault.length}`);
        break;
      case 'clear-vault': clearVault(); break;
      case 'add-task': addTask(); break;
      case 'ask-notifications': askNotifications(); break;
      case 'clear-done-tasks': clearDoneTasks(); break;
      case 'save-settings': saveSettings(); break;
      case 'save-integrations': saveIntegrations(); break;
      case 'choose-avatar': openSheet('avatarSheet'); break;
      case 'upload-avatar': $('avatarUpload').click(); break;
      case 'export-backup': exportBackup(); break;
      case 'import-backup': $('backupImportInput').click(); break;
      case 'close-sheet': closeSheet(); break;
      default:
        if (target.dataset.view) showView(target.dataset.view);
    }
  }

  function initEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action], [data-view]');
      if (!target) return;

      const action = target.dataset.action;
      if (action) handleAction(action, target);
      else if (target.dataset.view) showView(target.dataset.view);
    });

    $('breakDurationInput').addEventListener('change', () => {
      const min = $('breakDurationInput').value;
      $$('#durationChips .chip').forEach(chip => chip.classList.toggle('active', chip.dataset.min === min));
    });

    $('durationChips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-min]');
      if (!chip) return;
      $('breakDurationInput').value = chip.dataset.min;
      $('breakDurationInput').dispatchEvent(new Event('change'));
    });

    $('wikiSearchInput').addEventListener('input', () => renderWikiResults());
    $('backupImportInput').addEventListener('change', (e) => importBackup(e.target));

    $('avatarEmojiList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-avatar]');
      if (!btn) return;
      State.settings.avatar = btn.dataset.avatar;
      persist('settings');
      renderAvatar();
      closeSheet();
      toast('Avatar atualizado.');
    });

    $('avatarUpload').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('Arquivo de imagem inválido.');
        return;
      }
      if (file.size > 900 * 1024) {
        toast('Imagem muito grande. Use até 900 KB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        State.settings.avatar = String(reader.result || '');
        persist('settings');
        renderAvatar();
        closeSheet();
        toast('Foto de perfil salva em Base64.');
      };
      reader.readAsDataURL(file);
    });
  }

  function renderAll() {
    applyTheme();
    renderIdentity();
    renderBreak();
    renderWiki();
    renderVault();
    renderTasks();
    renderHomeStats();
  }

  function init() {
    loadState();
    Lock.init();
    initEvents();
    initGestures();
    initSelectionNote();

    applyTheme();
    renderIdentity();
    updateClock();
    setInterval(updateClock, 15000);
    setInterval(renderBreak, 10000);
    setInterval(checkTaskAlerts, 30000);

    const now = new Date();
    $('breakStartInput').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    renderAll();
    showView('home', false);

    // Exposição controlada para testes manuais no console, sem poluir com várias funções globais.
    window.CodexHub = Object.freeze({
      version: APP_VERSION,
      exportBackup,
      buildSelectiveTranslationPayload
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();