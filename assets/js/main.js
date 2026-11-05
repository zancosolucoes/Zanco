/* Zanco: comportamento do protótipo */
(function () {
  "use strict";

  /* Dados de contato. Preencha o número com DDI e DDD, só com dígitos (ex.: 55DDNNNNNNNNN).
     Enquanto estiver vazio, o WhatsApp abre para a pessoa escolher o contato. */
  var CONFIG = {
    whatsapp: "",
    defaultMessage: "Olá! Vim pelo site da Zanco e preciso de ajuda com um equipamento."
  };

  var root = document.documentElement;
  var hasMotion = root.classList.contains("motion");
  if (hasMotion) root.dataset.motionReady = "";

  function waUrl(message) {
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(message);
  }

  function setWhatsapp(link, message) {
    link.href = waUrl(message);
    link.target = "_blank";
    link.rel = "noopener";
  }

  /* Sem JavaScript, esses links continuam levando à seção de contato. */
  document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
    setWhatsapp(link, CONFIG.defaultMessage);
  });

  /* Revelação ao rolar */
  function initReveal() {
    document.querySelectorAll("[data-reveal-stagger]").forEach(function (group) {
      var step = Number(group.dataset.revealStagger) || 80;
      group.querySelectorAll("[data-reveal]").forEach(function (el, i) {
        if (!el.dataset.revealDelay) el.dataset.revealDelay = String(i * step);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = (el.dataset.revealDelay || 0) + "ms";
        el.classList.add("is-in");
        observer.unobserve(el);
        el.addEventListener("transitionend", function () { el.style.transitionDelay = ""; }, { once: true });
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    document.querySelectorAll("[data-reveal]").forEach(function (el) { observer.observe(el); });
  }

  /* Parallax leve, calculado só para o que está visível */
  function initParallax() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-parallax-x], [data-parallax-dock]"));
    if (!els.length) return;
    var mobile = matchMedia("(max-width: 767px)");
    var visible = new Set();
    var queued = false;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      request();
    }, { rootMargin: "20% 0px" });
    els.forEach(function (el) { io.observe(el); });

    function request() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    function update() {
      queued = false;
      var factor = mobile.matches ? 0.5 : 1;
      visible.forEach(function (el) {
        if (el.dataset.parallaxDock) {
          var parent = (el.parentElement || el).getBoundingClientRect();
          var rest = Math.max(0, parent.bottom - innerHeight);
          el.style.translate = "0 " + (rest * Number(el.dataset.parallaxDock) * factor).toFixed(1) + "px";
          return;
        }
        var box = el.parentElement.getBoundingClientRect();
        var distance = Math.max(0, box.top + 200 - innerHeight * 0.6);
        el.style.translate = (distance * Number(el.dataset.parallaxX) * factor).toFixed(1) + "px 0";
      });
    }

    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request, { passive: true });
  }

  /* Menu suspenso e menu mobile */
  function initNav() {
    var nav = document.querySelector(".nav");
    var backdrop = document.querySelector(".nav-backdrop");
    var dropdowns = Array.prototype.slice.call(nav.querySelectorAll(".nav__dropdown"));
    var mobileMenu = nav.querySelector(".nav__menu");
    var closeTimer;

    function open(target) {
      clearTimeout(closeTimer);
      backdrop.classList.toggle("is-visible", !!target);
      dropdowns.forEach(function (dd) {
        var isTarget = dd === target;
        dd.querySelector("button").setAttribute("aria-expanded", String(isTarget));
        dd.querySelector(".nav__panel").hidden = !isTarget;
      });
    }

    dropdowns.forEach(function (dd) {
      var trigger = dd.querySelector("button");
      trigger.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") open(dd);
      });
      dd.addEventListener("pointerenter", function () { clearTimeout(closeTimer); });
      dd.addEventListener("pointerleave", function () {
        closeTimer = setTimeout(function () { open(); }, 160);
      });
      trigger.addEventListener("click", function () {
        open(trigger.getAttribute("aria-expanded") === "true" ? undefined : dd);
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowDown") return;
        e.preventDefault();
        open(dd);
        var first = dd.querySelector(".nav__panel a");
        if (first) first.focus();
      });
      dd.querySelectorAll(".nav__panel a").forEach(function (link) {
        link.addEventListener("click", function () { open(); });
      });
    });

    nav.querySelectorAll(".nav__links > li > a").forEach(function (link) {
      link.addEventListener("pointerenter", function () { open(); });
    });

    nav.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !nav.contains(e.relatedTarget)) open();
    });

    document.addEventListener("click", function (e) {
      if (nav.contains(e.target)) return;
      open();
      mobileMenu.removeAttribute("open");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var active = dropdowns.find(function (dd) {
        return dd.querySelector("button").getAttribute("aria-expanded") === "true";
      });
      if (active) {
        open();
        active.querySelector("button").focus();
      }
      if (mobileMenu.open) {
        mobileMenu.open = false;
        mobileMenu.querySelector("summary").focus();
      }
    });

    mobileMenu.addEventListener("toggle", function () {
      mobileMenu.querySelector("summary").setAttribute("aria-label", mobileMenu.open ? "Fechar menu" : "Abrir menu");
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { mobileMenu.open = false; });
    });

    matchMedia("(max-width: 1023px)").addEventListener("change", function () {
      open();
      mobileMenu.open = false;
    });
  }

  /* Exemplo de ordem de serviço no hero. Dados puramente ilustrativos. */
  function initOsDemo() {
    var os = document.querySelector("[data-os]");
    if (!os) return;

    var examples = {
      notebook: {
        name: "Notebook", status: "Aguardando sua aprovação", step: 2,
        checks: [["Bateria", 38, "Desgastada"], ["Armazenamento", 64, "Atenção"], ["Temperatura", 52, "Acima do ideal"], ["Memória", 100, "Sem falhas"]],
        items: ["Troca de bateria", "Limpeza interna"],
        next: "O reparo começa depois do seu ok."
      },
      computador: {
        name: "Computador", status: "Em reparo", step: 3,
        checks: [["Fonte", 100, "Sem falhas"], ["Armazenamento", 22, "Com defeito"], ["Temperatura", 88, "Normal"], ["Memória", 100, "Sem falhas"]],
        items: ["Troca do SSD", "Cópia dos arquivos"],
        next: "Orçamento aprovado. Avisamos ao terminar."
      },
      celular: {
        name: "Celular", status: "Pronto para retirada", step: 4,
        checks: [["Tela", 100, "Substituída"], ["Bateria", 96, "Sem falhas"], ["Conector", 100, "Sem falhas"], ["Câmeras", 100, "Sem falhas"]],
        items: ["Troca de tela", "Teste completo"],
        next: "Serviço concluído e testado."
      }
    };

    var steps = os.querySelectorAll("[data-os-steps] li");
    var nameEl = os.querySelector("[data-os-name]");
    var statusEl = os.querySelector("[data-os-status]");
    var checksEl = os.querySelector("[data-os-checks]");
    var itemsEl = os.querySelector("[data-os-items]");
    var nextEl = os.querySelector("[data-os-next]");
    var pills = os.querySelectorAll("[data-device]");

    function paintSteps(current) {
      steps.forEach(function (li, i) {
        li.classList.toggle("is-done", i < current);
        li.classList.toggle("is-now", i === current);
        if (i === current) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      });
    }

    function render(key) {
      var data = examples[key];
      nameEl.textContent = data.name;
      statusEl.textContent = data.status;
      nextEl.textContent = data.next;
      paintSteps(data.step);

      checksEl.querySelectorAll("li").forEach(function (li, i) {
        var check = data.checks[i];
        li.querySelector("span").textContent = check[0];
        li.querySelector("i").style.setProperty("--v", check[1]);
        li.querySelector("em").textContent = check[2];
      });
      itemsEl.querySelectorAll("li").forEach(function (li, i) {
        li.querySelector("span").textContent = data.items[i];
      });
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        os.classList.add("is-live");
        pills.forEach(function (p) {
          var on = p === pill;
          p.classList.toggle("is-on", on);
          p.setAttribute("aria-pressed", String(on));
        });
        render(pill.dataset.device);
      });
    });

    paintSteps(examples.notebook.step);
  }

  /* Faixa em movimento: controle de pausa */
  function initMarquee() {
    var track = document.querySelector("[data-marquee]");
    var toggle = document.querySelector("[data-marquee-toggle]");
    if (!track || !toggle) return;
    toggle.addEventListener("click", function () {
      var paused = track.classList.toggle("is-paused");
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.querySelector("span").textContent = paused ? "Retomar animação" : "Pausar animação";
      toggle.querySelector("use").setAttribute("href", paused ? "#i-play" : "#i-pause");
    });
  }

  /* Triagem: orientação inicial por equipamento e problema */
  function initTriage() {
    var tool = document.querySelector("[data-triage]");
    if (!tool) return;

    var water = "Desligue agora, não coloque para carregar e não tente ligar. Traga o quanto antes.";
    var devices = {
      notebook: {
        label: "notebook",
        problems: [
          { label: "Não liga", causes: ["Fonte ou carregador", "Bateria", "Placa-mãe"], tip: "Teste outra tomada e, se tiver, outro carregador compatível. Se nada mudar, ele precisa de diagnóstico." },
          { label: "Está lento", causes: ["Armazenamento cheio ou gasto", "Pouca memória", "Vírus ou excesso de programas"], tip: "Faça uma cópia dos arquivos importantes enquanto ele ainda funciona bem." },
          { label: "Esquenta ou desliga sozinho", causes: ["Poeira na ventilação", "Pasta térmica ressecada", "Ventoinha com defeito"], tip: "Evite usar sobre cama ou almofada e faça pausas até a avaliação." },
          { label: "Tela quebrada ou com defeito", causes: ["Tela danificada", "Cabo da tela", "Placa de vídeo"], tip: "Conecte um monitor externo. Se a imagem aparecer, aproveite para copiar seus arquivos." },
          { label: "Caiu líquido", causes: ["Oxidação", "Curto na placa", "Teclado danificado"], tip: water }
        ]
      },
      computador: {
        label: "computador",
        problems: [
          { label: "Não liga", causes: ["Fonte de alimentação", "Placa-mãe", "Cabos ou botão"], tip: "Confira o cabo de força e a tomada. Se continuar sem sinal de vida, ele precisa de diagnóstico." },
          { label: "Liga, mas fica sem imagem", causes: ["Cabo ou monitor", "Memória", "Placa de vídeo"], tip: "Teste outro cabo de vídeo ou outro monitor para descartar a causa mais simples." },
          { label: "Está lento", causes: ["Armazenamento antigo", "Pouca memória", "Vírus ou excesso de programas"], tip: "Faça uma cópia dos arquivos importantes enquanto ele ainda funciona bem." },
          { label: "Reinicia ou mostra tela de erro", causes: ["Memória", "Armazenamento", "Superaquecimento ou sistema"], tip: "Anote a mensagem de erro, se aparecer. Isso ajuda a encurtar o diagnóstico." },
          { label: "Vírus ou janelas estranhas", causes: ["Programa malicioso", "Extensões do navegador", "Sistema comprometido"], tip: "Evite acessar banco e digitar senhas nesse computador até a avaliação." }
        ]
      },
      celular: {
        label: "celular",
        problems: [
          { label: "Tela quebrada", causes: ["Vidro", "Display", "Sensor de toque"], tip: "Se a tela ainda responde, faça uma cópia dos seus dados antes de trazer." },
          { label: "Não carrega", causes: ["Conector sujo ou danificado", "Cabo ou carregador", "Bateria"], tip: "Teste outro cabo e outro carregador. Não force o conector nem use objetos para limpar." },
          { label: "Bateria dura pouco", causes: ["Desgaste natural", "Aplicativos em segundo plano", "Atualização do sistema"], tip: "Veja nas configurações quais aplicativos mais consomem bateria e conte para a equipe." },
          { label: "Está travando ou sem espaço", causes: ["Armazenamento cheio", "Sistema desatualizado", "Aplicativos com problema"], tip: "Faça uma cópia dos dados e veja quanto espaço livre ainda resta." },
          { label: "Caiu na água", causes: ["Oxidação", "Curto na placa", "Bateria danificada"], tip: water }
        ]
      }
    };

    var tabs = tool.querySelector(".tabs");
    var tabButtons = tabs.querySelectorAll("button");
    var select = tool.querySelector("[data-problem]");
    var result = tool.querySelector(".tool__result");
    var causes = tool.querySelector("[data-causes]");
    var tip = tool.querySelector("[data-tip]");
    var cta = tool.querySelector("[data-triage-cta]");
    var current = "notebook";

    function fillSelect() {
      select.innerHTML = "";
      devices[current].problems.forEach(function (problem, i) {
        var option = document.createElement("option");
        option.value = String(i);
        option.textContent = problem.label;
        select.append(option);
      });
    }

    function renderResult() {
      var device = devices[current];
      var problem = device.problems[Number(select.value) || 0];
      causes.innerHTML = "";
      problem.causes.forEach(function (cause) {
        var li = document.createElement("li");
        li.textContent = cause;
        causes.append(li);
      });
      tip.textContent = problem.tip;
      setWhatsapp(cta, "Olá, Zanco! Preciso de ajuda com meu " + device.label + ". Problema: " + problem.label.toLowerCase() + ".");
      result.classList.remove("is-swap");
      void result.offsetWidth;
      result.classList.add("is-swap");
    }

    tabButtons.forEach(function (button, i) {
      button.addEventListener("click", function () {
        current = button.dataset.tab;
        tabs.style.setProperty("--tab", i);
        tabButtons.forEach(function (b) {
          var on = b === button;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", String(on));
        });
        fillSelect();
        renderResult();
      });
    });

    select.addEventListener("change", renderResult);
    fillSelect();
    renderResult();
    result.classList.remove("is-swap");
  }

  initNav();
  initOsDemo();
  initMarquee();
  initTriage();
  if (hasMotion) {
    initReveal();
    initParallax();
  }
})();
