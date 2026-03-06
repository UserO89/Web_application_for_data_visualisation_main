<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dataset_columns', function (Blueprint $table) {
            $table->string('physical_type')->nullable()->after('type');
            $table->string('detected_semantic_type')->nullable()->after('physical_type');
            $table->string('semantic_type')->nullable()->after('detected_semantic_type');
            $table->decimal('semantic_confidence', 5, 4)->nullable()->after('semantic_type');
            $table->string('type_source')->default('auto')->after('semantic_confidence');
            $table->string('analytical_role')->nullable()->after('type_source');
            $table->json('ordinal_order')->nullable()->after('analytical_role');
            $table->boolean('is_excluded_from_analysis')->default(false)->after('ordinal_order');
            $table->json('profile_json')->nullable()->after('is_excluded_from_analysis');
            $table->json('inference_scores_json')->nullable()->after('profile_json');
            $table->json('inference_reasons_json')->nullable()->after('inference_scores_json');
        });
    }

    public function down(): void
    {
        Schema::table('dataset_columns', function (Blueprint $table) {
            $table->dropColumn([
                'physical_type',
                'detected_semantic_type',
                'semantic_type',
                'semantic_confidence',
                'type_source',
                'analytical_role',
                'ordinal_order',
                'is_excluded_from_analysis',
                'profile_json',
                'inference_scores_json',
                'inference_reasons_json',
            ]);
        });
    }
};
