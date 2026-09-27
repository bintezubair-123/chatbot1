import "./style.css";
import "./auth.css";
import { guardAuth, getCurrentUser, isAuthenticated, apiLogout } from "./auth.js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  memory?: Record<string, unknown>;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type ProductCategory = "Coffee" | "Pastry" | "Biscotti" | "Add-on";

type Product = {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image?: string;
  badge?: string;
  description?: string;
};

const STORAGE_CHAT_KEY = "mw_mobile_chat_v3";
const STORAGE_CART_KEY = "mw_mobile_cart_v3";

const PRODUCTS: Product[] = [
  // 1. Coffee (8 items)
  { id: "cappuccino", name: "Cappuccino", price: 4.5, category: "Coffee", description: "Rich espresso with steamed milk & frothy cap." },
  { id: "latte", name: "Latte", price: 4.75, category: "Coffee", description: "Smooth espresso with velvety steamed milk." },
  { id: "espresso_shot", name: "Espresso shot", price: 2.0, category: "Coffee", description: "Bold shot of dark roasted espresso." },
  { id: "flat_white", name: "Flat White", price: 4.75, category: "Coffee", description: "Espresso with microfoam milk." },
  { id: "caffe_mocha", name: "Caffè Mocha", price: 5.0, category: "Coffee", badge: "Popular", description: "Rich espresso with cocoa & velvety steamed milk." },
  { id: "caffe_panna", name: "Caffè Panna", price: 4.5, category: "Coffee", badge: "Creamy", description: "Double shot espresso topped with whipped cream." },
  { id: "mocha_fusi", name: "Mocha Fusi", price: 5.25, category: "Coffee", badge: "House Special", description: "Merry's Way signature chocolate-infused espresso." },
  { id: "drinking_chocolate", name: "Dark chocolate (Drinking Chocolate)", price: 5.0, category: "Coffee", description: "Rich cocoa drinking chocolate." },

  // 2. Pastries (7 items)
  { id: "croissant", name: "Croissant", price: 3.25, category: "Pastry", description: "Flaky, buttery classic French croissant." },
  { id: "chocolate_croissant", name: "Chocolate Croissant", price: 3.75, category: "Pastry", description: "Flaky croissant filled with rich dark chocolate." },
  { id: "almond_croissant", name: "Almond Croissant", price: 4.0, category: "Pastry", description: "Filled with almond cream and sliced almonds." },
  { id: "jumbo_savory_scone", name: "Jumbo Savory Scone", price: 3.25, category: "Pastry", description: "Herbs and savory cheese baked scone." },
  { id: "cranberry_scone", name: "Cranberry Scone", price: 3.5, category: "Pastry", description: "Sweet and tart cranberry scone." },
  { id: "oatmeal_scone", name: "Oatmeal Scone", price: 3.25, category: "Pastry", description: "Wholesome scone made with rolled oats." },
  { id: "ginger_scone", name: "Ginger Scone", price: 3.5, category: "Pastry", description: "Spiced scone infused with ginger." },

  // 3. Biscotti (3 items)
  { id: "choc_chip_biscotti", name: "Chocolate Chip Biscotti", price: 2.5, category: "Biscotti", description: "Crunchy dipping biscotti with chocolate chips." },
  { id: "hazelnut_biscotti", name: "Hazelnut Biscotti", price: 2.75, category: "Biscotti", description: "Crunchy biscotti infused with roasted hazelnuts." },
  { id: "ginger_biscotti", name: "Ginger Biscotti", price: 2.5, category: "Biscotti", description: "Spicy ginger biscotti." },

  // 4. Add-ons & Flavors (5 items)
  { id: "choc_syrup", name: "Chocolate syrup", price: 1.5, category: "Add-on", description: "Rich chocolate syrup drizzle." },
  { id: "hazelnut_syrup", name: "Hazelnut syrup", price: 1.5, category: "Add-on", description: "Nutty sweet hazelnut flavor." },
  { id: "carmel_syrup", name: "Carmel syrup", price: 1.5, category: "Add-on", description: "Luscious caramel drizzle." },
  { id: "sugarfree_vanilla", name: "Sugar Free Vanilla syrup", price: 1.5, category: "Add-on", description: "Guilt-free vanilla flavor syrup." },
  { id: "packaged_chocolate", name: "Dark chocolate (Packaged Chocolate)", price: 3.0, category: "Add-on", description: "Artisanal packaged dark chocolate bar." },
];

