#!/bin/sh
set -e
cd /var/www/html

# La APP_KEY es obligatoria y debe ser siempre la misma: con ella se cifran las historias
# clínicas. Generar una nueva en cada arranque dejaría esos datos ilegibles.
if [ -z "$APP_KEY" ]; then
  echo "ERROR: falta APP_KEY. Defínela en el .env del servidor (ver .env.produccion.example)." >&2
  exit 1
fi
if [ "$APP_DEBUG" = "true" ] && [ "$APP_ENV" = "production" ]; then
  echo "ERROR: APP_DEBUG=true en producción mostraría datos internos en los errores." >&2
  exit 1
fi

mkdir -p storage/app/public storage/app/private
chown -R www-data:www-data storage

php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
exec apache2-foreground
