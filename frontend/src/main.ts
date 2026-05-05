import "./style.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  memory?: Record<string, unknown>;
};

const STORAGE_KEY = "mw_chat_messages_v1";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  description: string;
};

const MENU: MenuItem[] = [
 
  {
    id: "caffe_mocha",
    name: "Caffè Mocha",
    price: 5.0,
    image: "/assets/images/caffe_mocha.png",
    badge: "Chocolate",
    description: "Espresso + cocoa + steamed milk.",
  },
  {
    id: "caffe_panna",
    name: "Caffè Panna",
    price: 4.5,
    image: "/assets/images/caffe_panna.png",
    badge: "Creamy",
    description: "Espresso topped with whipped cream.",
  },
  {
    id: "mocha_fusi",
    name: "Mocha Fusi",
    price: 5.25,
    image: "/assets/images/mocha_fusi.png",
    badge: "House",
    description: "A playful mocha twist, Merry’s Way style.",
  },
];

type ProductCategory = "Coffee" | "Pastry" | "Biscotti" | "Add-on";

type Product = {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image?: string;
};

const PRODUCT_IMAGE_BY_NAME: Record<string, string> = {
  "Flat White": "/assets/images/flat_white.png",
  "Caffè Mocha": "/assets/images/caffe_mocha.png",
  "Caffè Panna": "/assets/images/caffe_panna.png",
  "Mocha Fusi": "/assets/images/mocha_fusi.png",
  "Dark chocolate (Drinking Chocolate)": "/assets/images/caffe_mocha.png",
};

// Keep in sync with menu inside python_code/api/agents/order_taking_agent.py
const PRODUCTS: Product[] = [
  { id: "cappuccino", name: "Cappuccino", price: 4.5, category: "Coffee" },
  { id: "latte", name: "Latte", price: 4.75, category: "Coffee" },
  { id: "espresso_shot", name: "Espresso shot", price: 2.0, category: "Coffee" },
  { id: "flat_white", name: "Flat White", price: 4.75, category: "Coffee" },
  { id: "caffe_mocha", name: "Caffè Mocha", price: 5.0, category: "Coffee" },
  { id: "caffe_panna", name: "Caffè Panna", price: 4.5, category: "Coffee" },
  { id: "mocha_fusi", name: "Mocha Fusi", price: 5.25, category: "Coffee" },
  { id: "drinking_chocolate", name: "Dark chocolate (Drinking Chocolate)", price: 5.0, category: "Coffee" },
  { id: "packaged_chocolate", name: "Dark chocolate (Packaged Chocolate)", price: 3.0, category: "Add-on" },

  { id: "croissant", name: "Croissant", price: 3.25, category: "Pastry" },
  { id: "chocolate_croissant", name: "Chocolate Croissant", price: 3.75, category: "Pastry" },
  { id: "almond_croissant", name: "Almond Croissant", price: 4.0, category: "Pastry" },
  { id: "jumbo_savory_scone", name: "Jumbo Savory Scone", price: 3.25, category: "Pastry" },
  { id: "cranberry_scone", name: "Cranberry Scone", price: 3.5, category: "Pastry" },
  { id: "oatmeal_scone", name: "Oatmeal Scone", price: 3.25, category: "Pastry" },
  { id: "ginger_scone", name: "Ginger Scone", price: 3.5, category: "Pastry" },

  { id: "choc_chip_biscotti", name: "Chocolate Chip Biscotti", price: 2.5, category: "Biscotti" },
  { id: "hazelnut_biscotti", name: "Hazelnut Biscotti", price: 2.75, category: "Biscotti" },
  { id: "ginger_biscotti", name: "Ginger Biscotti", price: 2.5, category: "Biscotti" },

  { id: "choc_syrup", name: "Chocolate syrup", price: 1.5, category: "Add-on" },
  { id: "hazelnut_syrup", name: "Hazelnut syrup", price: 1.5, category: "Add-on" },
  { id: "carmel_syrup", name: "Carmel syrup", price: 1.5, category: "Add-on" },
  { id: "sugarfree_vanilla", name: "Sugar Free Vanilla syrup", price: 1.5, category: "Add-on" },
];

function el<T extends Element>(selector: string) {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

function escapeHtml(input: string) {
  const div = document.createElement("div");
  div.innerText = input;
  return div.innerHTML;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"));
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-200)));
}

function renderMessages(messages: ChatMessage[]) {
  const list = el<HTMLDivElement>("#messages");
  list.innerHTML = messages
    .map((m) => {
      const roleLabel = m.role === "user" ? "You" : "Assistant";
      return `
        <div class="msg ${m.role}">
          <div class="meta">${roleLabel}</div>
          <div class="bubble">${escapeHtml(m.content).replaceAll("\n", "<br/>")}</div>
        </div>
      `;
    })
    .join("");
  list.scrollTop = list.scrollHeight;
}

