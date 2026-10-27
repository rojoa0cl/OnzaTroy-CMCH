# 🛠️ Guía de Despliegue, Operación y Mantenimiento
## Sistema ExcelQR Express Web

---

### 1. Requisitos del Entorno de Ejecución

* **Sistema Operativo:** Windows 10/11, Windows Server 2019/2022 o Linux (Ubuntu 20.04+).
* **Intérprete:** Python 3.10 o superior (recomendado Python 3.11/3.12/3.13).
* **Control de Versiones:** Git 2.30+.
* **Navegador Compatible:** Google Chrome, Microsoft Edge, Mozilla Firefox o cualquier navegador basado en Chromium.

---

### 2. Procedimiento de Instalación Inicial

#### Paso 1: Clonar el Repositorio
Abra una ventana de comandos en la carpeta donde residen las aplicaciones de producción (por ejemplo `C:\andres`):
```bash
git clone https://github.com/rojoa0cl/3_Placa_B2C.git ExcelQr_Express_Web
cd ExcelQr_Express_Web
```

#### Paso 2: Instalación de Dependencias
Ejecute la instalación de librerías mediante pip:
```bash
pip install -r requirements.txt
```

#### Paso 3: Verificación de Dependencias
Compruebe que los módulos críticos estén operativos:
```bash
python -c "import flask, pandas, PIL; print('Módulos verificados exitosamente')"
```

---

### 3. Modos de Ejecución

#### Modo 1: Doble Clic (Operador Estándar)
Simplemente ejecute el archivo `iniciar_app.bat`. Se abrirá una ventana de consola informando que el servicio está escuchando en el puerto `5055`.

#### Modo 2: Integrado al Hub de Aplicaciones
La aplicación ya se encuentra configurada en el archivo maestro de configuración del Hub (`C:\andres\Hub_Apps\apps_config.json`):
```json
{
  "id": "excelqr",
  "name": "ExcelQR Express Web",
  "description": "Conversor TIFF para imprenta y CSV (ScanTrust, Ricoh, CC)",
  "category": "Producción",
  "icon": "fa-solid fa-qrcode",
  "type": "service",
  "target": "http://localhost:5055/",
  "local_path": "",
  "port": 5055,
  "cwd": "C:\\andres\\ExcelQr_Express_Web",
  "cmd": "python app.py"
}
```
Al hacer clic en el Hub, el sistema verificará si el puerto `5055` está abierto; si no lo está, lo levantará en segundo plano de manera transparente.

---

### 4. Ciclo de Vida y Flujo Git

Para mantener el código ordenado y sincronizado con GitHub, se incluye el script de automatización `subir_a_github.bat`.

#### Flujo de Actualización:
1. Realice los cambios necesarios en el código o estilos.
2. Haga doble clic en `subir_a_github.bat`.
3. El script ejecutará automáticamente:
   - `git add .`
   - `git commit -m "Update ExcelQR Express Web"`
   - `git push origin main`
4. La ventana confirmará el envío exitoso al repositorio remoto en GitHub.

---

### 5. Resolución de Incidencias Técnicas

#### 5.1. El puerto 5055 se encuentra ocupado
Si al iniciar la aplicación recibe un error de tipo `Address already in use`:
* Abra PowerShell como Administrador e identifique el proceso:
  ```powershell
  Get-NetTCPConnection -LocalPort 5055 | Select-Object OwningProcess
  ```
* Finalice el proceso colgado:
  ```powershell
  Stop-Process -Id <PID> -Force
  ```

#### 5.2. Error de permisos en carpetas locales
Si el Modo Local no puede crear la carpeta `_descomprimido`:
* Asegúrese de que el usuario de Windows tenga permisos de escritura en la carpeta donde residen las imágenes.
* Evite procesar rutas protegidas del sistema (como `C:\Program Files`).
