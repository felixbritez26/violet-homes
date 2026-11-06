# Actualización de mapa y fotografías

Incluye TODO el proyecto con login, los cinco paneles, diseño móvil, fotos ilustrativas, mapa y filtro por estado.

1. Guardá tu ZIP anterior como respaldo.
2. Detené ambos servidores con Ctrl+C.
3. Reemplazá los archivos de backend y frontend con los de este paquete. Incluí frontend/public/images: contiene las fotos. NO borres backend/instance de tu Codespace si querés conservar las cuentas existentes. Esa carpeta privada no está en este ZIP.
4. Subí el README actualizado.
5. En una terminal nueva:

```bash
cd /workspaces/codespaces-blank/backend
pipenv install --dev
pipenv run dev
```

6. En otra terminal nueva:

```bash
cd /workspaces/codespaces-blank/frontend
npm install
npm run start -- --force
```

Abrí el puerto 5173 y recargá con Ctrl+Shift+R.

## Comprobaciones
- Registrate o iniciá sesión.
- Revisá las fotos con la etiqueta Sample photo.
- Tocá Map: aparecen precios de esta página y una lista accesible de direcciones.
- Tocá un precio y View property para abrir detalles.
- Cambiá de página: también cambia el mapa.
- Buscá Reston: deben quedar 2 publicaciones.
- En filtros, Pending: aparece 42 Willow Way. Sold: sin resultados.
- Probá el mapa en un teléfono; permite zoom con los botones o gesto táctil.

No hay alquileres ni datos de disponibilidad en vivo: se conserva el JSON de la evaluación. Las fotos no corresponden a esas direcciones. El mapa base necesita internet.

Antes de entregar, ejecutá pipenv run test desde backend y npm run build desde frontend. Generá un ZIP nuevo desde tu Codespace con tus últimos cambios, excluyendo node_modules, dist, instance y secretos.
