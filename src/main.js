import { jsPDF } from "jspdf";
import "./style.css";

const form = document.querySelector("#delivery-form");
const panels = [...document.querySelectorAll(".step-panel")];
const stepItems = [...document.querySelectorAll("[data-step-item]")];
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const stepCounter = document.querySelector("#step-counter");
const formCard = document.querySelector(".form-card");
const downloadStatus = document.querySelector("#download-status");
const signatureCanvas = document.querySelector("#signature-pad");
const signatureContext = signatureCanvas.getContext("2d");
const signatureWrap = document.querySelector("#signature-pad-wrap");
const totalSteps = panels.length;

const fieldIds = [
  "sender-mission", "sender-service", "sender-name", "sender-role", "sender-phone", "sender-email",
  "recipient-mission", "recipient-service", "recipient-name", "recipient-role", "recipient-phone", "recipient-email",
  "content-nature", "piece-count", "estimated-weight", "content-note",
  "access-level", "classification-code",
  "transport-mode", "pickup-date", "pickup-window", "transport-note",
  "signatory-name", "signatory-role",
];
const maskIds = ["mask-missions", "mask-contacts", "mask-content", "mask-transport", "mask-code"];

let currentStep = 0;
let isDrawingSignature = false;
let hasSignature = false;

const getValue = (id) => document.getElementById(id).value.trim();
const isChecked = (id) => document.getElementById(id).checked;
const setText = (id, value) => {
  document.getElementById(id).textContent = value || "Non renseigné";
};

function showFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  input.setAttribute("aria-invalid", "true");
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
}

function clearFieldError(id) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  if (input) input.removeAttribute("aria-invalid");
  if (error) {
    error.textContent = "";
    error.hidden = true;
  }
}

function clearContactGroupError(prefix) {
  const error = document.getElementById(`${prefix}-contact-error`);
  error.textContent = "";
  error.hidden = true;
  [`${prefix}-phone`, `${prefix}-email`].forEach((id) => {
    const fieldError = document.getElementById(`${id}-error`);
    if (fieldError.hidden) document.getElementById(id).removeAttribute("aria-invalid");
  });
}

