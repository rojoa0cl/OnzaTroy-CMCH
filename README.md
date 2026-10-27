# ⚡ ExcelQR Express Web

Aplicación web para el procesamiento de imágenes en formato TIFF de alta calidad sin compresión (estándar imprenta) y transformación masiva de archivos CSV para **ScanTrust**, **Ricoh** y **Control de Calidad (CC)** con control de folios consecutivos.

---

## 🚀 Características Principales

1. **📷 Procesamiento de Imágenes:**
   - Convierte imágenes masivamente a formato **TIFF sin compresión** (`.tiff` estricto con RGB).
   - **Modo Web:** Sube un archivo comprimido `.zip` o múltiples imágenes y descarga el paquete procesado con un clic.
   - **Modo Local:** Procesa directamente carpetas del equipo local generando la subcarpeta `_descomprimido`.

2. **📄 Códigos CSV con Folios Consecutivos:**
   - **ScanTrust (`code.csv`):** Genera `code [ScanTrust].csv` delimitado por punto y coma (`;`).
   - **Ricoh (`files.csv`):** Genera `files [Ricoh].csv` delimitado por punto y coma (`;`), asegurando nombres terminados en `.tiff`.
   - **Control de Calidad (`code.csv`):** Genera `code [CC].csv` delimitado por comas (`,`).
   - **Memoria de Folios:** Recuerda los últimos folios utilizados para no tener que escribirlos repetidamente.
   - **Validación automática:** Verifica que la cantidad de folios coincida exactamente con la cantidad de filas del CSV.

3. **💻 Portabilidad:**
   - Diseñado para funcionar de manera local o en red.
   - Integrado con el **Hub de Aplicaciones** en el puerto `5055`.

---

## 📦 Requisitos e Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/rojoa0cl/ExcelQr_Express_Web.git
cd ExcelQr_Express_Web
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Iniciar la aplicación
- En Windows: Simplemente haz doble clic en `iniciar_app.bat`.
- O por terminal:
```bash
python app.py
```
Abre tu navegador en: [http://localhost:5055](http://localhost:5055)

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Python 3, Flask
- **Procesamiento de Datos:** pandas
- **Motor de Imágenes:** Pillow (PIL)
- **Frontend:** HTML5, CSS3 moderno (Variables CSS, responsive), JavaScript Vanilla, Font Awesome 6