const PRODUCT_IMAGE_BY_NAME: Record<string, string> = {
  "Flat White": "/assets/images/flat_white.png",
  "Caffè Mocha": "/assets/images/caffe_mocha.png",
  "Caffè Panna": "/assets/images/caffe_panna.png",
  "Mocha Fusi": "/assets/images/mocha_fusi.png",
  "Cappuccino": "/assets/images/Cappuccino.png",
  "Latte": "/assets/images/Latte.png",
  "Espresso shot": "/assets/images/espresso-shot.png",
  "Dark chocolate (Drinking Chocolate)": "/assets/images/Dark chocolate.png",
  "Croissant": "/assets/images/Croissant.png",
  "Chocolate Croissant": "/assets/images/Chocolate Croissant.png",
  "Almond Croissant": "/assets/images/Almond Croissant.png",
  "Jumbo Savory Scone": "/assets/images/Jumbo-Savory-Scone.png",
  "Cranberry Scone": "/assets/images/Cranberry Scone.png",
  "Oatmeal Scone": "/assets/images/Oatmeal-Scone.png",
  "Ginger Scone": "/assets/images/Ginger-Scone.png",
  "Chocolate Chip Biscotti": "/assets/images/Chip Biscotti.png",
  "Hazelnut Biscotti": "/assets/images/Hazelnut-Biscotti.png",
  "Ginger Biscotti": "/assets/images/Ginger-Biscotti.png",
  "Chocolate syrup": "/assets/images/Chocolate syrup.png",
  "Hazelnut syrup": "/assets/images/Hazelnut-syrup.png",
  "Carmel syrup": "/assets/images/Carmel syrup.png",
  "Sugar Free Vanilla syrup": "/assets/images/Sugar-Free-Vanilla-syrup.png",
  "Dark chocolate (Packaged Chocolate)": "/assets/images/Dark chocolate (Packaged Chocolate).png",
};

// Global App State
let cart: CartItem[] = loadCart();
let messages: ChatMessage[] = loadMessages();
let activeCategory: ProductCategory | "All" = "All";
let searchQuery = "";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
  renderCartDrawer();
  updateHeaderBadge();
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages.slice(-150)));
}

function formatPrice(v: number): string {
  return `$${v.toFixed(2)}`;
}

function getProductByName(name: string): Product | undefined {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return PRODUCTS.find((p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === norm);
}

// Cart Logic
function addToCart(productName: string, quantity = 1) {
  const prod = getProductByName(productName);
  const name = prod ? prod.name : productName;
  const price = prod ? prod.price : 4.5;

  const existing = cart.find((i) => i.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: prod ? prod.id : String(Date.now()),
      name,
      price,
      quantity,
      image: prod ? PRODUCT_IMAGE_BY_NAME[prod.name] : undefined,
    });
  }
  saveCart();
}

function updateCartQty(itemName: string, delta: number) {
  const idx = cart.findIndex((i) => i.name.toLowerCase() === itemName.toLowerCase());
  if (idx !== -1) {
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) {
      cart.splice(idx, 1);
    }
  }
  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
}

function syncCartFromAiMemory(aiOrder: any[]) {
  if (!Array.isArray(aiOrder)) return;
  cart = [];
  for (const item of aiOrder) {
    if (item && item.item) {
      const prod = getProductByName(item.item);
      const name = prod ? prod.name : item.item;
      const price = item.price && item.quantity ? item.price / item.quantity : prod ? prod.price : 4.5;
      cart.push({
        id: prod ? prod.id : String(Date.now()),
        name,
        price,
        quantity: item.quantity || 1,
        image: prod ? PRODUCT_IMAGE_BY_NAME[prod.name] : undefined,
      });
    }
  }
  saveCart();
}

function el<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.innerText = str;
  return div.innerHTML;
}

function updateHeaderBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = el<HTMLDivElement>("#cartBadge");
  badge.textContent = String(totalCount);
  badge.style.display = totalCount > 0 ? "flex" : "none";
}

