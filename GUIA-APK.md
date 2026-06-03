# 📱 VoleyTorneo — Guía de instalación y conversión a APK

## Paso 1: Probar en VS Code

1. Abre VS Code
2. Abre la carpeta `voley-torneos`
3. Instala la extensión **"Live Server"** (busca en Extensions: Ctrl+Shift+X)
4. Haz clic derecho en `index.html` → "Open with Live Server"
5. La app se abrirá en tu navegador

---

## Paso 2: Subir a GitHub Pages (hosting GRATIS)

### 2a. Crear cuenta en GitHub
- Ve a https://github.com y crea una cuenta gratis

### 2b. Crear repositorio
- Clic en "New repository"
- Nombre: `voleytorneo`
- Marca "Public"
- Clic "Create repository"

### 2c. Subir archivos
- En la página del repositorio, clic en "uploading an existing file"
- Arrastra TODA la carpeta `voley-torneos` (o selecciona todos los archivos)
- Clic "Commit changes"

### 2d. Activar GitHub Pages
- Ve a Settings → Pages
- En "Source" selecciona "main" branch
- Clic Save
- Tu app estará en: `https://TU-USUARIO.github.io/voleytorneo`

---

## Paso 3: Convertir a APK con PWABuilder

1. Ve a **https://www.pwabuilder.com**
2. Pega la URL de tu GitHub Pages (ej: `https://tuusuario.github.io/voleytorneo`)
3. Clic "Start"
4. Cuando termine el análisis, clic "Package for stores"
5. Selecciona **Android**
6. Clic "Download Package"
7. Recibirás un archivo `.apk` listo para instalar

---

## Instalar el APK en Android

1. Pasa el archivo `.apk` a tu teléfono (por WhatsApp, cable USB, etc.)
2. En tu teléfono: Ajustes → Seguridad → Activar "Fuentes desconocidas"
3. Abre el archivo `.apk` desde tu gestor de archivos
4. Instalar → ¡Listo!

---

## Iconos (opcional pero recomendado)

Para que la app tenga un ícono bonito, crea dos imágenes PNG:
- `icons/icon-192.png` (192x192 píxeles)
- `icons/icon-512.png` (512x512 píxeles)

Puedes usar https://www.canva.com para diseñarlos gratis.

---

## ¿Necesitas ayuda?
Comparte este archivo con Claude y pídele asistencia en cualquier paso.
