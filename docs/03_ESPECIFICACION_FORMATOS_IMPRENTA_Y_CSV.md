# 📐 Especificación Técnica de Formatos de Imprenta y Archivos CSV
## Estándares de Producción Industrial

---

### 1. Especificación del Formato de Imagen TIFF para Imprenta

Los sistemas de impresión digital de alta velocidad (como prensas digitales Ricoh y procesadores RIP) son extremadamente estrictos respecto a los metadatos y el encapsulamiento de archivos binarios.

#### 1.1. Atributos Técnicos Requeridos

| Parámetro | Valor Específico | Justificación Técnica |
|---|---|---|
| **Formato contenedor** | `TIFF` (Tagged Image File Format) | Estándar de la industria gráfica que preserva dimensiones físicas y píxeles exactos. |
| **Algoritmo de compresión** | `None` (Sin compresión / RAW) | Los RIPs de producción fallan al descomprimir algoritmos complejos (como LZW, ZIP o JPEG dentro de TIFF) bajo cargas continuas. |
| **Extensión de archivo** | `.tiff` (estricta, doble 'f') | El software de imposición e impresión automatizada rechaza extensiones `.tif` (de una sola 'f') o extensiones originales alteradas. |
| **Espacio de color** | `RGB` (24 bits: 8 bits por canal) | Si la imagen original contiene canal de transparencia (`RGBA`), los motores RIP pueden interpretar el fondo transparente como negro sólido. La conversión a `RGB` elimina este riesgo. |
| **Manejo de Paletas** | Conversión de `P` a `RGB` | Las imágenes indexadas generan discrepancias en la separación de tintas. |

---

### 2. Especificación de Transformaciones CSV

A continuación se detalla la estructura canónica requerida por cada sistema receptor:

---

#### 2.1. Transformación ScanTrust

* **Propósito:** Ingesta de identificadores únicos para validación de autenticidad en la nube de ScanTrust.
* **Archivo origen esperado:** `code.csv`
* **Archivo destino generado:** `code [ScanTrust].csv`
* **Delimitador de campos:** `;` (Punto y coma)
* **Codificación:** UTF-8 sin BOM

##### Matriz de Mapeo de Columnas:
| Columna Salida | Tipo de Dato | Origen / Regla de Cálculo |
|---|---|---|
| `extended_id` | Alfanumérico / String | Tomado textualmente de la columna `extended_id` del archivo origen. |
| `serial_number` | Numérico / Entero | Corresponde al número de folio correlativo consecutivo ($i$). |

##### Ejemplo de Salida:
```csv
extended_id;serial_number
ST_0982348234ABC;10001
ST_0982348235DEF;10002
ST_0982348236GHI;10003
```

---

#### 2.2. Transformación Ricoh

* **Propósito:** Archivo de datos variables para alimentación de la cola de impresión e imposición en prensas Ricoh.
* **Archivo origen esperado:** `files.csv`
* **Archivo destino generado:** `files [Ricoh].csv`
* **Delimitador de campos:** `;` (Punto y coma)
* **Codificación:** UTF-8 sin BOM

##### Matriz de Mapeo de Columnas:
| Columna Salida | Tipo de Dato | Origen / Regla de Cálculo |
|---|---|---|
| `Folio` | Numérico / Entero | Corresponde al número de folio correlativo consecutivo ($i$). |
| `Nombre de archivo` | String (Ruta limpia) | Se extrae la última sección de la columna `image_file`, se remueven directorios intermedios (`/` o `\`) y se sustituye obligatoriamente la extensión original por `.tiff`. |

##### Regla de Transformación de Nombre:
$$\text{image\_file}: \quad \texttt{"/var/data/lote_01/qr_code_001.jpg"} \quad \longrightarrow \quad \texttt{"qr_code_001.tiff"}$$

##### Ejemplo de Salida:
```csv
Folio;Nombre de archivo
10001;qr_code_001.tiff
10002;qr_code_002.tiff
10003;qr_code_003.tiff
```

---

#### 2.3. Transformación Control de Calidad (CC)

* **Propósito:** Archivo maestro de inspección posimpresión, lectura con cámaras ópticas y verificación de URLs de redirección.
* **Archivo origen esperado:** `code.csv`
* **Archivo destino generado:** `code [CC].csv`
* **Delimitador de campos:** `,` (Coma simple)
* **Codificación:** UTF-8 sin BOM

##### Matriz de Mapeo de Columnas:
| Columna Salida | Tipo de Dato | Origen / Regla de Cálculo |
|---|---|---|
| `extended_id` | Alfanumérico | Tomado textualmente de la columna `extended_id`. |
| `serial_number` | Numérico / Entero | Corresponde al número de folio correlativo consecutivo ($i$). |
| `full_url` | String (URL) | URL completa con protocolo y parámetros de consulta para verificación de escaneo óptico. |

##### Ejemplo de Salida:
```csv
extended_id,serial_number,full_url
ST_0982348234ABC,10001,https://verify.scantrust.com/v/ST_0982348234ABC
ST_0982348235DEF,10002,https://verify.scantrust.com/v/ST_0982348235DEF
ST_0982348236GHI,10003,https://verify.scantrust.com/v/ST_0982348236GHI
```

---

### 3. Matriz de Compatibilidad y Resumen de Reglas

| Operación | Archivo Entrada | Delimitador Salida | Extensión de Imágenes | Columnas Requeridas |
|---|---|:---:|:---:|---|
| **ScanTrust** | `code.csv` | `;` | N/A | `extended_id` |
| **Ricoh** | `files.csv` | `;` | `.tiff` | `image_file` |
| **Control Calidad** | `code.csv` | `,` | N/A | `extended_id`, `full_url` |
| **Conversión TIFF** | `.zip` / `.jpg` / etc. | N/A | `.tiff` (RGB, sin compresión) | N/A |
