# Documentación API — WebPapeleria

Esta guía documenta las rutas usadas por la aplicación WebPapeleria y ejemplos para replicar su comportamiento desde Flutter.

Base
- Base URL (upstream): `https://noninitial-chirurgical-judah.ngrok-free.dev/api` (se respeta `process.env.API_URL`)
- Muchas rutas requieren `Authorization: Bearer <token>` (JWT)

Endpoints principales

1) GET /products/
- Descripción: obtiene el catálogo de productos.
- Headers: `Accept: */*`, `Content-Type: application/json`, `Authorization: Bearer <token>` (recomendado)
- Request: no requiere body.
- Response (ejemplo):

```
{
  "products": [
    {
      "item": { "id_item": 123, "name": "Bloc A4" },
      "description": "Bloc rayado 100 hojas",
      "price": 120.5,
      "file": { "type": "papeleria", "filehash": "abcd1234.pdf" }
    }
  ]
}
```

Notas: la UI construye imágenes con `GET <API_URL>/file-manager/download/:type/:filehash`.

2) POST /file-manager (proxy)
- Ruta local: `POST /api/file-manager` (proxy hacia `${API_URL}/file-manager?service=file`).
- Content-Type: `multipart/form-data`.
- FormData:
  - `files`: archivo
  - `username` (opcional)
  - o `user` JSON en form-data
- Response (ejemplo): el upstream normalmente retorna un array; el frontend usa el primer elemento:

```
[
  { "originalName": "photo.pdf", "storedName": "abc123.pdf", "service": "file" }
]
```

3) POST /files (registrar metadata)
- Ruta local: `POST /api/file` → `${API_URL}/files`.
- Headers: `Content-Type: application/json` y opcional `Authorization`.
- Body (ejemplo):

```
{
  "id_user": 1,
  "filename": "photo.pdf",
  "type": "file",
  "filehash": "abc123.pdf"
}
```

- Response (ejemplo):

```
{ "ok": true, "file": { "id_file": 77, "filename": "photo.pdf", "filehash": "abc123.pdf", "type": "file" } }
```

4) POST /printing-price (calcular precio)
- Ruta local: `POST /api/printing-price` → `${API_URL}/printing-price`.
- Headers: `Content-Type: application/json` y opcional `Authorization`.
- Body (campos usados por la app):

```
{
  "filename": "abc123.pdf",
  "colorModes": "bw"|"color",
  "paperSizes": "carta"|"oficio",
  "ranges": "all"|"1,3-6",
  "bothSides": false,
  "service": "file"|"photo",
  "sets": 1,
  "type": "print"|"photo",
  "paperType": "brillante"|...
}
```

- Response (ejemplo):

```
{
  "pricePerSet": 2.5,
  "totalPrice": 5.0,
  "breakdownPerSet": { "inkCost": 1.0, "paperCost": 1.5 },
  "pages": 4,
  "sheets": 2,
  "sets": 2
}
```

5) POST /users/login
- Ruta local: `POST /api/login` → `${API_URL}/users/login`.
- Body: `{ "username":"x","password":"y" }`
- Response (ejemplo): `{ "token": "<jwt>", "user": {"id_user":1,"username":"..."} }`

6) POST /api/generate-pdf (interno)
- Body: `{ "imageBase64": "data:image/...;base64,...", "paperSize":"ti","quantity":1 }`
- Si se llama con `?store=1` guarda en `.pdf-cache` y responde `{ ok: true, hash }`.
- Si no, devuelve `application/pdf` con el PDF generado.

7) GET /api/pdf-cache?hash=<hash>&type=<type>
- Proxy y cache local: devuelve PDF (si no existe local lo descarga desde `${API_URL}/file-manager/download/:type/:hash.pdf`).


Ejemplos rápidos para Flutter
- Incluye una carpeta con ejemplo de cliente en `flutter_examples/lib/`.

Comandos recomendados (ejecución local del frontend):
```bash
# Usar el proxy local del proyecto Next.js (no es necesario para Flutter, pero útil para pruebas)
npm run dev
```

---
Archivos de ejemplo Flutter añadidos: `flutter_examples/lib/api_client.dart`, `flutter_examples/lib/product_examples.dart`, `flutter_examples/lib/upload_example.dart`

Si quieres que cree `README.md` sobrescribiendo el actual lo hago; también puedo generar una colección Postman o convertir estos ejemplos a widgets completos de Flutter. ¿Qué prefieres?