function renderCartDrawer() {
  const listEl = el<HTMLDivElement>("#cartList");
  const subtotalEl = el<HTMLSpanElement>("#cartSubtotal");
  const totalEl = el<HTMLSpanElement>("#cartTotal");

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px 10px;">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 10px; opacity: 0.5;">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>Your order cart is empty</p>
      </div>
    `;
    subtotalEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  listEl.innerHTML = cart
    .map(
      (item) => `
    <div class="cartItemRow">
      <div class="cartItemInfo">
        <span class="cartItemName">${escapeHtml(item.name)}</span>
        <span class="cartItemPrice">${formatPrice(item.price)} each</span>
      </div>
      <div class="cartQtyControls">
        <button class="qtyBtn" data-qty-dec="${escapeHtml(item.name)}">-</button>
        <span style="font-size: 13px; font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
        <button class="qtyBtn" data-qty-inc="${escapeHtml(item.name)}">+</button>
      </div>
    </div>
  `
    )
    .join("");

  subtotalEl.textContent = formatPrice(subtotal);
  totalEl.textContent = formatPrice(subtotal);
}

// Optimized Grid Rendering Method (All 23 Products Guaranteed)
function updateProductGrid() {
  const gridEl = el<HTMLDivElement>("#productCardsGrid");
  const countEl = el<HTMLSpanElement>("#productCountText");

  const filtered = PRODUCTS.filter((p) => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  countEl.textContent = `${filtered.length} of ${PRODUCTS.length} products`;

  gridEl.innerHTML = filtered
    .map((p) => {
      const img = PRODUCT_IMAGE_BY_NAME[p.name] || "/assets/images/logo.png";
      return `
      <div class="mobileCard">
        <div class="cardImgWrap">
          <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" />
        </div>
        <div class="cardName">${escapeHtml(p.name)}</div>
        <div class="cardCategory">${escapeHtml(p.category)}</div>
        <div class="cardBottomRow">
          <span class="cardPrice">${formatPrice(p.price)}</span>
          <button class="addBtn" data-quick-add="${escapeHtml(p.name)}" title="Add to Order">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderHomeView() {
  const homeEl = el<HTMLDivElement>("#viewHome");
  const picks = PRODUCTS.filter((p) => p.badge);

  homeEl.innerHTML = `
    <div class="heroBanner">
      <span class="heroTag">☕ Merry's Way Greenwich Village</span>
      <h2 class="heroTitle">Craft Coffee & Fresh Pastries</h2>
      <p class="heroSubtitle">Order directly or chat with our AI barista for personalized recommendations.</p>
      <div class="heroBtnGroup">
        <button class="btnPrimary" id="homeOrderBtn">Order Assistant</button>
        <button class="btnSecondary" id="homeMenuBtn">Explore Menu</button>
      </div>
    </div>

    <div class="sectionTitleRow">
      <h3>Today's Highlights</h3>
      <span class="linkText" id="viewAllLink">View all (${PRODUCTS.length})</span>
    </div>

    <div class="productGrid">
      ${picks
      .map((p) => {
        const img = PRODUCT_IMAGE_BY_NAME[p.name] || "/assets/images/logo.png";
        return `
          <div class="mobileCard">
            <div class="cardImgWrap">
              <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" />
            </div>
            <div class="cardName">${escapeHtml(p.name)}</div>
            <div class="cardCategory">${escapeHtml(p.category)}</div>
            <div class="cardBottomRow">
              <span class="cardPrice">${formatPrice(p.price)}</span>
              <button class="addBtn" data-quick-add="${escapeHtml(p.name)}">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        `;
      })
      .join("")}
    </div>
  `;
}

function renderMenuView() {
  const menuEl = el<HTMLDivElement>("#viewMenu");
  const categories: (ProductCategory | "All")[] = ["All", "Coffee", "Pastry", "Biscotti", "Add-on"];

  menuEl.innerHTML = `
    <input type="search" id="searchInput" class="searchBar" placeholder="Search 23 coffee, pastries, biscotti, flavors..." />

    <div class="chipContainer">
      ${categories
      .map(
        (cat) => `
        <button class="categoryChip" data-cat="${cat}" data-active="${activeCategory === cat}">${cat}</button>
      `
      )
      .join("")}
    </div>

    <div class="sectionTitleRow">
      <h3 id="categoryTitleText">${activeCategory} Products</h3>
      <span style="font-size: 11px; color: var(--text-muted);" id="productCountText"></span>
    </div>

    <div class="productGrid" id="productCardsGrid"></div>
  `;

  updateProductGrid();

  const searchInput = el<HTMLInputElement>("#searchInput");
  searchInput.value = searchQuery;
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    updateProductGrid();
  });
}

