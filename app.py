import os
import io
import json
import zipfile
import tempfile
import shutil
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
import pandas as pd
from PIL import Image

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB max upload

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

# ── Configuración persistente (memoria de folios) ─────────────────────────

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"folios": {"inicial": "", "final": ""}}

def save_config(data):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False

# ── Rutas Principales ───────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status", methods=["GET"])
def api_status():
    return jsonify({"status": "online", "app": "ExcelQR Express Web", "version": "6.4.2"})

@app.route("/api/folios", methods=["GET", "POST"])
def api_folios():
    if request.method == "POST":
        payload = request.get_json() or {}
        inicial = str(payload.get("inicial", "")).strip()
        final = str(payload.get("final", "")).strip()
        cfg = load_config()
        cfg["folios"] = {"inicial": inicial, "final": final}
        save_config(cfg)
        return jsonify({"success": True, "folios": cfg["folios"]})
    else:
        cfg = load_config()
        return jsonify(cfg.get("folios", {"inicial": "", "final": ""}))

# ── Inspección de CSV ───────────────────────────────────────────────────

@app.route("/api/csv/inspect", methods=["POST"])
def inspect_csv():
    if "file" not in request.files:
        return jsonify({"error": "No se recibió ningún archivo CSV."}), 400
    
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Archivo no seleccionado."}), 400
    
    try:
        content = file.read()
        df = pd.read_csv(io.BytesIO(content))
        total_rows = len(df)
        columns = list(df.columns)
        return jsonify({
            "success": True,
            "filename": file.filename,
            "total_rows": total_rows,
            "columns": columns
        })
    except Exception as e:
        return jsonify({"error": f"Error al leer el archivo CSV: {str(e)}"}), 400

# ── Transformación de CSV ───────────────────────────────────────────────

@app.route("/api/csv/scantrust", methods=["POST"])
def process_scantrust():
    file = request.files.get("file")
    fi_str = request.form.get("folio_inicial", "").strip()
    ff_str = request.form.get("folio_final", "").strip()

    if not file or not fi_str or not ff_str:
        return jsonify({"error": "Faltan parámetros requeridos (archivo, folio inicial y final)."}), 400

    try:
        fi, ff = int(fi_str), int(ff_str)
        if fi > ff:
            return jsonify({"error": "El folio inicial no puede ser mayor que el folio final."}), 400

        df = pd.read_csv(file)
        expected_rows = ff - fi + 1
        if len(df) != expected_rows:
            return jsonify({
                "error": f"La cantidad de códigos en el CSV ({len(df)}) no coincide con el rango de folios ({expected_rows})."
            }), 400

        if "extended_id" not in df.columns:
            return jsonify({"error": "Columna 'extended_id' no encontrada en el CSV (¿Seguro que es code.csv?)."}), 400

        rows = []
        for i in range(fi, ff + 1):
            idx = i - fi
            rows.append([df["extended_id"].iloc[idx], str(i)])

        out_df = pd.DataFrame(rows, columns=["extended_id", "serial_number"])
        
        # Guardar últimos folios usados
        cfg = load_config()
        cfg["folios"] = {"inicial": str(fi), "final": str(ff)}
        save_config(cfg)

        csv_buffer = io.StringIO()
        out_df.to_csv(csv_buffer, index=False, sep=";")
        csv_bytes = csv_buffer.getvalue().encode("utf-8")

        return send_file(
            io.BytesIO(csv_bytes),
            mimetype="text/csv",
            as_attachment=True,
            download_name="code [ScanTrust].csv"
        )
    except Exception as e:
        return jsonify({"error": f"Error al procesar ScanTrust: {str(e)}"}), 500

