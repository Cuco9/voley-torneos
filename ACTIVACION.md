# VoleyTorneo — sistema de activación 🔐

> Recuperado de `voley premiun\Nuevo Documento de Microsoft Word.docx` al fusionar
> ese proyecto aquí (2026-08-07). Era el único contenido que esa carpeta no duplicaba.

Los códigos válidos son:

```
GRIL-2025
VLEY-PRO1
AVIL-VOLEY
GRIL-VOLEY
```

Se cambian en la línea `const PREMIUM_CODES` dentro de `index.html`
(busca `PREMIUM_CODES=` — está en el bloque `<script>` inline).

El precio mostrado en la app al pedir la activación es **$3 USD**
(cadena `⭐ Activar Premium — $3 USD` en `index.html`).

El código introducido se valida en `activarPremium()` y, si coincide, se guarda
en `localStorage` — la activación es local a cada dispositivo, no hay servidor
de licencias.
