<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Indicadores\IndicadoresPlataforma;
use Illuminate\Http\JsonResponse;

/** Indicadores de gestión (hoja 11 de la matriz): de la plataforma SaaS. */
class IndicadorController extends Controller
{
    public function plataforma(): JsonResponse
    {
        return response()->json(['indicadores' => IndicadoresPlataforma::calcular()]);
    }
}
