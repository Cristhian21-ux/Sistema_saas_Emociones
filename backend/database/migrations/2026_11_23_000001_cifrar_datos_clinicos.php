<?php

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cifra en la base de datos los textos clínicos (datos sensibles de salud, Ley 29733):
 * diagnóstico y observaciones de la historia clínica, y respuestas e interpretación de las
 * evaluaciones. Se cifran con la APP_KEY (AES-256), así que un respaldo o un acceso directo a la
 * base ya no muestra esos datos. Los registros existentes se cifran aquí; es seguro volver a ejecutarla.
 */
return new class extends Migration
{
    private const CAMPOS = [
        'historias_clinicas' => ['diagnostico', 'observaciones'],
        'evaluaciones' => ['respuestas', 'interpretacion'],
    ];

    public function up(): void
    {
        // El texto cifrado no es JSON válido: la columna pasa de JSON a TEXT.
        Schema::table('evaluaciones', function (Blueprint $table) {
            $table->text('respuestas')->change();
        });

        $this->recorrer(fn (string $valor) => $this->estaCifrado($valor) ? $valor : Crypt::encryptString($valor));
    }

    public function down(): void
    {
        $this->recorrer(fn (string $valor) => $this->estaCifrado($valor) ? Crypt::decryptString($valor) : $valor);

        Schema::table('evaluaciones', function (Blueprint $table) {
            $table->json('respuestas')->change();
        });
    }

    private function recorrer(callable $transformar): void
    {
        foreach (self::CAMPOS as $tabla => $campos) {
            DB::table($tabla)->select(['id', ...$campos])->orderBy('id')->chunkById(200, function ($filas) use ($tabla, $campos, $transformar) {
                foreach ($filas as $fila) {
                    $cambios = [];
                    foreach ($campos as $campo) {
                        if ($fila->{$campo} !== null && $fila->{$campo} !== '') {
                            $cambios[$campo] = $transformar((string) $fila->{$campo});
                        }
                    }
                    if ($cambios) {
                        DB::table($tabla)->where('id', $fila->id)->update($cambios);
                    }
                }
            });
        }
    }

    private function estaCifrado(string $valor): bool
    {
        try {
            Crypt::decryptString($valor);

            return true;
        } catch (DecryptException) {
            return false;
        }
    }
};
