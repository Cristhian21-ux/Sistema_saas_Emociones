#!/bin/sh
# Respaldo diario de la base de datos: mysqldump comprimido en /backups y borrado de copias antiguas.
set -eu
umask 077
while true; do
  archivo="/backups/emociones-$(date +%Y%m%d-%H%M).sql.gz"
  if mysqldump -h db -u app_user --single-transaction --quick --no-tablespaces emociones_saas | gzip > "$archivo.tmp"; then
    mv "$archivo.tmp" "$archivo"
    echo "Respaldo creado: $archivo"
  else
    rm -f "$archivo.tmp"
    echo "ERROR: falló el respaldo" >&2
  fi
  find /backups -name 'emociones-*.sql.gz' -mtime +"${RETENCION_DIAS:-14}" -delete
  sleep 86400
done