function setActiveTab(tab: "home" | "products" | "assistant") {
  el<HTMLButtonElement>('#tabHome').dataset.active = tab === "home" ? "true" : "false";
  el<HTMLButtonElement>('#tabProducts').dataset.active = tab === "products" ? "true" : "false";
  el<HTMLButtonElement>('#tabAssistant').dataset.active = tab === "assistant" ? "true" : "false";
  el<HTMLDivElement>('#viewHome').style.display = tab === "home" ? "block" : "none";
  el<HTMLDivElement>('#viewProducts').style.display = tab === "products" ? "block" : "none";
  el<HTMLDivElement>('#viewAssistant').style.display = tab === "assistant" ? "block" : "none";
}

function formatPrice(v: number) {
  return `$${v.toFixed(2)}`;
}

function renderMenu() {
  const grid = el<HTMLDivElement>("#menuGrid");
  grid.innerHTML = MENU.map((item) => {
    const badge = item.badge ? `<span class="pill">${escapeHtml(item.badge)}</span>` : "";
    return `
      <article class="card" data-menu-id="${item.id}">
        <div class="cardMedia">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy" />
        </div>
        <div class="cardBody">
          <div class="cardTop">
            <div class="cardTitleRow">
              <h3 class="cardTitle">${escapeHtml(item.name)}</h3>
              ${badge}
            </div>
            <div class="cardPrice">${formatPrice(item.price)}</div>
          </div>
          <p class="cardDesc">${escapeHtml(item.description)}</p>
          <div class="cardActions">
            <button class="small secondary" type="button" data-quick="${escapeHtml(item.name)}">Details</button>
            <button class="small primary" type="button" data-add="${escapeHtml(item.name)}">Add to order</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderProducts() {
  const query = el<HTMLInputElement>("#productSearch").value.trim().toLowerCase();
  const activeChip = el<HTMLDivElement>("#productChips").querySelector<HTMLButtonElement>(".chip[data-active='true']");
  const activeCategory = (activeChip?.dataset.category as ProductCategory | "All" | undefined) ?? "All";

  const list = PRODUCTS.filter((p) => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query);
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  const grid = el<HTMLDivElement>("#productGrid");
  grid.innerHTML = list
    .map((p) => {
      const image = p.image ?? PRODUCT_IMAGE_BY_NAME[p.name] ?? "/assets/images/icon.png";
      return `
        <article class="card productCard">
          <div class="cardMedia productMedia">
            <img src="${image}" alt="${escapeHtml(p.name)}" loading="lazy" />
          </div>
          <div class="cardBody">
            <div class="cardTop">
              <div class="cardTitleRow">
                <h3 class="cardTitle">${escapeHtml(p.name)}</h3>
                <span class="pill">${escapeHtml(p.category)}</span>
              </div>
              <div class="cardPrice">${formatPrice(p.price)}</div>
            </div>
            <div class="cardActions">
              <button class="small secondary" type="button" data-ask="${escapeHtml(p.name)}">Ask</button>
              <button class="small primary" type="button" data-add="${escapeHtml(p.name)}">Add to order</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  el<HTMLDivElement>("#productCount").textContent = `${list.length} items`;
}

async function pingHealth() {
  const badge = el<HTMLSpanElement>("#statusBadge");
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error(String(res.status));
    badge.textContent = "Connected";
    badge.dataset.variant = "ok";
  } catch {
    badge.textContent = "Backend not running";
    badge.dataset.variant = "warn";
  }
}

async function sendMessage(messages: ChatMessage[], text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  messages.push({ role: "user", content: trimmed });
  saveMessages(messages);
  renderMessages(messages);

  const sendBtn = el<HTMLButtonElement>("#sendBtn");
  const input = el<HTMLTextAreaElement>("#prompt");
  sendBtn.disabled = true;
  input.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }

    const data = (await res.json()) as { role?: string; content?: string; memory?: Record<string, unknown> };
    messages.push({
      role: "assistant",
      content: typeof data.content === "string" && data.content.trim() ? data.content : JSON.stringify(data, null, 2),
      memory: data.memory,
    });
  } catch (e) {
    messages.push({
      role: "assistant",
      content: `Error: ${e instanceof Error ? e.message : String(e)}`,
    });
  } finally {
    saveMessages(messages);
    renderMessages(messages);
    sendBtn.disabled = false;
    input.disabled = false;
    input.value = "";
    input.focus();
    void pingHealth();
  }
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <img class="brandMark" src="/assets/images/icon.png" alt="" />
        <div class="brandText">
          <div class="title">Merry's Way</div>
          <div class="subtitle">Coffee Shop Assistant</div>
        </div>
      </div>
      <nav class="tabs" aria-label="Main">
        <button id="tabHome" class="tab" type="button" data-active="true">Home</button>
        <button id="tabProducts" class="tab" type="button" data-active="false">Products</button>
        <button id="tabAssistant" class="tab" type="button" data-active="false">Assistant</button>
      </nav>
      <div class="status">
        <span class="dot"></span>
        <span id="statusBadge" class="badge" data-variant="warn">Checking…</span>
      </div>
    </header>

    <main class="main">
      <section id="viewHome" class="view">
        <div class="hero">
          <div class="heroCopy">
            <div class="kicker">Welcome to Merry’s Way</div>
            <h1 class="heroTitle">Coffee, pastries, and smart recommendations.</h1>
            <p class="heroSubtitle">Browse a few favorites, then jump into the assistant to place an order.</p>
            <div class="heroActions">
              <button id="goAssistant" class="primary" type="button">Open assistant</button>
              <button id="tryReco" class="secondary" type="button">Recommend something</button>
            </div>
          </div>
          <div class="heroArt" aria-hidden="true">
            <img src="/assets/images/banner.png" alt="" />
          </div>
        </div>

        <div class="sectionHead">
          <h2>Today’s picks</h2>
          <div class="muted">Tap “Add to order” and we’ll send it to the assistant.</div>
        </div>
        <div id="menuGrid" class="grid"></div>
      </section>

      <section id="viewProducts" class="view" style="display:none">
        <div class="sectionHead">
          <h2>Products</h2>
          <div class="muted" id="productCount"></div>
        </div>
        <div class="productTools">
          <input id="productSearch" class="search" type="search" placeholder="Search products…" />
          <div id="productChips" class="chips" role="tablist" aria-label="Categories">
            <button class="chip" type="button" data-category="All" data-active="true">All</button>
            <button class="chip" type="button" data-category="Coffee" data-active="false">Coffee</button>
            <button class="chip" type="button" data-category="Pastry" data-active="false">Pastry</button>
            <button class="chip" type="button" data-category="Biscotti" data-active="false">Biscotti</button>
            <button class="chip" type="button" data-category="Add-on" data-active="false">Add-ons</button>
          </div>
        </div>
        <div id="productGrid" class="grid"></div>
      </section>

      <section id="viewAssistant" class="view" style="display:none">
        <div id="messages" class="messages" aria-live="polite"></div>
      </section>
    </main>

    <footer class="composer">
      <form id="composerForm" class="composerInner">
        <textarea id="prompt" rows="2" placeholder="Ask about the menu, place an order, or get recommendations…"></textarea>
        <div class="actions">
          <button id="clearBtn" type="button" class="secondary">Clear</button>
          <button id="sendBtn" type="submit" class="primary">Send</button>
        </div>
      </form>
      <div class="hint">Tip: run the backend, then chat here. Your history is saved locally.</div>
    </footer>
  </div>
