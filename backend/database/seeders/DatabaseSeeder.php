<?php

namespace Database\Seeders;

use App\Models\Campanha;
use App\Models\Posto;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Posto::firstOrCreate(['nome' => 'Posto de Saúde Central de Saquarema'], ['endereco' => 'Rua Coronel Madureira, 77 - Centro, Saquarema - RJ', 'horario_funcionamento' => 'Segunda a Sexta, das 08h às 17h', 'telefone' => '(22) 2651-0000', 'aberto' => true]);
        Posto::firstOrCreate(['nome' => 'UBS Bacaxá'], ['endereco' => 'Av. Saquarema, 4500 - Bacaxá, Saquarema - RJ', 'horario_funcionamento' => 'Segunda a Sexta, das 08h às 16h', 'telefone' => '(22) 2651-0000', 'aberto' => true]);
        Campanha::firstOrCreate(['titulo' => 'Campanha Nacional contra a Influenza'], ['descricao' => 'Proteção para os grupos prioritários contra os vírus da gripe.', 'data_inicio' => '2026-04-01', 'data_fim' => '2026-05-31', 'status' => 'Encerrada']);
        Campanha::firstOrCreate(['titulo' => 'Multivacinação'], ['descricao' => 'Atualização da caderneta de crianças, jovens e adultos.', 'data_inicio' => '2026-10-05', 'data_fim' => '2026-10-23', 'status' => 'Em breve']);
    }
}
