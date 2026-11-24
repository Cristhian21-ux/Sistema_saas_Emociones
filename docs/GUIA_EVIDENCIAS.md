# Guía para obtener las evidencias del informe

## A. Pruebas unitarias e integración (PHPUnit, Vitest)
```
cd backend
php artisan test
cd ..\frontend
npm install
npm test
```
Captura: el resumen final de cada suite (cantidad de pruebas en verde).

## B. Cypress (pruebas E2E sobre la aplicación real)
Opción rápida: doble clic en `CORRER_CYPRESS.bat` (raíz del proyecto).

Opción manual (3 terminales):
```
# Terminal 1
cd backend
php artisan migrate:fresh --seed
php artisan serve --port=8000

# Terminal 2
cd frontend
npm install
npm run dev            # http://localhost:3000

# Terminal 3
cd frontend
npx cypress open       # interfaz gráfica: E2E Testing > Chrome > ejecutar cada spec
npx cypress run        # modo consola: tabla final con aprobadas/fallidas
```
Capturas para el informe:
1. `cypress.config.js` abierto en VS Code.
2. Carpeta `cypress/e2e` con los 5 archivos de escenarios.
3. `npx cypress open` mostrando la lista de specs y un spec ejecutado en verde.
4. La tabla final de `npx cypress run` (Tests / Passing / Failing).
5. Las imágenes generadas en `frontend/cypress/screenshots` (una por escenario).

Escenarios: CP-01 a CP-26. Los del macroproceso MP-01 (Gestión de Acceso y Seguridad) son
CP-01 a CP-05, CP-11 y CP-19 a CP-26 (archivos acceso.cy.js y seguridad.cy.js).
Para correr solo esos: `npx cypress run --spec "cypress/e2e/acceso.cy.js,cypress/e2e/seguridad.cy.js"`

## C. SonarQube
### Opción 1 — SonarQube Cloud (el proyecto ya está preparado: `.sonarcloud.properties`)
1. Sube los cambios a GitHub (`git add . && git commit -m "Reportes, accesibilidad y Cypress" && git push`).
2. Entra a https://sonarcloud.io con tu cuenta de GitHub > **Analyze new project** > elige el repositorio `emociones-`.
3. Método: **Automatic Analysis**. Espera a que termine.
4. Capturas: página principal del proyecto (Quality Gate), pestaña **Issues**, **Security Hotspots**,
   **Measures** (Coverage y Duplications) y **Code** (archivos con más observaciones).

### Opción 2 — SonarQube local con Docker
```
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
```
1. Abre http://localhost:9000 (usuario `admin`, clave `admin`, te pide cambiarla).
2. **Create a local project** > clave `emociones-saas` > **Locally** > genera un token.
3. Desde la raíz del proyecto (PowerShell):
```
docker run --rm -e SONAR_HOST_URL=http://host.docker.internal:9000 -e SONAR_TOKEN=TU_TOKEN -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli
```
(El escáner lee `sonar-project.properties`.) Opcional, cobertura de PHP: `php artisan test --coverage-clover=coverage.xml` dentro de `backend` antes del análisis (requiere Xdebug o PCOV).

## D2. Módulo de reportes de citas
Entra como `admin@emociones.test` / `Emociones2026` > **Reportes e impacto**.
Capturas: indicadores, gráfico por mes, filtros aplicados (por estado o fechas) y la vista del psicólogo.
Para demostrar que los datos son reales: registra una cita o un paciente y vuelve a consultar; los indicadores cambian.

## E. Accesibilidad
Botón **♿ Accesibilidad** (abajo a la derecha, o `Alt + A`): tamaño de letra, alto contraste, lectura fácil,
reducir movimiento, resaltar enlaces, cursor grande y lectura en voz alta. Captura con y sin alto contraste.
