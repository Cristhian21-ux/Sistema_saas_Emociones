<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as ServeCommandBase;

/**
 * "php artisan serve" con OPcache activado.
 *
 * Sin OPcache, PHP vuelve a compilar los cientos de archivos de Laravel en cada petición
 * (~150 ms por petición en Windows). Con OPcache baja a ~20 ms. Muchas instalaciones de PHP
 * en Windows lo traen desactivado en php.ini, así que aquí se activa solo para este servidor,
 * sin tocar la configuración global de PHP.
 */
class ServeCommand extends ServeCommandBase
{
    public function handle()
    {
        $puerto = (int) $this->port();
        $conexion = @fsockopen('127.0.0.1', $puerto, $codigo, $mensaje, 0.5);
        if ($conexion) {
            fclose($conexion);
            // En Windows, PHP puede abrir un segundo servidor en el mismo puerto y las peticiones
            // se reparten entre el viejo y el nuevo. Mejor detenerse y avisar.
            $this->components->error("El puerto $puerto ya está ocupado: hay otro servidor abierto (por ejemplo, de INICIAR.ps1 o un \"php artisan serve\" anterior).");
            $this->line("  Ciérralo con Ctrl+C en su ventana, o en PowerShell:  Stop-Process -Id (Get-NetTCPConnection -LocalPort $puerto -State Listen).OwningProcess");
            $this->line("  También puedes usar otro puerto:  php artisan serve --port=8080");

            return self::FAILURE;
        }

        return parent::handle();
    }

    protected function serverCommand()
    {
        $comando = parent::serverCommand();
        array_splice($comando, 1, 0, $this->opcionesOpcache());

        return $comando;
    }

    /** @return list<string> */
    private function opcionesOpcache(): array
    {
        $opciones = [];
        if (! extension_loaded('Zend OPcache')) {
            if (! $this->extensionOpcacheDisponible()) {
                return [];
            }
            $opciones = ['-d', 'zend_extension=opcache'];
        }

        // validate_timestamps=1 y revalidate_freq=0: los cambios en el código se ven al instante.
        return [...$opciones,
            '-d', 'opcache.enable=1',
            '-d', 'opcache.validate_timestamps=1',
            '-d', 'opcache.revalidate_freq=0',
            '-d', 'opcache.memory_consumption=128',
            '-d', 'opcache.max_accelerated_files=20000',
            '-d', 'realpath_cache_size=4096K',
            '-d', 'realpath_cache_ttl=600',
        ];
    }

    private function extensionOpcacheDisponible(): bool
    {
        $carpeta = (string) ini_get('extension_dir');
        if ($carpeta !== '' && ! preg_match('/^([a-zA-Z]:)?[\\\\\/]/', $carpeta)) {
            $carpeta = dirname(PHP_BINARY).DIRECTORY_SEPARATOR.$carpeta; // ruta relativa, p. ej. "ext"
        }

        return is_file($carpeta.'/php_opcache.dll') || is_file($carpeta.'/opcache.so');
    }
}