function resetAuthorityConfirmation() {
  const checkbox = document.getElementById("attest-authority");
  if (!checkbox.checked) return;
  checkbox.checked = false;
  checkbox.removeAttribute("aria-invalid");
  const error = document.getElementById("attest-authority-error");
  error.textContent = "";
  error.hidden = true;
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function activateStep(step, { scroll = false } = {}) {
  currentStep = step;
  panels.forEach((panel, index) => {
    panel.hidden = index !== step;
  });

  stepItems.forEach((item, index) => {
    item.classList.toggle("is-active", index === step);
    item.classList.toggle("is-complete", index < step);
    if (index === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });

  const visibleStep = step + 1;
  stepCounter.innerHTML = `ÉTAPE 0${visibleStep} <span>/ 0${totalSteps}</span>`;
  progressFill.style.width = `${(visibleStep / totalSteps) * 100}%`;
  progressBar.setAttribute("aria-valuenow", String(visibleStep));
  progressBar.setAttribute("aria-valuetext", `Étape ${visibleStep} sur ${totalSteps}`);
  downloadStatus.textContent = "";
  downloadStatus.classList.remove("is-error");

  const heading = panels[step].querySelector("h3");
  heading.focus({ preventScroll: true });
  if (scroll) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateRequired(id, message) {
  clearFieldError(id);
  if (getValue(id)) return { valid: true, firstInvalid: null };
  showFieldError(id, message);
  return { valid: false, firstInvalid: document.getElementById(id) };
}

function validateContactGroup(prefix) {
  const phoneId = `${prefix}-phone`;
  const emailId = `${prefix}-email`;
  const phone = getValue(phoneId);
  const email = getValue(emailId);
  const groupError = document.getElementById(`${prefix}-contact-error`);
  let valid = true;
  let firstInvalid = null;

  clearContactGroupError(prefix);
  clearFieldError(phoneId);
  clearFieldError(emailId);

  if (!phone && !email) {
    groupError.textContent = "Renseignez un téléphone ou une adresse courriel professionnelle.";
    groupError.hidden = false;
    document.getElementById(phoneId).setAttribute("aria-invalid", "true");
    document.getElementById(emailId).setAttribute("aria-invalid", "true");
    firstInvalid = document.getElementById(phoneId);
    valid = false;
  } else {
    if (phone && phone.replace(/\D/g, "").length < 7) {
      showFieldError(phoneId, "Vérifiez le numéro : indiquez au moins 7 chiffres.");
      firstInvalid ??= document.getElementById(phoneId);
      valid = false;
    }
    const emailInput = document.getElementById(emailId);
    if (email && !emailInput.validity.valid) {
      showFieldError(emailId, "Vérifiez le format de l’adresse courriel.");
      firstInvalid ??= emailInput;
      valid = false;
    }
  }

  return { valid, firstInvalid };
}

function validateCheckbox(id, errorId, message) {
  const checkbox = document.getElementById(id);
  const error = document.getElementById(errorId);
  checkbox.removeAttribute("aria-invalid");
  error.textContent = "";
  error.hidden = true;
  if (checkbox.checked) return { valid: true, firstInvalid: null };
  checkbox.setAttribute("aria-invalid", "true");
  error.textContent = message;
  error.hidden = false;
  return { valid: false, firstInvalid: checkbox };
}

function validateStep(step) {
  let valid = true;
  let firstInvalid = null;
  const apply = (result) => {
    if (!result.valid) {
      valid = false;
      firstInvalid ??= result.firstInvalid;
    }
  };

  if (step === 0) {
    apply(validateRequired("sender-mission", "Indiquez la mission émettrice."));
    apply(validateRequired("sender-service", "Indiquez le service émetteur."));
    apply(validateRequired("sender-name", "Indiquez le référent responsable."));
    apply(validateRequired("sender-role", "Indiquez la fonction du référent."));
    apply(validateContactGroup("sender"));
  }

  if (step === 1) {
    apply(validateRequired("recipient-mission", "Indiquez la mission de destination."));
    apply(validateRequired("recipient-name", "Indiquez le contact autorisé."));
    apply(validateRequired("recipient-role", "Indiquez la fonction du contact."));
    apply(validateContactGroup("recipient"));
    apply(validateCheckbox("recipient-authorized", "recipient-authorized-error", "Confirmez que ce contact est autorisé à réceptionner le pli."));
  }

  if (step === 2) {
    apply(validateRequired("content-nature", "Choisissez une nature générale du pli."));
    const pieces = document.getElementById("piece-count");
    clearFieldError("piece-count");
    if (!pieces.value || !Number.isInteger(Number(pieces.value)) || Number(pieces.value) < 1 || Number(pieces.value) > 999) {
      showFieldError("piece-count", "Indiquez un nombre entier compris entre 1 et 999.");
      apply({ valid: false, firstInvalid: pieces });
    }
    const weight = document.getElementById("estimated-weight");
    clearFieldError("estimated-weight");
    if (weight.value && (!Number.isFinite(Number(weight.value)) || Number(weight.value) <= 0 || Number(weight.value) > 50000)) {
      showFieldError("estimated-weight", "Indiquez un poids positif inférieur ou égal à 50 000 kg.");
      apply({ valid: false, firstInvalid: weight });
    }
  }

  if (step === 3) {
    apply(validateRequired("access-level", "Choisissez un niveau d’accès."));
  }

  if (step === 4) {
    apply(validateRequired("transport-mode", "Choisissez le mode d’acheminement."));
    apply(validateRequired("pickup-window", "Choisissez un créneau d’enlèvement."));
    const pickupDate = document.getElementById("pickup-date");
    clearFieldError("pickup-date");
    if (pickupDate.value && pickupDate.value < localDateString()) {
      showFieldError("pickup-date", "La date d’enlèvement ne peut pas être passée.");
      apply({ valid: false, firstInvalid: pickupDate });
    }
  }

  if (step === 5) {
    apply(validateRequired("signatory-name", "Indiquez le nom du signataire."));
    apply(validateRequired("signatory-role", "Indiquez la fonction du signataire."));
    const mode = form.querySelector('input[name="signature-mode"]:checked')?.value;
    const signatureError = document.getElementById("signature-error");
    signatureError.hidden = true;
    signatureError.textContent = "";
    if (mode === "draw" && !hasSignature) {
      signatureError.textContent = "Dessinez votre signature ou choisissez la signature après impression.";
      signatureError.hidden = false;
      apply({ valid: false, firstInvalid: document.querySelector('input[name="signature-mode"][value="draw"]') });
    }
    apply(validateCheckbox("attest-authority", "attest-authority-error", "Confirmez que vous êtes autorisé à valider ce bordereau."));
  }

  if (!valid && firstInvalid) {
    firstInvalid.focus({ preventScroll: true });
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return valid;
}

function formatContact(name, role, phone, email) {
  return [
    [name, role].filter(Boolean).join(" — "),
    phone ? `Tél. ${phone}` : "",
    email,
  ].filter(Boolean).join(" · ");
}

function formatDate(value) {
  if (!value) return "Non renseignée";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function selectedMasks() {
  return {
    missions: isChecked("mask-missions"),
    contacts: isChecked("mask-contacts"),
    content: isChecked("mask-content"),
    transport: isChecked("mask-transport"),
    code: isChecked("mask-code"),
  };
}

function maskLabels(masks) {
  const labels = [];
  if (masks.missions) labels.push("Missions et services");
  if (masks.contacts) labels.push("Référents et coordonnées");
  if (masks.content) labels.push("Contenu, pièces et poids");
  if (masks.transport) labels.push("Transport et enlèvement");
  if (masks.code) labels.push("Code de classification");
  return labels;
}

function populateReview() {
  const senderContact = formatContact(getValue("sender-name"), getValue("sender-role"), getValue("sender-phone"), getValue("sender-email"));
  const recipientContact = formatContact(getValue("recipient-name"), getValue("recipient-role"), getValue("recipient-phone"), getValue("recipient-email"));
  const weight = getValue("estimated-weight");
  const masks = selectedMasks();

  setText("review-sender-mission", getValue("sender-mission"));
  setText("review-sender-service", getValue("sender-service"));
  setText("review-sender-person", [getValue("sender-name"), getValue("sender-role")].filter(Boolean).join(" — "));
  setText("review-sender-contact", [getValue("sender-phone"), getValue("sender-email")].filter(Boolean).join(" · "));

  setText("review-recipient-mission", getValue("recipient-mission"));
  setText("review-recipient-service", getValue("recipient-service"));
  setText("review-recipient-person", [getValue("recipient-name"), getValue("recipient-role")].filter(Boolean).join(" — "));
  setText("review-recipient-contact", [getValue("recipient-phone"), getValue("recipient-email")].filter(Boolean).join(" · "));
  setText("review-authorized", isChecked("recipient-authorized") ? "Contact autorisé confirmé" : "À confirmer");

  setText("review-content-nature", getValue("content-nature"));
  setText("review-piece-count", getValue("piece-count") ? `${getValue("piece-count")} pièce(s)` : "");
  setText("review-weight", weight ? `${weight.replace(".", ",")} kg` : "Non indiqué");
  setText("review-content-note", getValue("content-note") || "Aucune précision");

  setText("review-access-level", getValue("access-level"));
  setText("review-classification-code", getValue("classification-code") || "Non renseigné");
  setText("review-mask-summary", maskLabels(masks).join(" · ") || "Aucun masquage sélectionné");

  setText("review-transport-mode", getValue("transport-mode"));
  setText("review-pickup-date", formatDate(getValue("pickup-date")));
  setText("review-pickup-window", getValue("pickup-window"));
  setText("review-transport-note", getValue("transport-note") || "Aucune note");
}

function collectData() {
  return {
    sender: {
      mission: getValue("sender-mission"),
      service: getValue("sender-service"),
      name: getValue("sender-name"),
      role: getValue("sender-role"),
      phone: getValue("sender-phone"),
      email: getValue("sender-email"),
    },
    recipient: {
      mission: getValue("recipient-mission"),
      service: getValue("recipient-service"),
      name: getValue("recipient-name"),
      role: getValue("recipient-role"),
      phone: getValue("recipient-phone"),
      email: getValue("recipient-email"),
      authorized: isChecked("recipient-authorized"),
    },
    content: {
      nature: getValue("content-nature"),
      pieces: getValue("piece-count"),
      weight: getValue("estimated-weight"),
      note: getValue("content-note"),
    },
    confidentiality: {
      level: getValue("access-level"),
      code: getValue("classification-code"),
      masks: selectedMasks(),
    },
    transport: {
      mode: getValue("transport-mode"),
      date: getValue("pickup-date"),
      window: getValue("pickup-window"),
      note: getValue("transport-note"),
    },
    signatory: {
      name: getValue("signatory-name"),
      role: getValue("signatory-role"),
      mode: form.querySelector('input[name="signature-mode"]:checked')?.value || "print",
    },
  };
}

function cleanPdfText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "-")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
}

function makePdf() {
  const data = collectData();
  const masks = data.confidentiality.masks;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 17;
  const contentWidth = pageWidth - margin * 2;
  const green = [38, 77, 64];
  const ink = [43, 61, 51];
  const muted = [112, 124, 114];
  const masked = "MASQUÉ — règle de diffusion";
  let y = 0;

  const maskValue = (value, maskedCategory) => (masks[maskedCategory] ? masked : value || "Non renseigné");
  const safe = (value) => cleanPdfText(value || "Non renseigné");

  doc.setProperties({ title: "Bordereau de transfert - maquette", subject: "Récapitulatif A4 de démonstration" });
  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...green);
  doc.text("BORDEREAU DE TRANSFERT", margin, 15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 91, 65);
  doc.text("MAQUETTE - NON OFFICIEL", pageWidth - margin, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.setTextColor(...ink);
  doc.text("Transfert de pli", margin, 28);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Récapitulatif de validation et d'acheminement", margin, 35);
  doc.setFontSize(8);
  doc.text(`Généré le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}`, pageWidth - margin, 35, { align: "right" });

  doc.setFillColor(243, 245, 239);
  doc.setDrawColor(230, 234, 226);
  doc.roundedRect(margin, 42, contentWidth, 17, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...green);
  doc.text("NIVEAU DE DIFFUSION", margin + 5, 49);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  doc.text(doc.splitTextToSize(safe(data.confidentiality.level), contentWidth - 10), margin + 5, 55);
  y = 68;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 23) {
      doc.addPage();
      y = 20;
    }
  };

  const addSection = (label) => {
    ensureSpace(13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...green);
    doc.text(cleanPdfText(label.toUpperCase()), margin, y);
    doc.setDrawColor(223, 228, 220);
    doc.setLineWidth(0.35);
    doc.line(margin, y + 2.5, pageWidth - margin, y + 2.5);
    y += 9;
  };

  const addField = (label, value) => {
    const lines = doc.splitTextToSize(safe(value), contentWidth);
    const fieldHeight = 3.5 + lines.length * 4.8 + 4.2;
    ensureSpace(fieldHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(cleanPdfText(label.toUpperCase()), margin, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...ink);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 4.2;
  };

  addSection("01 · Expéditeur");
  addField("Mission", maskValue(data.sender.mission, "missions"));
  addField("Service", maskValue(data.sender.service, "missions"));
  addField("Référent responsable", maskValue(`${data.sender.name} — ${data.sender.role}`, "contacts"));
  addField("Téléphone", maskValue(data.sender.phone, "contacts"));
  addField("Courriel professionnel", maskValue(data.sender.email, "contacts"));

  addSection("02 · Destinataire");
  addField("Mission de destination", maskValue(data.recipient.mission, "missions"));
  if (data.recipient.service) addField("Service destinataire", maskValue(data.recipient.service, "missions"));
  addField("Contact autorisé", maskValue(`${data.recipient.name} — ${data.recipient.role}`, "contacts"));
  addField("Téléphone", maskValue(data.recipient.phone, "contacts"));
  addField("Courriel professionnel", maskValue(data.recipient.email, "contacts"));
  addField("Autorisation de réception", data.recipient.authorized ? "Confirmée par le déclarant" : "Non confirmée");

  addSection("03 · Contenu général");
  addField("Nature du pli", maskValue(data.content.nature, "content"));
  addField("Nombre de pièces", maskValue(data.content.pieces, "content"));
  addField("Poids estimé", maskValue(data.content.weight ? `${data.content.weight.replace(".", ",")} kg` : "Non indiqué", "content"));
  if (data.content.note) addField("Précision non sensible", maskValue(data.content.note, "content"));

  addSection("04 · Confidentialité");
  addField("Niveau d'accès choisi", data.confidentiality.level);
  if (data.confidentiality.code) addField("Code de classification non secret", maskValue(data.confidentiality.code, "code"));
  addField("Règles de masquage appliquées", maskLabels(masks).join(", ") || "Aucun masquage sélectionné");

  addSection("05 · Transport et enlèvement");
  addField("Mode d'acheminement", maskValue(data.transport.mode, "transport"));
  if (data.transport.date) addField("Date prévue", maskValue(formatDate(data.transport.date), "transport"));
  addField("Créneau", maskValue(data.transport.window, "transport"));
  if (data.transport.note) addField("Note logistique non sensible", maskValue(data.transport.note, "transport"));

  addSection("06 · Validation et signature");
  addField("Signataire déclaré", `${data.signatory.name} — ${data.signatory.role}`);
  addField("Mode de signature", data.signatory.mode === "draw" ? "Signature dessinée dans le navigateur (non certifiée)" : "Signature manuscrite à apposer après impression");
  ensureSpace(35);
  const signatureBoxY = y;
  doc.setDrawColor(207, 216, 204);
  doc.setFillColor(250, 250, 246);
  doc.roundedRect(margin, signatureBoxY, contentWidth, 29, 1.5, 1.5, "FD");
  if (data.signatory.mode === "draw" && hasSignature) {
    doc.addImage(signatureCanvas.toDataURL("image/png"), "PNG", margin + 5, signatureBoxY + 3, 78, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("Signature dessinée - non certifiée", margin + 89, signatureBoxY + 12);
  } else {
    doc.setDrawColor(115, 128, 115);
    doc.line(margin + 6, signatureBoxY + 19, margin + 95, signatureBoxY + 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("Signature manuscrite après impression", margin + 6, signatureBoxY + 24);
  }
  y += 34;

  const notice = "MAQUETTE DE DEMONSTRATION - Document genere sur cet appareil, sans transmission. N'est pas un bordereau officiel, une habilitation ou une signature electronique certifiee. Les niveaux et codes de classification saisis ici ne sont que des reperes de maquette. Ne pas utiliser pour des informations classifiees ou des secrets.";
  const noticeLines = doc.splitTextToSize(cleanPdfText(notice), contentWidth - 10);
  const noticeHeight = noticeLines.length * 4 + 9;
  ensureSpace(noticeHeight + 2);
  doc.setFillColor(246, 247, 242);
  doc.setDrawColor(224, 231, 220);
  doc.roundedRect(margin, y, contentWidth, noticeHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(92, 108, 95);
  doc.text(noticeLines, margin + 5, y + 6);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(229, 231, 225);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("Maquette locale - vérifier les règles de diffusion avant toute utilisation", margin, pageHeight - 8);
    doc.text(`${page} / ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const date = localDateString();
  doc.save(`bordereau-transfert-${date}.pdf`);
}

function setupSignaturePad() {
  signatureContext.lineWidth = 4;
  signatureContext.lineCap = "round";
  signatureContext.lineJoin = "round";
  signatureContext.strokeStyle = "#264d40";

  const pointFromEvent = (event) => {
    const rect = signatureCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * signatureCanvas.width,
      y: ((event.clientY - rect.top) / rect.height) * signatureCanvas.height,
    };
  };

  signatureCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    isDrawingSignature = true;
    signatureCanvas.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    signatureContext.beginPath();
    signatureContext.moveTo(point.x, point.y);
    signatureContext.lineTo(point.x + 0.1, point.y + 0.1);
    signatureContext.stroke();
    hasSignature = true;
    resetAuthorityConfirmation();
  });

  signatureCanvas.addEventListener("pointermove", (event) => {
    if (!isDrawingSignature) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    signatureContext.lineTo(point.x, point.y);
    signatureContext.stroke();
  });

  const stopDrawing = () => {
    isDrawingSignature = false;
    signatureContext.closePath();
  };
  signatureCanvas.addEventListener("pointerup", stopDrawing);
  signatureCanvas.addEventListener("pointercancel", stopDrawing);
  signatureCanvas.addEventListener("lostpointercapture", stopDrawing);
}

form.addEventListener("submit", (event) => event.preventDefault());

form.addEventListener("click", (event) => {
  const nextButton = event.target.closest("[data-next]");
  const backButton = event.target.closest("[data-back]");
  const editButton = event.target.closest("[data-edit-step]");

  if (nextButton) {
    if (!validateStep(currentStep)) return;
    if (currentStep === 4) populateReview();
    activateStep(Math.min(currentStep + 1, totalSteps - 1), { scroll: true });
  }
  if (backButton) activateStep(Math.max(currentStep - 1, 0), { scroll: true });
  if (editButton) activateStep(Number(editButton.dataset.editStep), { scroll: true });
});

form.addEventListener("input", (event) => {
  const { id } = event.target;
  if (fieldIds.includes(id)) {
    clearFieldError(id);
    resetAuthorityConfirmation();
  }
  if (["sender-phone", "sender-email"].includes(id)) clearContactGroupError("sender");
  if (["recipient-phone", "recipient-email"].includes(id)) clearContactGroupError("recipient");

  if (id === "recipient-authorized" && event.target.checked) {
    event.target.removeAttribute("aria-invalid");
    const error = document.getElementById("recipient-authorized-error");
    error.hidden = true;
    error.textContent = "";
  }
  if (id === "attest-authority" && event.target.checked) {
    event.target.removeAttribute("aria-invalid");
    const error = document.getElementById("attest-authority-error");
    error.hidden = true;
    error.textContent = "";
  }
});

form.addEventListener("change", (event) => {
  const { id } = event.target;
  if (fieldIds.includes(id) || maskIds.includes(id)) {
    clearFieldError(id);
    resetAuthorityConfirmation();
  }
  if (["sender-phone", "sender-email"].includes(id)) clearContactGroupError("sender");
  if (["recipient-phone", "recipient-email"].includes(id)) clearContactGroupError("recipient");
  if (id === "recipient-authorized" && event.target.checked) {
    event.target.removeAttribute("aria-invalid");
    const error = document.getElementById("recipient-authorized-error");
    error.hidden = true;
    error.textContent = "";
  }
  if (id === "attest-authority" && event.target.checked) {
    event.target.removeAttribute("aria-invalid");
    const error = document.getElementById("attest-authority-error");
    error.hidden = true;
    error.textContent = "";
  }
  if (id === "mask-missions" || id === "mask-contacts" || id === "mask-content" || id === "mask-transport" || id === "mask-code") {
    resetAuthorityConfirmation();
  }
});

document.querySelectorAll('input[name="signature-mode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    signatureWrap.hidden = radio.value !== "draw";
    if (radio.value === "print") {
      signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      hasSignature = false;
    }
    resetAuthorityConfirmation();
    if (radio.value === "draw") signatureCanvas.focus();
  });
});

document.getElementById("clear-signature").addEventListener("click", () => {
  signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  hasSignature = false;
  resetAuthorityConfirmation();
});

setupSignaturePad();

document.getElementById("download-pdf").addEventListener("click", () => {
  if (!validateStep(5)) return;
  downloadStatus.classList.remove("is-error");
  try {
    makePdf();
    downloadStatus.textContent = "Le bordereau A4 a été généré sur cet appareil. Les masquages sélectionnés sont appliqués à l’export.";
  } catch (error) {
    console.error("Impossible de générer le PDF :", error);
    downloadStatus.classList.add("is-error");
    downloadStatus.textContent = "L’export PDF a échoué. Réessayez ou vérifiez les paramètres de votre navigateur.";
  }
});

document.getElementById("current-year").textContent = String(new Date().getFullYear());
