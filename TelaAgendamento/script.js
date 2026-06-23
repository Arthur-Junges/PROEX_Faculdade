// ============ DADOS ============
const services = {
  escova:    { name: "Escova Progressiva", price: 180, time: 120 },
  coloracao: { name: "Coloração Completa", price: 150, time: 90 },
  corte:     { name: "Corte Feminino",     price: 80,  time: 60 },
  manicure:  { name: "Manicure + Pedicure",price: 70,  time: 90 },
};

const pros = {
  ana:     { name: "Ana Lima",     role: "Cabeleireira Senior" },
  juliana: { name: "Juliana Costa", role: "Colorista" },
};

const state = {
  service: null,
  pro: null,
  date: null,   // "2026-06-22"
  time: null,
  calYear: 2026,
  calMonth: 5,  // junho (0-indexed)
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const TODAY = new Date(2026, 5, 22); // 22 jun 2026, conforme a referência

const timeSlotsAvailable = [
  "09:00", "10:00", "11:00", "13:00",
  "14:00", "15:00", "16:00", "17:30"
];

// ============ ELEMENTOS ============
const stepperEl = document.getElementById("stepper");
const panels = {
  1: document.getElementById("panel-1"),
  2: document.getElementById("panel-2"),
  3: document.getElementById("panel-3"),
};

let currentStep = 1;

// ============ NAVEGAÇÃO ENTRE ETAPAS ============
function goToStep(step) {
  currentStep = step;
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("hidden", Number(key) !== step);
  });
  updateStepper();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepper() {
  stepperEl.querySelectorAll(".step").forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.remove("active", "done");
    if (n < currentStep) el.classList.add("done");
    else if (n === currentStep) el.classList.add("active");
  });
  stepperEl.querySelectorAll(".step-line").forEach((el) => {
    const n = Number(el.dataset.line);
    el.classList.toggle("done", n < currentStep);
  });
}

// ============ STEP 1: SERVIÇO ============
const serviceCards = document.querySelectorAll("#serviceList .option-card");
const toStep2Btn = document.getElementById("toStep2");

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    serviceCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    card.querySelector("input").checked = true;
    state.service = card.dataset.id;
    toStep2Btn.disabled = false;
  });
});

toStep2Btn.addEventListener("click", () => {
  if (!state.service) return;
  fillSummary2();
  goToStep(2);
});

// ============ STEP 2: PROFISSIONAL ============
const proCards = document.querySelectorAll("#proList .pro-card");
const toStep3Btn = document.getElementById("toStep3");

proCards.forEach((card) => {
  card.addEventListener("click", () => {
    proCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    card.querySelector("input").checked = true;
    state.pro = card.dataset.id;
    toStep3Btn.disabled = false;
  });
});

toStep3Btn.addEventListener("click", () => {
  if (!state.pro) return;
  fillSummary3();
  goToStep(3);
});

function fillSummary2() {
  const s = services[state.service];
  document.getElementById("sumServiceName2").textContent = s.name;
  document.getElementById("sumServicePrice2").textContent = `R$ ${s.price}`;
}

function fillSummary3() {
  const s = services[state.service];
  const p = pros[state.pro];
  document.getElementById("sumServiceName3").textContent = s.name;
  document.getElementById("sumServicePrice3").textContent = `R$ ${s.price}`;
  document.getElementById("sumProName3").textContent = p.name;
}

// ============ VOLTAR ============
document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    goToStep(Number(btn.dataset.back));
  });
});

document.getElementById("backBtn").addEventListener("click", () => {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  } else {
    // No fluxo real isso voltaria para a tela anterior do app
    console.log("Voltar para a tela de detalhes do salão");
  }
});

// ============ STEP 3: CALENDÁRIO ============
const calMonthLabel = document.getElementById("calMonthLabel");
const calGrid = document.getElementById("calGrid");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const timeSlotsWrap = document.getElementById("timeSlots");
const slotsGrid = document.getElementById("slotsGrid");
const toPaymentBtn = document.getElementById("toPayment");

function renderCalendar() {
  calMonthLabel.textContent = `${monthNames[state.calMonth]} ${state.calYear}`;
  calGrid.innerHTML = "";

  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();

  // Espaços vazios antes do dia 1
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    calGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    cell.textContent = day;

    const cellDate = new Date(state.calYear, state.calMonth, day);
    const isPast = cellDate < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const isToday = cellDate.toDateString() === TODAY.toDateString();

    if (isPast) {
      cell.classList.add("disabled");
    } else {
      cell.addEventListener("click", () => selectDate(cellDate, cell));
    }

    if (isToday) cell.classList.add("today");

    if (
      state.date &&
      cellDate.toDateString() === new Date(state.date).toDateString()
    ) {
      cell.classList.add("selected");
    }

    calGrid.appendChild(cell);
  }

  // Desabilita "mês anterior" se for antes do mês atual de referência
  prevMonthBtn.disabled =
    state.calYear === TODAY.getFullYear() && state.calMonth === TODAY.getMonth();
}

function selectDate(dateObj, cellEl) {
  document.querySelectorAll(".cal-day.selected").forEach((c) => c.classList.remove("selected"));
  cellEl.classList.add("selected");
  state.date = dateObj.toISOString();
  state.time = null;
  renderTimeSlots();
  checkPaymentReady();
}

function renderTimeSlots() {
  timeSlotsWrap.classList.remove("hidden");
  slotsGrid.innerHTML = "";
  timeSlotsAvailable.forEach((time) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = time;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".slot-btn.selected").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.time = time;
      checkPaymentReady();
    });
    slotsGrid.appendChild(btn);
  });
}

function checkPaymentReady() {
  toPaymentBtn.disabled = !(state.date && state.time);
}

prevMonthBtn.addEventListener("click", () => {
  state.calMonth--;
  if (state.calMonth < 0) {
    state.calMonth = 11;
    state.calYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  state.calMonth++;
  if (state.calMonth > 11) {
    state.calMonth = 0;
    state.calYear++;
  }
  renderCalendar();
});

renderCalendar();
updateStepper();