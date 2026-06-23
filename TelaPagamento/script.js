// ============ DADOS ============
const TOTAL = 57.99;

const state = {
  method: "credito",
};

// ============ ELEMENTOS ============
const methodCards = document.querySelectorAll(".method-card");
const cardSection = document.getElementById("cardSection");
const pixSection = document.getElementById("pixSection");
const securityBadges = document.getElementById("securityBadges");
const payBtn = document.getElementById("payBtn");
const payBtnLabel = document.getElementById("payBtnLabel");
const cardBrand = document.getElementById("cardBrand");

// ============ TROCA DE MÉTODO DE PAGAMENTO ============
methodCards.forEach((card) => {
  card.addEventListener("click", () => {
    methodCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    state.method = card.dataset.method;
    updateMethodView();
  });
});

function updateMethodView() {
  if (state.method === "pix") {
    cardSection.classList.add("hidden");
    pixSection.classList.remove("hidden");
    payBtnLabel.textContent = `PAGAR R$ ${TOTAL.toFixed(2)} COM PIX`;
    startPixTimer();
  } else {
    cardSection.classList.remove("hidden");
    pixSection.classList.add("hidden");
    payBtnLabel.textContent = `PAGAR R$ ${TOTAL.toFixed(2)}`;
    cardBrand.textContent = state.method === "debito" ? "DÉBITO" : "CRÉDITO";
  }
}

// ============ CARTÃO: MÁSCARAS E PREVIEW ============
const cardNumberInput = document.getElementById("cardNumber");
const cardNameInput = document.getElementById("cardName");
const cardExpiryInput = document.getElementById("cardExpiry");
const cardCvvInput = document.getElementById("cardCvv");

const cardNumberDisplay = document.getElementById("cardNumberDisplay");
const cardNameDisplay = document.getElementById("cardNameDisplay");
const cardExpiryDisplay = document.getElementById("cardExpiryDisplay");
const creditCard = document.getElementById("creditCard");

const cardPlaceholderGroups = ["0000", "0000", "0000", "0000"];

cardNumberInput.addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
  let formatted = digits.replace(/(.{4})/g, "$1 ").trim();
  e.target.value = formatted;
  cardNumberDisplay.textContent = formatted.length
    ? padCardNumber(formatted)
    : cardPlaceholderGroups.join(" ");
});

function padCardNumber(formatted) {
  const groups = formatted.split(" ");
  return cardPlaceholderGroups
    .map((placeholder, i) => groups[i] !== undefined ? groups[i] : placeholder)
    .join(" ");
}

cardNameInput.addEventListener("input", (e) => {
  const val = e.target.value.toUpperCase();
  e.target.value = val;
  cardNameDisplay.textContent = val.trim().length ? val : "NOME DO TITULAR";
});

cardExpiryInput.addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    digits = digits.slice(0, 2) + "/" + digits.slice(2);
  }
  e.target.value = digits;
  cardExpiryDisplay.textContent = digits || "MM/AA";
});

cardCvvInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
});

// Flip do cartão ao focar no CVV (efeito visual simples)
cardCvvInput.addEventListener("focus", () => {
  creditCard.style.borderColor = "var(--gold)";
});
cardCvvInput.addEventListener("blur", () => {
  creditCard.style.borderColor = "#3a2f1a";
});

// ============ PARCELAS ============
const installmentsSelect = document.getElementById("installments");

function buildInstallments() {
  installmentsSelect.innerHTML = "";
  const maxInstallments = 12;
  for (let i = 1; i <= maxInstallments; i++) {
    const value = TOTAL / i;
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent =
      i === 1
        ? `1x de R$ ${TOTAL.toFixed(2)} sem juros`
        : `${i}x de R$ ${value.toFixed(2)} sem juros`;
    installmentsSelect.appendChild(opt);
  }
}

installmentsSelect.addEventListener("change", () => {
  const n = Number(installmentsSelect.value);
  const value = TOTAL / n;
  payBtnLabel.textContent =
    n === 1
      ? `PAGAR R$ ${TOTAL.toFixed(2)}`
      : `PAGAR ${n}x DE R$ ${value.toFixed(2)}`;
});

// ============ PIX: QR CODE (gerado proceduralmente, decorativo) ============
function renderFakeQr() {
  const svg = document.getElementById("pixQr");
  svg.innerHTML = "";
  const size = 21; // grid 21x21 estilo QR
  const cell = 100 / size;

  // Gera um padrão pseudo-aleatório determinístico (mesmo "QR" sempre)
  let seed = 1337;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // mantém cantos como "finder patterns" para parecer QR real
      const isCorner =
        (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8);
      let fill;
      if (isCorner) {
        fill = (x + y) % 3 !== 0;
      } else {
        fill = rand() > 0.55;
      }
      if (fill) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x * cell);
        rect.setAttribute("y", y * cell);
        rect.setAttribute("width", cell);
        rect.setAttribute("height", cell);
        rect.setAttribute("fill", "#0a0a0a");
        svg.appendChild(rect);
      }
    }
  }
}

// ============ PIX: COPIAR CHAVE ============
const pixCopyBtn = document.getElementById("pixCopyBtn");
const pixKey = document.getElementById("pixKey");

pixCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(pixKey.textContent);
  } catch (err) {
    // fallback silencioso caso clipboard API não esteja disponível
  }
  pixCopyBtn.classList.add("copied");
  const originalHTML = pixCopyBtn.innerHTML;
  pixCopyBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Copiado`;
  setTimeout(() => {
    pixCopyBtn.classList.remove("copied");
    pixCopyBtn.innerHTML = originalHTML;
  }, 2000);
});

// ============ PIX: TIMER DE EXPIRAÇÃO ============
let pixInterval = null;

function startPixTimer() {
  if (pixInterval) return; // já rodando
  let seconds = 9 * 60 + 59;
  const timerEl = document.getElementById("pixTimer");

  pixInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(pixInterval);
      pixInterval = null;
      timerEl.textContent = "00:00";
      return;
    }
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

// ============ BOTÃO PAGAR ============
payBtn.addEventListener("click", () => {
  if (state.method !== "pix") {
    if (!cardNumberInput.value.trim() || !cardNameInput.value.trim() || !cardExpiryInput.value.trim() || !cardCvvInput.value.trim()) {
      alert("Preencha todos os dados do cartão para continuar.");
      return;
    }
  }

  payBtn.classList.add("loading");
  payBtn.disabled = true;
  const originalLabel = payBtnLabel.textContent;
  payBtnLabel.textContent = "PROCESSANDO...";

  setTimeout(() => {
    payBtn.classList.remove("loading");
    payBtn.disabled = false;
    payBtnLabel.textContent = originalLabel;
    alert("Pagamento confirmado! Seu agendamento foi concluído.");
  }, 1600);
});

// ============ VOLTAR ============
document.getElementById("backBtn").addEventListener("click", () => {
  console.log("Voltar para a tela de Data & Hora");
});

// ============ INIT ============
buildInstallments();
renderFakeQr();
updateMethodView();