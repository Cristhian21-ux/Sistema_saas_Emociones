# Centro Psicológico Emociones · Plataforma SaaS

Rediseño del *Sistema de gestión psicológica y control de citas* como **SaaS multi-centro**:
cada centro psicológico se registra, recibe el plan **Gratuito** y puede mejorar a **VIP** o **Premium**.

| Capa | Tecnología | Carpeta |
|---|---|---|
| Backend / API REST | Laravel 12 + Sanctum (PHP 8.3), Eloquent, MySQL (SQLite en desarrollo/pruebas) | `backend/` |
| Frontend SPA | React 18 + Vite + React Router + Axios, **login 3D con Three.js** | `frontend/` |
| IA emocional | Python 3.11 + FastAPI (análisis de emociones, PHQ-9/GAD-7, chatbot) | `ia-service/` |
| Despliegue | Docker + Docker Compose (MySQL, backend, IA, frontend con Nginx) | `docker/`, `docker-compose.yml` |
| Calidad | PHPUnit, pytest, Vitest, Cypress (E2E), SonarQube, GitHub Actions | `.github/`, `sonar-project.properties` |

## Pruebas automatizadas: 180 en verde

| Suite | Herramienta | Pruebas |
|---|---|---|
| Backend (unitarias + API) | PHPUnit (`php artisan test`) | **117** |
| Servicio IA | pytest | **34** |
| Frontend | Vitest + Testing Library | **29** |
| E2E (requiere el sistema levantado) | Cypress (`CORRER_CYPRESS.bat`) | 26 escenarios (CP-01 a CP-26) |

Salida completa en `docs/RESULTADOS_PRUEBAS.txt`. En Windows: doble clic en `PROBAR.bat`.

## Planes SaaS

| Plan | Precio (USD mes / año) | Psicólogos | Pacientes | Evaluaciones PHQ-9/GAD-7 | Análisis de emociones IA |
|---|---|---|---|---|---|
| Gratuito | 0 | 2 | 50 | ✗ | ✗ |
| VIP | 15 / 150 | 10 | 1 000 | ✓ | ✗ |
| Premium | 70 / 700 | 100 | 100 000 | ✓ | ✓ |

## Módulos (BPM TO-BE)
Registro de centro y login (token Sanctum), roles (plataforma, administración, recepción, psicología), pacientes,
agenda con disponibilidad y bloqueo de doble reserva, citas, cobro con comprobante (sin pago no se atiende),
lista de espera automática (al cancelar se ofrece el cupo), notificaciones y recordatorios 24 h, historia clínica,
evaluaciones psicológicas calificadas por Python, análisis de emociones, chatbot, personal, suscripción, auditoría,
panel del proveedor SaaS (centros, MRR, suspender) y `/api/health` para monitoreo.

Si el servicio Python cae, el sistema **degrada sin perder datos** (RNF-12): las evaluaciones se califican en PHP,
el análisis de emociones y el chatbot usan su versión local en PHP (`IaLocal`).

## Cómo levantarlo

### Desde GitHub (clonando el repositorio)
El repositorio no incluye librerías, `.env` ni base de datos. Desde `backend/`:
```bash
composer install
cp .env.example .env        # en Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed  # crea database/database.sqlite si lo pide, responde "yes"
php artisan serve
```
La interfaz React ya está compilada en `backend/public/spa`, así que no hace falta npm para usarla.

### Opción rápida: un solo comando (zip)
El zip ya trae las dependencias de PHP, el `.env`, la base de datos con datos de prueba y la interfaz React compilada.
Desde la carpeta raíz del proyecto (o desde `backend/`):
```bash
php artisan serve
```
Abre **http://localhost:8000** (login 3D incluido). El servicio Python es opcional: si no está encendido,
las evaluaciones, el análisis de emociones y el chatbot funcionan con su versión en PHP.
Si cambias el código de `frontend/`, vuelve a compilarlo con `npm run build:laravel` (dentro de `frontend/`).

### Opción A: Windows sin Docker
Requiere PHP 8.2+, Composer, Node 22+ y Python 3.11+. Doble clic en `INICIAR.bat` y abre http://localhost:3000.

### Opción B: manual
```bash
# 1) Backend
cd backend && composer install && cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate --seed && php artisan serve --port=8000
# 2) IA Python
cd ia-service && python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8001
# 3) Frontend
cd frontend && npm install && npm run dev      # http://localhost:3000
```

### Opción C: Docker (producción)
1. En el servidor, copia `.env.produccion.example` como `.env` y completa **todos** los valores
   (dominio, `APP_KEY`, contraseñas y llave de la IA). Sin ellos `docker compose` no arranca: no hay contraseñas por defecto.
   Genera la `APP_KEY` una sola vez con `php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"`
   y **respáldala fuera del servidor**: con ella se cifran las historias clínicas; si se pierde, no se pueden leer.