function renderChatMessages() {
  const msgContainer = el<HTMLDivElement>("#chatMessages");
  if (messages.length === 0) {
    msgContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
        <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
        <p style="font-weight: 600; color: var(--text-primary);">Merry's Way AI Barista</p>
        <p style="font-size: 12px;">Ask about menu details, recommendations, or place an order directly.</p>
      </div>
    `;
    return;
  }

  msgContainer.innerHTML = messages
    .map((m) => {
      const isUser = m.role === "user";
      return `
      <div class="chatMsg ${m.role}">
        <span class="msgMeta">${isUser ? "You" : "Barista AI"}</span>
        <div class="msgBubble">${escapeHtml(m.content).replaceAll("\n", "<br/>")}</div>
      </div>
    `;
    })
    .join("");

  msgContainer.scrollTop = msgContainer.scrollHeight;
}

// API Sending Function
async function handleSendMessage(promptText: string) {
  const trimmed = promptText.trim();
  if (!trimmed) return;

  messages.push({ role: "user", content: trimmed });
  saveMessages();
  renderChatMessages();

  const inputEl = el<HTMLInputElement>("#chatInput");
  const sendBtn = el<HTMLButtonElement>("#chatSendBtn");
  inputEl.disabled = true;
  sendBtn.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as { role?: string; content?: string; memory?: Record<string, any> };
    const content = typeof data.content === "string" ? data.content : JSON.stringify(data);

    messages.push({
      role: "assistant",
      content,
      memory: data.memory,
    });

    // Auto-sync AI Order into live Mobile Cart
    if (data.memory && Array.isArray(data.memory.order)) {
      syncCartFromAiMemory(data.memory.order);
    }
  } catch (err: any) {
    messages.push({
      role: "assistant",
      content: `Sorry, unable to connect to backend: ${err.message || String(err)}`,
    });
  } finally {
    saveMessages();
    renderChatMessages();
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.value = "";
    inputEl.focus();
  }
}

// Navigation Tab Switcher
function switchTab(tab: "home" | "menu" | "assistant") {
  el<HTMLDivElement>("#viewHome").style.display = tab === "home" ? "block" : "none";
  el<HTMLDivElement>("#viewMenu").style.display = tab === "menu" ? "block" : "none";
  el<HTMLDivElement>("#viewAssistant").style.display = tab === "assistant" ? "block" : "none";

  document.querySelectorAll<HTMLButtonElement>(".navItem").forEach((btn) => {
    btn.dataset.active = btn.dataset.tab === tab ? "true" : "false";
  });
}

// Stripe Checkout Payment Flow
async function triggerStripeCheckout() {
  if (cart.length === 0) return;

  // Require auth before checkout — show login/signup if not signed in
  if (!isAuthenticated()) {
    const checkoutBtn = el<HTMLButtonElement>("#checkoutBtn");
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Sign in to order…";

    try {
      await guardAuth();
      // After successful auth, show the logout button
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) logoutBtn.style.display = "grid";
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Place Pickup Order";
    }

    // guardAuth resolved — user is now signed in, proceed to checkout
    if (!isAuthenticated()) return; // still not authenticated (shouldn't happen)
  }

  const checkoutBtn = el<HTMLButtonElement>("#checkoutBtn");
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Connecting to Stripe...";

  try {
    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        currency: "usd",
      }),
    });

    if (!res.ok) {
      throw new Error(`Stripe API returned HTTP ${res.status}`);
    }

    const intentData = (await res.json()) as {
      client_secret: string;
      payment_intent_id: string;
      amount: number;
      currency: string;
      status: string;
      demo_mode?: boolean;
    };

    // Render Authentic Stripe Card Payment Modal
    const modalEl = document.createElement("div");
    modalEl.className = "modalOverlay";
    modalEl.innerHTML = `
      <div class="orderReceiptCard" style="max-width: 380px; text-align: left;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#a855f7"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-4.116C17.65 2.158 15.148 1.5 12.392 1.5c-4.945 0-8.232 2.502-8.232 6.554 0 4.49 4.394 5.378 7.375 6.398 2.378.805 3.328 1.503 3.328 2.5 0 .973-.974 1.527-2.45 1.527-2.423 0-5.27-1.05-7.078-2.022L4.35 20.73C6.354 21.8 9.387 22.5 12.143 22.5c5.389 0 8.788-2.476 8.788-6.721 0-4.68-4.339-5.59-6.955-6.629z"/></svg>
            <span style="font-weight: 700; font-size: 16px;">Stripe Checkout</span>
          </div>
          <span style="font-size: 11px; background: rgba(168, 85, 247, 0.2); color: var(--purple); padding: 4px 8px; border-radius: 999px;">🔒 Encrypted 256-bit</span>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--panel-border); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 4px;">
            <span>Pay Merry's Way</span>
            <span style="color: var(--amber-light);">${formatPrice(totalAmount)}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">Payment ID: ${intentData.payment_intent_id.slice(0, 18)}...</div>
        </div>

        <form id="stripePayForm" style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Card Number</label>
            <input type="text" id="stripeCardNum" class="searchBar" style="margin-bottom:0;" placeholder="4242 •••• •••• 4242" value="4242 4242 4242 4242" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Expiry Date</label>
              <input type="text" id="stripeCardExp" class="searchBar" style="margin-bottom:0;" placeholder="MM/YY" value="12/28" required />
            </div>
            <div>
              <label style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px;">CVC / CWW</label>
              <input type="text" id="stripeCardCvc" class="searchBar" style="margin-bottom:0;" placeholder="CVC" value="242" required />
            </div>
          </div>

          <button type="submit" class="checkoutBtn" id="paySubmitBtn" style="margin-top: 10px;">
            Confirm & Pay ${formatPrice(totalAmount)}
          </button>
          <button type="button" class="btnSecondary" id="cancelPayBtn" style="width: 100%; border-radius: 12px;">Cancel</button>
        </form>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelector("#cancelPayBtn")?.addEventListener("click", () => {
      modalEl.remove();
    });

    modalEl.querySelector("#stripePayForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const paySubmitBtn = modalEl.querySelector<HTMLButtonElement>("#paySubmitBtn");
      if (paySubmitBtn) {
        paySubmitBtn.disabled = true;
        paySubmitBtn.textContent = "Processing Stripe Payment...";
      }

      setTimeout(() => {
        modalEl.remove();
        // Trigger Successful Order Receipt
        showSuccessReceipt(intentData.payment_intent_id, totalAmount);
      }, 1000);
    });
  } catch (err: any) {
    alert(`Stripe Checkout error: ${err.message || String(err)}`);
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Place Pickup Order";
  }
}