@app.route("/api/csv/ricoh", methods=["POST"])
def process_ricoh():
    file = request.files.get("file")
    fi_str = request.form.get("folio_inicial", "").strip()
    ff_str = request.form.get("folio_final", "").strip()

    if not file or not fi_str or not ff_str:
        return jsonify({"error": "Faltan parámetros requeridos (archivo, folio inicial y final)."}), 400

    try:
        fi, ff = int(fi_str), int(ff_str)
        if fi > ff:
            return jsonify({"error": "El folio inicial no puede ser mayor que el folio final."}), 400

        df = pd.read_csv(file)
        expected_rows = ff - fi + 1
        if len(df) != expected_rows:
            return jsonify({
                "error": f"La cantidad de códigos en el CSV ({len(df)}) no coincide con el rango de folios ({expected_rows})."
            }), 400

        if "image_file" not in df.columns:
            return jsonify({"error": "Columna 'image_file' no encontrada en el CSV (¿Seguro que es files.csv?)."}), 400

        rows = []
        for i in range(fi, ff + 1):
            idx = i - fi
            file_parts = str(df["image_file"].iloc[idx]).split(",")
            file_name_part = file_parts[-1].split("/")[-1].split(",")[-1].strip()
            file_base, _ = os.path.splitext(file_name_part)
            # Extensión forzada estrictamente a .tiff (doble 'f' para imprenta)
            new_file_name = file_base + ".tiff"
            rows.append([str(i), new_file_name])

        out_df = pd.DataFrame(rows, columns=["Folio", "Nombre de archivo"])
        
        cfg = load_config()
        cfg["folios"] = {"inicial": str(fi), "final": str(ff)}
        save_config(cfg)

        csv_buffer = io.StringIO()
        out_df.to_csv(csv_buffer, index=False, sep=";")
        csv_bytes = csv_buffer.getvalue().encode("utf-8")

        return send_file(
            io.BytesIO(csv_bytes),
            mimetype="text/csv",
            as_attachment=True,
            download_name="files [Ricoh].csv"
        )
    except Exception as e:
        return jsonify({"error": f"Error al procesar Ricoh: {str(e)}"}), 500

@app.route("/api/csv/cc", methods=["POST"])
def process_cc():
    file = request.files.get("file")
    fi_str = request.form.get("folio_inicial", "").strip()
    ff_str = request.form.get("folio_final", "").strip()

    if not file or not fi_str or not ff_str:
        return jsonify({"error": "Faltan parámetros requeridos (archivo, folio inicial y final)."}), 400

    try:
        fi, ff = int(fi_str), int(ff_str)
        if fi > ff:
            return jsonify({"error": "El folio inicial no puede ser mayor que el folio final."}), 400

        df = pd.read_csv(file)
        expected_rows = ff - fi + 1
        if len(df) != expected_rows:
            return jsonify({
                "error": f"La cantidad de códigos en el CSV ({len(df)}) no coincide con el rango de folios ({expected_rows})."
            }), 400

        missing = [col for col in ["extended_id", "full_url"] if col not in df.columns]
        if missing:
            return jsonify({"error": f"Columnas faltantes en el CSV: {', '.join(missing)} (¿Seguro que es code.csv?)."}), 400

        rows = []
        for i in range(fi, ff + 1):
            idx = i - fi
            rows.append([df["extended_id"].iloc[idx], i, df["full_url"].iloc[idx]])

        out_df = pd.DataFrame(rows, columns=["extended_id", "serial_number", "full_url"])
        
        cfg = load_config()
        cfg["folios"] = {"inicial": str(fi), "final": str(ff)}
        save_config(cfg)

        csv_buffer = io.StringIO()
        out_df.to_csv(csv_buffer, index=False, sep=",")
        csv_bytes = csv_buffer.getvalue().encode("utf-8")

        return send_file(
            io.BytesIO(csv_bytes),
            mimetype="text/csv",
            as_attachment=True,
            download_name="code [CC].csv"
        )
    except Exception as e:
        return jsonify({"error": f"Error al procesar Control de Calidad: {str(e)}"}), 500

# ── Procesamiento de Imágenes (Web / Upload y Local) ─────────────────────