2. Apunta el dominio a la IP del servidor y levanta todo:
   ```bash
   docker compose up -d --build
   ```
   Caddy obtiene el certificado HTTPS automáticamente. Solo quedan abiertos los puertos 80 y 443.
3. Crea el centro y su administrador (la contraseña se muestra **una sola vez**):
   ```bash
   docker compose exec backend php artisan emociones:crear-admin --centro="Nombre del centro" --nombre="Nombre Apellido" --email=correo@centro.com
   ```
   El seeder de demostración (`Emociones2026`) está bloqueado en producción.
4. Respaldos: el servicio `respaldo` guarda cada día la base en `./backups` (14 días por defecto).
   Copia esa carpeta a otro lugar (otro servidor o almacenamiento en la nube): un respaldo en el mismo disco no protege si el disco falla.

## Instalación para una sola clínica (sin planes)
Con `MODO_CENTRO_UNICO=true` en `backend/.env` (valor por defecto de esta entrega) el sistema funciona para **un solo centro**:
todas las funciones habilitadas y sin límites, sin "Mi suscripción" y sin registro público de centros
(las cuentas las crea el administrador). Con `false` vuelve a ser el SaaS multi-centro con planes.

## Reportes e impacto
Módulo **Reportes e impacto** (`/reportes`, API `GET /api/reportes/indicadores`): 11 indicadores calculados con los
registros del sistema (citas, tasa de asistencia y de cancelación, ingresos, ticket promedio, pacientes atendidos y nuevos,
evaluaciones, alertas clínicas y cupos reasignados de la lista de espera), gráfico de citas por mes, citas por estado,
ingresos por método de pago, evaluaciones por severidad y desempeño por psicólogo. Filtros: rango de fechas, estado y psicólogo.
El psicólogo solo ve sus propias citas. `ActividadSeeder` carga un historial de 6 meses para la demostración.

## MP-01 Gestión de Acceso y Seguridad
Login con token Sanctum (12 h), cierre de sesión que revoca el token, perfil, RBAC por middleware (`rol:`),
aislamiento multi-centro (scope global), límite de 10 intentos de login por minuto, bloqueo y auditoría de cuentas
desactivadas (`login.bloqueado`) y auditoría filtrable.

## Accesibilidad (personas con discapacidad)
Botón **♿ Accesibilidad** en todas las pantallas (también `Alt + A`): tamaño de letra (100–150 %), alto contraste,
lectura fácil para dislexia, reducir movimiento (quita el fondo 3D), resaltar enlaces y botones, cursor grande y
lectura en voz alta de la página. Las preferencias se recuerdan. Además: enlace "Saltar al contenido", foco visible,
textos alternativos en imágenes, etiquetas en todos los campos y mensajes de error anunciados al lector de pantalla.

## Reportes en PDF
Botón **Descargar PDF** en Panel y Personal (solo administración). El directorio de pacientes no se exporta a PDF para no sacar datos personales del sistema.
Cada reporte lleva el nombre, el RUC y el logo del centro, fecha de generación y número de página.
El logo se cambia reemplazando `backend/resources/img/logo-centro.jpg` (o con `CENTRO_LOGO` en el `.env`).
Usa JPG: funciona aunque PHP no tenga la extensión GD. Para usar PNG activa `extension=gd` en el `php.ini`.
Cada descarga queda registrada en la auditoría.

## Usuarios de demostración (contraseña: `Emociones2026`)
| Correo | Rol |
|---|---|
| plataforma@emociones.test | Dueño de la plataforma SaaS |
| admin@emociones.test | Administración (centro Premium) |
| recepcion@emociones.test | Recepción |
| psicologo@emociones.test / psicologa@emociones.test | Psicología |
| admin@bienestar.test | Administración de otro centro (plan Gratuito) |

## Seguridad aplicada
Contraseñas con bcrypt, tokens con expiración (12 h), RBAC por middleware, aislamiento de datos por centro
(scope global + validación `exists` por centro), rate limiting en login/registro/chatbot y límite general de 120 peticiones
por minuto en la API, borrado lógico de pacientes, auditoría con usuario/IP, llave compartida entre Laravel y Python
(comparación en tiempo constante), y no se guardan datos de tarjeta (se delega a la pasarela).

Datos clínicos: el diagnóstico y las observaciones de la historia clínica, y las respuestas e interpretación de las
evaluaciones, se guardan **cifrados** (AES-256 con la `APP_KEY`). Cada psicólogo ve solo sus historias y evaluaciones.
Para cambiar la contraseña hay que escribir la actual, y al cambiarla se cierran las demás sesiones.

Producción: HTTPS obligatorio (Caddy + HSTS), Content-Security-Policy, `X-Frame-Options`, sin versión de PHP ni
de los servidores en las cabeceras, `APP_DEBUG` bloqueado en producción, respuestas de la API sin caché,
CORS limitado al dominio propio, `.dockerignore` para que ningún `.env` ni base local entre en las imágenes,
y base de datos, backend e IA sin puertos públicos.

Capturas en `docs/capturas/`.