function showSuccessReceipt(paymentIntentId: string, totalAmount: number) {
  const orderNo = `MW-${Math.floor(1000 + Math.random() * 9000)}`;
  const itemsListHtml = cart
    .map((i) => `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i.quantity}x ${i.name}</span><span>${formatPrice(i.price * i.quantity)}</span></div>`)
    .join("");

  const modalEl = document.createElement("div");
  modalEl.className = "modalOverlay";
  modalEl.innerHTML = `
    <div class="orderReceiptCard">
      <div class="receiptIcon">
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 class="receiptTitle">Payment Received!</h3>
      <div class="receiptOrderNo">Stripe Ref #${orderNo}</div>
      <div class="receiptDetails">
        <div style="font-weight: 700; margin-bottom: 6px;">Paid via Stripe</div>
        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 10px;">ID: ${paymentIntentId}</div>
        ${itemsListHtml}
        <div style="border-top: 1px dashed var(--panel-border); margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: 700;">
          <span>Grand Total</span>
          <span style="color: var(--amber-light);">${formatPrice(totalAmount)}</span>
        </div>
      </div>
      <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 16px;">
        📍 Pick up at <b>Merry's Way Greenwich Village</b> in ~8-10 minutes.
      </p>
      <button class="checkoutBtn" id="closeReceiptBtn">View Mobile App</button>
    </div>
  `;

  document.body.appendChild(modalEl);
  el<HTMLDivElement>("#cartOverlay").classList.remove("open");
  clearCart();

  modalEl.querySelector("#closeReceiptBtn")?.addEventListener("click", () => {
    modalEl.remove();
  });
}

