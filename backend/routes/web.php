<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['message' => 'Data Visualization API'];
});

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['ok' => true]);
})->middleware('web');
