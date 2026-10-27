# 📘 Manual de Usuario y Guía de Operación
## Sistema ExcelQR Express Web (v6.4.2)

---

### 1. Introducción y Propósito
El software **ExcelQR Express Web** es una herramienta especializada diseñada para el procesamiento masivo de datos de producción e imágenes de alta fidelidad para sistemas de impresión industrial (máquinas RIP, Ricoh, plataformas ScanTrust y controles de calidad).

Su objetivo principal es automatizar dos tareas críticas:
1. **Conversión y estandarización de imágenes:** Transformar imágenes heterogéneas a formato **TIFF sin compresión (raw)** con extensión estricta `.tiff` y espacio de color RGB.
2. **Generación de archivos CSV con folios correlativos:** Mapear datos de lotes y asociar números de serie/folios consecutivos para los sistemas de producción **ScanTrust**, **Ricoh** y **Control de Calidad (CC)**.

---

### 2. Acceso a la Aplicación

#### Opción A: Desde el Portal Central (Hub de Aplicaciones)
1. Inicie su navegador web e ingrese a `http://127.0.0.1:8000`.
2. En la sección **Producción**, ubique la tarjeta **ExcelQR Express Web**.
3. Haga clic sobre ella; el servicio se iniciará automáticamente y se abrirá en su navegador en `http://localhost:5055`.

#### Opción B: Inicio Local Directo
1. Vaya a la carpeta del programa (`C:\andres\ExcelQr_Express_Web`).
2. Haga doble clic sobre el archivo ejecutable `iniciar_app.bat`.
3. Ingrese en su navegador a: `http://localhost:5055`.

---

### 3. Descripción de la Interfaz

La pantalla principal se compone de cuatro zonas fundamentales:
1. **Encabezado superior:** Indicador de versión, estado del servicio (online en puerto 5055) y acceso al repositorio en GitHub.
2. **Barra de Folios Compartida (Memoria Activa):** Permite ingresar el rango de folios (`Folio Inicial` y `Folio Final`). Los folios se recuerdan de forma permanente; no es necesario volver a escribirlos al cambiar entre tareas.
3. **Pestañas de Trabajo:**
   - 📄 **Códigos CSV:** Operaciones para ScanTrust, Ricoh y Control de Calidad.
   - 📷 **Procesamiento de Imágenes:** Conversor masivo a TIFF estándar de imprenta.
   - 📖 **Instructivo & Guía:** Resumen rápido de reglas y compatibilidad.
4. **Consola de Registro y Estado:** Muestra en tiempo real las operaciones, archivos generados, errores detectados y confirmaciones de descarga.

---

### 4. Guía Operativa Paso a Paso

#### 4.1. Configuración del Rango de Folios
1. En la parte superior de la pantalla, ingrese el **Folio Inicial** (por ejemplo: `1000`).
2. Ingrese el **Folio Final** (por ejemplo: `1999`).
3. Verifique el indicador a la derecha que calcula automáticamente la cantidad de códigos resultantes (`1,000 códigos`).
4. Si desea forzar la persistencia, haga clic en **Sincronizar**.

---

#### 4.2. Generación de CSV para ScanTrust
* **Archivo de entrada:** Requiere `code.csv` (debe contener la columna `extended_id`).
* **Delimitador de salida:** Punto y coma (`;`).
* **Columnas de salida:** `extended_id;serial_number`.

**Pasos:**
1. Seleccione la pestaña **Códigos CSV**.
2. En la tarjeta **ScanTrust**, arrastre el archivo `code.csv` hacia la zona punteada (o haga clic sobre ella para buscarlo en su explorador).
3. El sistema verificará el archivo y mostrará el número de registros detectados.
4. Si la cantidad de códigos coincide con el rango de folios, el botón **Generar code [ScanTrust].csv** se habilitará.
5. Presione el botón. El archivo transformado se descargará automáticamente a su carpeta de Descargas.

---

#### 4.3. Generación de CSV para Impresoras Ricoh
* **Archivo de entrada:** Requiere `files.csv` (debe contener la columna `image_file`).
* **Delimitador de salida:** Punto y coma (`;`).
* **Columnas de salida:** `Folio;Nombre de archivo`.
* **Regla especial:** Todos los nombres de archivo son convertidos automáticamente con terminación estricta `.tiff` (ej: `001.tiff`) para compatibilidad con la máquina RIP.

**Pasos:**
1. En la tarjeta **Ricoh**, arrastre o seleccione el archivo `files.csv`.
2. Verifique la cantidad de registros detectados.
3. Haga clic en **Generar files [Ricoh].csv**.
4. El archivo generado se descargará inmediatamente.

---

#### 4.4. Generación de CSV para Control de Calidad (CC)
* **Archivo de entrada:** Requiere `code.csv` (debe contener las columnas `extended_id` y `full_url`).
* **Delimitador de salida:** Coma (`,`).
* **Columnas de salida:** `extended_id,serial_number,full_url`.

**Pasos:**
1. En la tarjeta **Control de Calidad (CC)**, arrastre o seleccione el archivo `code.csv`.
2. Verifique el número de registros detectados.
3. Haga clic en **Generar code [CC].csv**.
4. El archivo generado se descargará inmediatamente.

---

#### 4.5. Conversión de Imágenes a Formato TIFF de Imprenta

Existen dos modalidades según el tamaño del lote:

##### Modalidad A: Subida Web / Archivo ZIP (Ideal para lotes pequeños o uso remoto)
1. Seleccione la pestaña **Procesamiento de Imágenes (TIFF)**.
2. Arrastre sus imágenes individuales (`.jpg`, `.png`, `.bmp`, `.webp`) o un archivo comprimido `.zip` que contenga las imágenes.
3. El sistema listará la cantidad de archivos recibidos.
4. Haga clic en **Convertir a TIFF y Descargar ZIP**.
5. Al finalizar el proceso, se descargará un archivo `imagenes_procesadas_tiff.zip` con todas las imágenes estandarizadas en TIFF sin compresión y en espacio de color RGB.

##### Modalidad B: Modo Local Directo (Recomendado para lotes grandes de producción)
1. En la misma pestaña, ubique la tarjeta **Modo Local: Procesar Carpeta en este Equipo**.
2. Escriba la ruta completa de la carpeta donde están las fotos (ej: `C:\andres\imagenes_lote_5`).
3. Presione el botón **Procesar Carpeta en Disco**.
4. El sistema creará una subcarpeta llamada `[nombre_carpeta]_descomprimido` conteniendo todas las imágenes procesadas sin saturar la memoria del navegador.

---

### 5. Manejo de Errores Comunes y Soluciones

| Error Detectado | Causa Posible | Solución |
|---|---|---|
| **"La cantidad de códigos no coincide con el rango de folios"** | El rango ingresado (ej: 1000 a 1999 = 1000) no coincide con las filas del CSV (ej: 950 filas). | Corrija el folio final o verifique si el archivo CSV contiene registros faltantes. |
| **"Columna 'extended_id' no encontrada"** | Se intentó procesar en ScanTrust o CC un archivo equivocado (ej: `files.csv`). | Asegúrese de subir el archivo `code.csv` correspondiente. |
| **"Columna 'image_file' no encontrada"** | Se intentó procesar en Ricoh un archivo `code.csv` en vez de `files.csv`. | Suba el archivo `files.csv`. |
| **"Error de conexión en puerto 5055"** | El servicio backend no se encuentra iniciado. | Ejecute `iniciar_app.bat` o inicie la aplicación desde el Hub de Aplicaciones. |