// Render Initial App HTML Shell
function initApp() {
  const app = el<HTMLDivElement>("#app");
  app.innerHTML = `
    <div class="mobileContainer">
      <!-- App Header -->
      <header class="appHeader">
        <div class="brandInfo">
          <div class="brandAvatar">
            <img src="/assets/images/logo.jfif" alt="Merry's Way" />
          </div>
          <div>
            <div class="brandTitle">Merry's Way</div>
            <div class="brandSub">Coffee Shop Mobile</div>
          </div>
        </div>
        <div class="headerActions">
          <div class="statusDot" title="Backend Connected"></div>
          <button class="logoutBtn" id="logoutBtn" aria-label="Sign out" title="Sign out" style="display:none">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="cartHeaderBtn" id="openCartBtn" aria-label="Open Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="cartBadge" id="cartBadge">0</div>
          </button>
        </div>
      </header>

      <!-- Views Container -->
      <main class="appMain">
        <div id="viewHome" class="viewContainer"></div>
        <div id="viewMenu" class="viewContainer" style="display:none"></div>
        <div id="viewAssistant" class="viewContainer" style="display:none">
          <div class="chatContainer">
            <div class="chatMessages" id="chatMessages"></div>

            <div class="quickPrompts">
              <button class="promptPill" data-prompt="What do you recommend today?">✨ Recommendation</button>
              <button class="promptPill" data-prompt="I'd like to order a Caffè Mocha">☕ Order Mocha</button>
              <button class="promptPill" data-prompt="What pastries do you serve?">🥐 Pastries</button>
            </div>

            <form class="chatComposer" id="chatForm">
              <input type="text" id="chatInput" class="chatInput" placeholder="Ask barista or place order..." />
              <button type="submit" id="chatSendBtn" class="sendBtn" aria-label="Send">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      <!-- Bottom Navigation Bar -->
      <nav class="bottomNav">
        <button class="navItem" data-tab="home" data-active="true">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span>Home</span>
        </button>
        <button class="navItem" data-tab="menu" data-active="false">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span>Menu</span>
        </button>
        <button class="navItem" data-tab="assistant" data-active="false">
          <svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <span>AI Barista</span>
        </button>
      </nav>

      <!-- Cart Drawer Overlay -->
      <div class="cartOverlay" id="cartOverlay">
        <div class="cartSheet">
          <div class="sheetHandle"></div>
          <div class="sheetHeader">
            <h3 class="sheetTitle">My Order Cart</h3>
            <button class="closeBtn" id="closeCartBtn">✕</button>
          </div>

          <div class="cartList" id="cartList"></div>

          <div class="cartSummary">
            <div class="summaryRow">
              <span>Subtotal</span>
              <span id="cartSubtotal">$0.00</span>
            </div>
            <div class="summaryRow">
              <span>Estimated Pickup</span>
              <span>8 - 10 mins</span>
            </div>
            <div class="summaryRow total">
              <span>Total</span>
              <span id="cartTotal" style="color: var(--amber-light);">$0.00</span>
            </div>
          </div>

          <button class="checkoutBtn" id="checkoutBtn">Place Pickup Order</button>
        </div>
      </div>
    </div>
  `;

  renderHomeView();
  renderMenuView();
  renderChatMessages();
  renderCartDrawer();
  updateHeaderBadge();

  // Attach Event Listeners
  document.querySelectorAll<HTMLButtonElement>(".navItem").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab as "home" | "menu" | "assistant";
      switchTab(tab);
    });
  });

  el<HTMLButtonElement>("#openCartBtn").addEventListener("click", () => {
    el<HTMLDivElement>("#cartOverlay").classList.add("open");
  });

  el<HTMLButtonElement>("#closeCartBtn").addEventListener("click", () => {
    el<HTMLDivElement>("#cartOverlay").classList.remove("open");
  });

  el<HTMLDivElement>("#cartOverlay").addEventListener("click", (ev) => {
    if (ev.target === el<HTMLDivElement>("#cartOverlay")) {
      el<HTMLDivElement>("#cartOverlay").classList.remove("open");
    }
  });

  // Global delegate for [+ Add to Cart] buttons
  document.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const addBtn = target.closest<HTMLButtonElement>("[data-quick-add]");
    if (addBtn) {
      const name = addBtn.dataset.quickAdd;
      if (name) {
        addToCart(name, 1);
      }
      return;
    }

    const qtyInc = target.closest<HTMLButtonElement>("[data-qty-inc]");
    if (qtyInc) {
      const name = qtyInc.dataset.qtyInc;
      if (name) updateCartQty(name, 1);
      return;
    }

    const qtyDec = target.closest<HTMLButtonElement>("[data-qty-dec]");
    if (qtyDec) {
      const name = qtyDec.dataset.qtyDec;
      if (name) updateCartQty(name, -1);
      return;
    }

    const promptPill = target.closest<HTMLButtonElement>("[data-prompt]");
    if (promptPill) {
      const text = promptPill.dataset.prompt;
      if (text) handleSendMessage(text);
      return;
    }

    if (target.id === "homeOrderBtn") {
      switchTab("assistant");
      return;
    }
    if (target.id === "homeMenuBtn" || target.id === "viewAllLink") {
      switchTab("menu");
      return;
    }
  });

  // Category Filter Delegate
  el<HTMLDivElement>("#viewMenu").addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    const catBtn = target?.closest<HTMLButtonElement>(".categoryChip");
    if (catBtn) {
      activeCategory = catBtn.dataset.cat as ProductCategory | "All";
      document.querySelectorAll<HTMLButtonElement>(".categoryChip").forEach((c) => {
        c.dataset.active = c.dataset.cat === activeCategory ? "true" : "false";
      });
      el<HTMLHeadingElement>("#categoryTitleText").textContent = `${activeCategory} Products`;
      updateProductGrid();
    }
  });

  // Chat Form Submission
  el<HTMLFormElement>("#chatForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const inputEl = el<HTMLInputElement>("#chatInput");
    handleSendMessage(inputEl.value);
  });

  // Checkout Button triggers Stripe
  el<HTMLButtonElement>("#checkoutBtn").addEventListener("click", () => {
    triggerStripeCheckout();
  });

  // Logout button
  el<HTMLButtonElement>("#logoutBtn").addEventListener("click", async () => {
    const user = getCurrentUser();
    const name = user ? user.name.split(" ")[0] : "out";
    if (!confirm(`Sign out, ${name}?`)) return;
    await apiLogout();
    // Hide logout button and reload cleanly
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.style.display = "none";
    window.location.reload();
  });
}

