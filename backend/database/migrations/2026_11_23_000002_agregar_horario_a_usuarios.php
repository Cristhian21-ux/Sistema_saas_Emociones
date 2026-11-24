<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Horario de atención de cada psicólogo: qué días atiende y de qué hora a qué hora.
 * Vacío (null) = usa el horario general del centro (config/centro.php), como hasta ahora.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('horario')->nullable()->after('especialidad');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('horario');
        });
    }
};
