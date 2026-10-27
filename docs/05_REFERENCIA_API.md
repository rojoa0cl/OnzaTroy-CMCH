# 📡 Referencia de la API RESTful
## Especificación de Endpoints — ExcelQR Express Web

---

### 1. Estado y Diagnóstico

#### `GET /api/status`
Verifica la disponibilidad y salud del servicio.

* **Cabeceras:** Ninguna requerida.
* **Respuesta Exitosa (200 OK):**
```json
{
  "app": "ExcelQR Express Web",
  "status": "online",
  "version": "6.4.2"
}
```

---

### 2. Gestión de Folios Persistentes

#### `GET /api/folios`
Recupera los últimos folios guardados en la configuración del servidor.

* **Respuesta Exitosa (200 OK):**
```json
{
  "inicial": "1000",
  "final": "1999"
}
```

#### `POST /api/folios`
Almacena un nuevo rango de folios en la persistencia local (`config.json`).

* **Content-Type:** `application/json`
* **Cuerpo de la petición:**
```json
{
  "inicial": "2000",
  "final": "2999"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "folios": {
    "inicial": "2000",
    "final": "2999"
  }
}
```

---

### 3. Operaciones de Archivos CSV

#### `POST /api/csv/inspect`
Analiza previamente un archivo CSV antes de procesarlo, informando filas totales y nombres de columnas.

* **Content-Type:** `multipart/form-data`
* **Parámetros:**
  * `file`: Archivo binario CSV.
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "filename": "code.csv",
  "total_rows": 1000,
  "columns": ["extended_id", "serial_number", "full_url"]
}
```

---

#### `POST /api/csv/scantrust`
Genera el archivo transformado `code [ScanTrust].csv` delimitado por punto y coma (`;`).

* **Content-Type:** `multipart/form-data`
* **Parámetros:**
  * `file`: Archivo binario CSV (`code.csv`).
  * `folio_inicial`: Entero (string numérico).
  * `folio_final`: Entero (string numérico).
* **Respuesta Exitosa (200 OK):**
  * `Content-Type`: `text/csv`
  * `Content-Disposition`: `attachment; filename="code [ScanTrust].csv"`
  * Contenido: Archivo binario delimitado por `;`.
* **Respuestas de Error:**
  * `400 Bad Request`: `{"error": "La cantidad de códigos en el CSV no coincide con el rango de folios."}`

---

#### `POST /api/csv/ricoh`
Genera el archivo transformado `files [Ricoh].csv` forzando extensión `.tiff`.

* **Content-Type:** `multipart/form-data`
* **Parámetros:**
  * `file`: Archivo binario CSV (`files.csv`).
  * `folio_inicial`: Entero.
  * `folio_final`: Entero.
* **Respuesta Exitosa (200 OK):**
  * `Content-Type`: `text/csv`
  * `Content-Disposition`: `attachment; filename="files [Ricoh].csv"`

---

#### `POST /api/csv/cc`
Genera el archivo transformado `code [CC].csv` con URL completa para control de calidad.

* **Content-Type:** `multipart/form-data`
* **Parámetros:**
  * `file`: Archivo binario CSV (`code.csv`).
  * `folio_inicial`: Entero.
  * `folio_final`: Entero.
* **Respuesta Exitosa (200 OK):**
  * `Content-Type`: `text/csv`
  * `Content-Disposition`: `attachment; filename="code [CC].csv"`

---

### 4. Procesamiento de Imágenes

#### `POST /api/images/process-upload`
Recibe imágenes individuales o un contenedor `.zip`, las convierte a formato TIFF sin compresión y devuelve un archivo ZIP descargable.

* **Content-Type:** `multipart/form-data`
* **Parámetros:**
  * `files`: Uno o múltiples archivos de imagen o un archivo comprimido `.zip`.
* **Respuesta Exitosa (200 OK):**
  * `Content-Type`: `application/zip`
  * `Content-Disposition`: `attachment; filename="imagenes_procesadas_tiff.zip"`

---

#### `POST /api/images/process-local`
Procesa una carpeta existente en el disco local de la máquina del servidor, generando la subcarpeta `_descomprimido`.

* **Content-Type:** `application/json`
* **Cuerpo de la petición:**
```json
{
  "folder_path": "C:\\andres\\imagenes_lote_1"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "processed_count": 1250,
  "folder_origin": "C:\\andres\\imagenes_lote_1",
  "output_folder": "C:\\andres\\imagenes_lote_1\\imagenes_lote_1_descomprimido",
  "errors": []
}
```
* **Respuestas de Error:**
  * `400 Bad Request`: `{"error": "La carpeta '...' no existe en este equipo."}`