`;

const messages = loadMessages();
renderMessages(messages);
renderMenu();
renderProducts();

const form = el<HTMLFormElement>("#composerForm");
const input = el<HTMLTextAreaElement>("#prompt");
const clearBtn = el<HTMLButtonElement>("#clearBtn");

el<HTMLButtonElement>("#tabHome").addEventListener("click", () => setActiveTab("home"));
el<HTMLButtonElement>("#tabProducts").addEventListener("click", () => setActiveTab("products"));
el<HTMLButtonElement>("#tabAssistant").addEventListener("click", () => setActiveTab("assistant"));
el<HTMLButtonElement>("#goAssistant").addEventListener("click", () => {
  setActiveTab("assistant");
  input.focus();
});
el<HTMLButtonElement>("#tryReco").addEventListener("click", () => {
  setActiveTab("assistant");
  void sendMessage(messages, "What do you recommend I order today?");
});

el<HTMLDivElement>("#menuGrid").addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement | null;
  if (!target) return;

  const quick = target.getAttribute("data-quick");
  const add = target.getAttribute("data-add");

  if (quick) {
    setActiveTab("assistant");
    void sendMessage(messages, `Tell me more about ${quick}.`);
    return;
  }
  if (add) {
    setActiveTab("assistant");
    void sendMessage(messages, `I'd like to order: ${add}`);
  }
});

el<HTMLInputElement>("#productSearch").addEventListener("input", () => renderProducts());
el<HTMLDivElement>("#productChips").addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement | null;
  const cat = target?.getAttribute("data-category");
  if (!cat) return;
  el<HTMLDivElement>("#productChips")
    .querySelectorAll<HTMLButtonElement>(".chip")
    .forEach((b) => (b.dataset.active = b.getAttribute("data-category") === cat ? "true" : "false"));
  renderProducts();
});

el<HTMLDivElement>("#productGrid").addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement | null;
  if (!target) return;

  const ask = target.getAttribute("data-ask");
  const add = target.getAttribute("data-add");

  if (ask) {
    setActiveTab("assistant");
    void sendMessage(messages, `Tell me more about ${ask}.`);
    return;
  }
  if (add) {
    setActiveTab("assistant");
    void sendMessage(messages, `I'd like to order: ${add}`);
  }
});

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  setActiveTab("assistant");
  void sendMessage(messages, input.value);
});

input.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" && !ev.shiftKey) {
    ev.preventDefault();
    setActiveTab("assistant");
    void sendMessage(messages, input.value);
  }
});

clearBtn.addEventListener("click", () => {
  messages.splice(0, messages.length);
  saveMessages(messages);
  renderMessages(messages);
  input.focus();
});

void pingHealth();