// ─── Onboarding ────────────────────────────────────────────
const ONBOARDING_KEY = "mw_onboarding_done_v1";

interface ObSlide {
  tag: string;
  emoji?: string;
  logoSrc?: string;
  title: string;
  titleHighlight?: string; // word(s) to colour with gradient
  body: string;
}

const OB_SLIDES: ObSlide[] = [
  {
    tag: "☕  Welcome",
    logoSrc: "/assets/images/logo.jfif",
    title: "Merry's Way",
    titleHighlight: "Merry's Way",
    body: "Greenwich Village's favourite craft coffee shop — now in your pocket. Order ahead, skip the queue.",
  },
  {
    tag: "🥐  Fresh Every Day",
    emoji: "🛍️",
    title: "Browse our full menu",
    titleHighlight: "full menu",
    body: "From espresso shots to almond croissants and artisan biscotti — 23 items crafted fresh daily.",
  },
  {
    tag: "🤖  AI Barista",
    emoji: "✨",
    title: "Chat, order & customise",
    titleHighlight: "Chat",
    body: "Our AI barista takes your order, remembers your preferences, and adds items straight to your cart.",
  },
];

function highlightTitle(title: string, highlight?: string): string {
  if (!highlight) return title;
  return title.replace(
    highlight,
    `<span>${highlight}</span>`
  );
}