def convert_image_to_tiff(input_stream_or_path, output_path):
    """Convierte una imagen a TIFF sin compresión con extensión .tiff estricta."""
    with Image.open(input_stream_or_path) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(output_path, "TIFF", compression=None)

@app.route("/api/images/process-upload", methods=["POST"])
def process_images_upload():
    """Recibe un archivo .zip o múltiples imágenes, las convierte a .tiff y devuelve un .zip descargable."""
    uploaded_files = request.files.getlist("files")
    if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ""):
        return jsonify({"error": "No se enviaron archivos para procesar."}), 400

    temp_dir = tempfile.mkdtemp()
    output_dir = os.path.join(temp_dir, "procesadas_tiff")
    os.makedirs(output_dir, exist_ok=True)

    try:
        count = 0
        for f in uploaded_files:
            fname = secure_filename(f.filename)
            if not fname:
                continue

            # Si es un zip, extraer y procesar su contenido
            if fname.lower().endswith(".zip"):
                zip_extract_path = os.path.join(temp_dir, "extracted")
                os.makedirs(zip_extract_path, exist_ok=True)
                with zipfile.ZipFile(f) as zf:
                    zf.extractall(zip_extract_path)

                for root, _, files in os.walk(zip_extract_path):
                    for file in files:
                        ext = os.path.splitext(file)[1].lower()
                        if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"]:
                            try:
                                base_name = os.path.splitext(file)[0]
                                out_name = base_name + ".tiff"
                                in_path = os.path.join(root, file)
                                out_path = os.path.join(output_dir, out_name)
                                convert_image_to_tiff(in_path, out_path)
                                count += 1
                            except Exception:
                                pass
            else:
                ext = os.path.splitext(fname)[1].lower()
                if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"]:
                    base_name = os.path.splitext(fname)[0]
                    out_name = base_name + ".tiff"
                    out_path = os.path.join(output_dir, out_name)
                    convert_image_to_tiff(f.stream, out_path)
                    count += 1

        if count == 0:
            return jsonify({"error": "No se encontraron imágenes válidas para convertir a TIFF."}), 400

        # Crear ZIP en memoria
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in os.listdir(output_dir):
                file_path = os.path.join(output_dir, file)
                if os.path.isfile(file_path):
                    zf.write(file_path, arcname=file)

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            mimetype="application/zip",
            as_attachment=True,
            download_name="imagenes_procesadas_tiff.zip"
        )
    except Exception as e:
        return jsonify({"error": f"Error al procesar imágenes: {str(e)}"}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route("/api/images/process-local", methods=["POST"])
def process_images_local():
    """Procesa una carpeta local en la máquina del usuario (modo de trabajo directo)."""
    payload = request.get_json() or {}
    folder_path = payload.get("folder_path", "").strip()

    if not folder_path or not os.path.exists(folder_path):
        return jsonify({"error": f"La carpeta '{folder_path}' no existe en este equipo."}), 400

    folder_name = os.path.basename(os.path.normpath(folder_path))
    output_dir_name = folder_name + "_descomprimido"
    output_folder = os.path.join(folder_path, output_dir_name)
    os.makedirs(output_folder, exist_ok=True)

    count_processed = 0
    errors = []

    for root_dir, dirs, files in os.walk(folder_path):
        dirs[:] = [d for d in dirs if not d.endswith("_descomprimido")]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"]:
                try:
                    file_base, _ = os.path.splitext(file)
                    new_file_name = file_base + ".tiff"
                    in_path = os.path.join(root_dir, file)
                    out_path = os.path.join(output_folder, new_file_name)
                    convert_image_to_tiff(in_path, out_path)
                    count_processed += 1
                except Exception as e:
                    errors.append(f"{file}: {str(e)}")

    return jsonify({
        "success": True,
        "processed_count": count_processed,
        "folder_origin": folder_path,
        "output_folder": output_folder,
        "errors": errors
    })

# ── Inicio ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5055))
    print(f"⚡ ExcelQR Express Web iniciado en http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
