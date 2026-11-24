<?php

namespace App\Services;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Mantiene al día la interfaz React compilada en public/spa.
 * Se ejecuta antes de "php artisan serve": si el código de frontend/ cambió desde la última
 * compilación (o nunca se compiló), corre "npm run build:laravel" para que un solo comando baste.
 */
class CompiladorSpa
{
    /** Archivos y carpetas de frontend/ que afectan a la compilación. */
    private const FUENTES = ['src', 'public', 'index.html', 'vite.config.js', 'package.json', 'package-lock.json'];

    public function __construct(
        private readonly string $frontend,
        private readonly string $indice,
    ) {}

    public static function predeterminado(): self
    {
        return new self(base_path('../frontend'), public_path('spa/index.html'));
    }

    /** Sin carpeta frontend (por ejemplo, en Docker) no hay nada que compilar. */
    public function disponible(): bool
    {
        return is_file($this->frontend.'/package.json');
    }

    public function desactualizada(): bool
    {
        if (! is_file($this->indice)) {
            return true;
        }

        return $this->ultimaModificacion() > filemtime($this->indice);
    }

    public function compilar(OutputInterface $salida): bool
    {
        $salida->writeln('<info>La interfaz cambió: compilando React en public/spa (npm run build:laravel)…</info>');
        $npm = PHP_OS_FAMILY === 'Windows' ? 'npm.cmd' : 'npm';
        $carpeta = escapeshellarg($this->frontend);
        $irA = PHP_OS_FAMILY === 'Windows' ? "cd /d $carpeta" : "cd $carpeta";

        if (! is_dir($this->frontend.'/node_modules')) {
            passthru("$irA && $npm install", $codigo);
            if ($codigo !== 0) {
                return $this->fallo($salida, 'npm install');
            }
        }

        passthru("$irA && $npm run build:laravel", $codigo);

        return $codigo === 0 ? true : $this->fallo($salida, 'npm run build:laravel');
    }

    private function fallo(OutputInterface $salida, string $comando): bool
    {
        $salida->writeln("<error>Falló \"$comando\". Se servirá la última versión compilada de la interfaz.</error>");

        return false;
    }

    private function ultimaModificacion(): int
    {
        $ultima = 0;
        foreach (self::FUENTES as $fuente) {
            $ruta = $this->frontend.'/'.$fuente;
            if (is_file($ruta)) {
                $ultima = max($ultima, filemtime($ruta));
            } elseif (is_dir($ruta)) {
                $archivos = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($ruta, FilesystemIterator::SKIP_DOTS));
                foreach ($archivos as $archivo) {
                    if (! str_contains($archivo->getPathname(), '__tests__')) {
                        $ultima = max($ultima, $archivo->getMTime());
                    }
                }
            }
        }

        return $ultima;
    }
}