function buildOnboardingHTML(): string {
  const slidesHTML = OB_SLIDES.map((s) => {
    const illustration = s.logoSrc
      ? `<div class="obIllustration">
           <img src="${s.logoSrc}" alt="Merry's Way logo" />
         </div>`
      : `<div class="obIllustration">
           <span class="obEmoji">${s.emoji ?? "☕"}</span>
         </div>`;

    return `
      <div class="obSlide">
        ${illustration}
        <span class="obTag">${s.tag}</span>
        <h2 class="obTitle">${highlightTitle(s.title, s.titleHighlight)}</h2>
        <p class="obBody">${s.body}</p>
      </div>`;
  }).join("");

  const dotsHTML = OB_SLIDES.map((_, i) =>
    `<span class="obDot${i === 0 ? " active" : ""}" data-dot="${i}"></span>`
  ).join("");

  return `
    <div class="onboardingOverlay" id="onboardingOverlay" role="dialog" aria-modal="true" aria-label="Welcome to Merry's Way">
      <div class="onboardingCard">
        <div class="onboardingTrack" id="obTrack">
          ${slidesHTML}
        </div>
        <div class="onboardingControls">
          <div class="obDots" id="obDots">${dotsHTML}</div>
          <div class="obBtnRow" id="obBtnRow">
            <button class="obBtnSkip" id="obSkipBtn">Skip</button>
            <button class="obBtnNext" id="obNextBtn">
              Next
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function dismissOnboarding() {
  const overlay = document.getElementById("onboardingOverlay");
  if (!overlay) return;
  overlay.classList.add("hiding");
  overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
  localStorage.setItem(ONBOARDING_KEY, "1");
}

function showOnboarding() {
  document.body.insertAdjacentHTML("beforeend", buildOnboardingHTML());

  const overlay  = document.getElementById("onboardingOverlay")!;
  const track    = document.getElementById("obTrack")!;
  const dotsEl   = document.getElementById("obDots")!;
  const btnRow   = document.getElementById("obBtnRow")!;
  const skipBtn  = document.getElementById("obSkipBtn")!;
  const nextBtn  = document.getElementById("obNextBtn")!;
  const total    = OB_SLIDES.length;
  let current    = 0;

  function goTo(idx: number) {
    current = idx;
    // Slide track
    track.style.transform = `translateX(-${(100 / total) * idx}%)`;

    // Dots
    dotsEl.querySelectorAll<HTMLSpanElement>(".obDot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
    });

    const isLast = idx === total - 1;

    // Swap button row on last slide
    if (isLast) {
      btnRow.innerHTML = `
        <button class="obBtnStart" id="obStartBtn">
          Get Started
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </button>`;
      document.getElementById("obStartBtn")!.addEventListener("click", dismissOnboarding);
    } else {
      // Ensure next/skip are present (in case we go back somehow)
      if (!document.getElementById("obNextBtn")) {
        btnRow.innerHTML = `
          <button class="obBtnSkip" id="obSkipBtn">Skip</button>
          <button class="obBtnNext" id="obNextBtn">
            Next
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>`;
        document.getElementById("obSkipBtn")!.addEventListener("click", dismissOnboarding);
        document.getElementById("obNextBtn")!.addEventListener("click", () => goTo(current + 1));
      }
    }
  }

  // Initial bindings
  skipBtn.addEventListener("click", dismissOnboarding);
  nextBtn.addEventListener("click", () => goTo(current + 1));

  // Swipe gesture support
  let touchStartX = 0;
  overlay.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < total - 1) goTo(current + 1);
      else if (diff < 0 && current > 0)    goTo(current - 1);
    }
  });
}

// Boot Mobile App
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Mount the app immediately — no auth gate on load
  initApp();

  // 2. Silently restore session in the background (cookie-based).
  //    Updates _currentUser so the logout button shows for returning users.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json() as { user: import("./auth.js").AuthUser | null };
      if (data.user) {
        // Session found — show logout button
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.style.display = "grid";
      }
    }
  } catch {
    // Backend unreachable — no session, that's fine
  }

  // 3. Show onboarding on first visit
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    showOnboarding();
  }
});
