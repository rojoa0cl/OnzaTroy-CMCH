document.addEventListener("DOMContentLoaded", () => {
  // ── Elementos de Navegación ──────────────────────────────────────────────
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const target = btn.dataset.tab;
      document.getElementById(target)?.classList.add("active");
    });
  });

  // ── Consola de Registro ──────────────────────────────────────────────────
  const consoleBody = document.getElementById("consoleBody");
  const btnClearConsole = document.getElementById("btnClearConsole");

  function log(message, type = "info") {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${escapeHtml(message)}`;
    consoleBody.appendChild(entry);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
  }

  btnClearConsole?.addEventListener("click", () => {
    consoleBody.innerHTML = "";
    log("Registro reiniciado.");
  });

  // ── Folios Globales y Memoria Compartida ─────────────────────────────────
  const fiInput = document.getElementById("globalFolioInicial");
  const ffInput = document.getElementById("globalFolioFinal");
  const totalDisplay = document.getElementById("globalTotalCalculado");
  const btnSyncFolios = document.getElementById("btnSyncFolios");

  function updateTotalCalculado() {
    const fi = parseInt(fiInput.value, 10);
    const ff = parseInt(ffInput.value, 10);

    if (!isNaN(fi) && !isNaN(ff) && ff >= fi) {
      const diff = ff - fi + 1;
      totalDisplay.textContent = `${diff.toLocaleString()} códigos`;
      totalDisplay.style.color = "var(--primary)";
    } else if (!isNaN(fi) && !isNaN(ff) && fi > ff) {
      totalDisplay.textContent = "Error: Inicial > Final";
      totalDisplay.style.color = "var(--accent-red)";
    } else {
      totalDisplay.textContent = "0 códigos";
      totalDisplay.style.color = "var(--text-muted)";
    }
  }

  function loadFolios() {
    // 1. Intentar desde localStorage
    const savedLocal = localStorage.getItem("excelqr_folios");
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed.inicial) fiInput.value = parsed.inicial;
        if (parsed.final) ffInput.value = parsed.final;
        updateTotalCalculado();
      } catch (e) {}
    }

    // 2. Sincronizar desde backend
    fetch("/api/folios")
      .then(res => res.json())
      .then(data => {
        if (data.inicial && !fiInput.value) fiInput.value = data.inicial;
        if (data.final && !ffInput.value) ffInput.value = data.final;
        updateTotalCalculado();
      })
      .catch(() => {});
  }

  function saveFolios(fi, ff) {
    if (!fi || !ff) return;
    localStorage.setItem("excelqr_folios", JSON.stringify({ inicial: fi, final: ff }));
    fetch("/api/folios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inicial: fi, final: ff })
    }).catch(() => {});
  }

  fiInput.addEventListener("input", () => {
    updateTotalCalculado();
    saveFolios(fiInput.value, ffInput.value);
  });

  ffInput.addEventListener("input", () => {
    updateTotalCalculado();
    saveFolios(fiInput.value, ffInput.value);
  });

  btnSyncFolios.addEventListener("click", () => {
    saveFolios(fiInput.value, ffInput.value);
    log(`Folios sincronizados: Inicial [${fiInput.value || '-'}] | Final [${ffInput.value || '-'}]`, "success");
  });

  loadFolios();

  // ── Helper Dropzones & Selección de Archivos ──────────────────────────────
  function setupDropzone(dropzoneEl, inputEl, onFileSelected) {
    dropzoneEl.addEventListener("click", () => inputEl.click());

    dropzoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzoneEl.classList.add("dragover");
    });

    dropzoneEl.addEventListener("dragleave", () => {
      dropzoneEl.classList.remove("dragover");
    });

    dropzoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzoneEl.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        inputEl.files = e.dataTransfer.files;
        onFileSelected(inputEl.files);
      }
    });

    inputEl.addEventListener("change", () => {
      if (inputEl.files.length > 0) {
        onFileSelected(inputEl.files);
      }
    });
  }

  // ── CSV Cards State ──────────────────────────────────────────────────────
  const csvCards = {
    scantrust: {
      file: null,
      rows: 0,
      dropzone: document.getElementById("dropzoneScanTrust"),
      input: document.getElementById("fileScanTrust"),
      info: document.getElementById("infoScanTrust"),
      btn: document.getElementById("btnProcessScanTrust"),
      url: "/api/csv/scantrust",
      outName: "code [ScanTrust].csv"
    },
    ricoh: {
      file: null,
      rows: 0,
      dropzone: document.getElementById("dropzoneRicoh"),
      input: document.getElementById("fileRicoh"),
      info: document.getElementById("infoRicoh"),
      btn: document.getElementById("btnProcessRicoh"),
      url: "/api/csv/ricoh",
      outName: "files [Ricoh].csv"
    },
    cc: {
      file: null,
      rows: 0,
      dropzone: document.getElementById("dropzoneCC"),
      input: document.getElementById("fileCC"),
      info: document.getElementById("infoCC"),
      btn: document.getElementById("btnProcessCC"),
      url: "/api/csv/cc",
      outName: "code [CC].csv"
    }
  };

  Object.keys(csvCards).forEach(key => {
    const card = csvCards[key];

    setupDropzone(card.dropzone, card.input, (files) => {
      const file = files[0];
      if (!file) return;

      log(`Inspeccionando archivo seleccionado: ${file.name}...`);
      const formData = new FormData();
      formData.append("file", file);

      fetch("/api/csv/inspect", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          log(`Error: ${data.error}`, "error");
          card.info.style.display = "none";
          card.btn.disabled = true;
          return;
        }

        card.file = file;
        card.rows = data.total_rows;

        // Actualizar barra de info
        card.info.style.display = "flex";
        card.info.querySelector(".name-text").textContent = file.name;
        card.info.querySelector(".count-text").textContent = data.total_rows.toLocaleString();
        card.btn.disabled = false;

        log(`Archivo listo: ${file.name} (${data.total_rows.toLocaleString()} registros detectados).`, "success");

        // Si los campos de folios están vacíos, sugerir rango automático
        const fi = parseInt(fiInput.value, 10);
        if (!isNaN(fi) && !ffInput.value) {
          ffInput.value = fi + data.total_rows - 1;
          updateTotalCalculado();
          saveFolios(fiInput.value, ffInput.value);
        }
      })
      .catch(err => {
        log(`Error al inspeccionar CSV: ${err.message}`, "error");
      });
    });

    // Acción de procesamiento
    card.btn.addEventListener("click", () => {
      if (!card.file) {
        log("Selecciona un archivo CSV primero.", "warning");
        return;
      }

      const fi = parseInt(fiInput.value, 10);
      const ff = parseInt(ffInput.value, 10);

      if (isNaN(fi) || isNaN(ff)) {
        log("Por favor ingresa folio inicial y final válidos.", "error");
        return;
      }

      if (fi > ff) {
        log("El folio inicial no puede ser mayor que el folio final.", "error");
        return;
      }

      const expected = ff - fi + 1;
      if (expected !== card.rows) {
        log(`Error de validación: El rango de folios (${expected.toLocaleString()}) no coincide con los códigos del archivo (${card.rows.toLocaleString()}).`, "error");
        alert(`La cantidad de códigos en el archivo (${card.rows}) no coincide con el rango de folios ingresado (${expected}). Verifica los folios.`);
        return;
      }

      card.btn.disabled = true;
      const originalText = card.btn.innerHTML;
      card.btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;
      log(`Generando ${card.outName}...`);

      const formData = new FormData();
      formData.append("file", card.file);
      formData.append("folio_inicial", fi);
      formData.append("folio_final", ff);

      fetch(card.url, {
        method: "POST",
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.error || "Error al procesar el archivo.");
          });
        }
        return response.blob();
      })
      .then(blob => {
        // Descargar el archivo
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = card.outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        log(`✅ ¡Éxito! Archivo ${card.outName} generado y descargado correctamente.`, "success");
      })
      .catch(err => {
        log(`Error en ${card.outName}: ${err.message}`, "error");
      })
      .finally(() => {
        card.btn.disabled = false;
        card.btn.innerHTML = originalText;
      });
    });
  });

  // ── Procesamiento de Imágenes (Modo Web) ─────────────────────────────────
  const dropzoneImages = document.getElementById("dropzoneImages");
  const fileImages = document.getElementById("fileImages");
  const infoImages = document.getElementById("infoImages");
  const imagesSelectedText = document.getElementById("imagesSelectedText");
  const btnProcessImagesUpload = document.getElementById("btnProcessImagesUpload");

  let selectedImageFiles = [];

  setupDropzone(dropzoneImages, fileImages, (files) => {
    selectedImageFiles = Array.from(files);
    if (selectedImageFiles.length > 0) {
      infoImages.style.display = "flex";
      imagesSelectedText.textContent = `${selectedImageFiles.length} archivo(s) seleccionado(s)`;
      btnProcessImagesUpload.disabled = false;
      log(`${selectedImageFiles.length} archivo(s) preparado(s) para conversión TIFF.`, "info");
    }
  });

  btnProcessImagesUpload.addEventListener("click", () => {
    if (selectedImageFiles.length === 0) return;

    btnProcessImagesUpload.disabled = true;
    const originalText = btnProcessImagesUpload.innerHTML;
    btnProcessImagesUpload.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Convirtiendo a TIFF...`;
    log("Iniciando conversión de imágenes a formato TIFF sin compresión (RAW)...", "info");

    const formData = new FormData();
    selectedImageFiles.forEach(f => {
      formData.append("files", f);
    });

    fetch("/api/images/process-upload", {
      method: "POST",
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          throw new Error(errData.error || "Error al procesar las imágenes.");
        });
      }
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "imagenes_procesadas_tiff.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      log("✅ ¡Imágenes procesadas y descargadas con éxito en formato .tiff sin compresión!", "success");
    })
    .catch(err => {
      log(`Error al procesar imágenes: ${err.message}`, "error");
    })
    .finally(() => {
      btnProcessImagesUpload.disabled = false;
      btnProcessImagesUpload.innerHTML = originalText;
    });
  });

  // ── Procesamiento de Imágenes (Modo Local) ───────────────────────────────
  const localFolderPath = document.getElementById("localFolderPath");
  const btnProcessImagesLocal = document.getElementById("btnProcessImagesLocal");

  btnProcessImagesLocal.addEventListener("click", () => {
    const folder = localFolderPath.value.trim();
    if (!folder) {
      log("Por favor ingresa la ruta de la carpeta origen.", "warning");
      return;
    }

    btnProcessImagesLocal.disabled = true;
    const originalText = btnProcessImagesLocal.innerHTML;
    btnProcessImagesLocal.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando en disco...`;
    log(`Iniciando procesamiento de carpeta local: ${folder}...`, "info");

    fetch("/api/images/process-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_path: folder })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        log(`Error: ${data.error}`, "error");
        return;
      }

      log(`✅ Carpeta procesada exitosamente.`, "success");
      log(`Total imágenes convertidas a .tiff: ${data.processed_count}`, "success");
      log(`Carpeta destino creada: ${data.output_folder}`, "info");

      if (data.errors && data.errors.length > 0) {
        log(`Advertencia: ${data.errors.length} archivos tuvieron observaciones.`, "warning");
      }
    })
    .catch(err => {
      log(`Error: ${err.message}`, "error");
    })
    .finally(() => {
      btnProcessImagesLocal.disabled = false;
      btnProcessImagesLocal.innerHTML = originalText;
    });
  });

});
