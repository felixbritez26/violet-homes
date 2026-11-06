# Violet Homes con login — actualización completa

Este paquete contiene TODO el proyecto, no solo el login. Incluye los cinco paneles y formato móvil violeta/negro.

1. Descomprimí el ZIP.
2. En Codespaces detené los servidores con Ctrl+C en cada terminal.
3. Reemplazá los archivos de backend y frontend con los del ZIP. Subí también README.md y .gitignore. No hace falta subir COMPLETE_CODE.md para ejecutar.
4. En una terminal nueva:

```bash
cd /workspaces/codespaces-blank/backend
pipenv install --dev
pipenv run dev
```

5. En otra terminal nueva:

```bash
cd /workspaces/codespaces-blank/frontend
npm install
npm run start -- --force
```

6. Abrí el puerto 5173 y recargá con Ctrl+Shift+R.
7. Elegí Create an account, registrate y luego iniciá sesión.

## Probar el reset
Elegí Forgot password, ingresá el email de la cuenta y mirá la terminal del backend. Allí aparecerá `/?reset=TOKEN`. Agregá ese texto al final de la dirección de la aplicación (puerto 5173), abrí el enlace e ingresá una contraseña nueva. No se envía correo: la entrega del enlace es una demo por terminal. El enlace vence en 30 minutos y funciona una sola vez.

La sesión se conserva al recargar; para volver al login tocá Log out. Las cuentas se guardan en SQLite. No entregues backend/instance, porque contiene las cuentas y la clave de sesión.

## Código completo
COMPLETE_CODE.md reúne los archivos de código. El README explica la fórmula de ranking y los comandos. Los comandos siguen siendo pipenv run dev y npm run start desde sus respectivas carpetas.

## English
“I added registration, cookie-based login, logout, and a one-time password reset flow. The API requires authentication. Reset links are delivered through the backend console in this local demo.”
