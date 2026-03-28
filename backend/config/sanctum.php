<?php

use Laravel\Sanctum\Sanctum;

$toCsvArray = static function (string $value): array {
    return array_values(array_filter(array_map('trim', explode(',', $value))));
};

$hostWithPortFromUrl = static function (?string $url): ?string {
    $value = trim((string) $url);
    if ($value === '') return null;

    $parsedHost = parse_url($value, PHP_URL_HOST);
    if (!is_string($parsedHost) || trim($parsedHost) === '') return null;

    $parsedPort = parse_url($value, PHP_URL_PORT);
    $host = trim($parsedHost);

    return is_int($parsedPort) ? "{$host}:{$parsedPort}" : $host;
};

$statefulFromEnv = $toCsvArray((string) env('SANCTUM_STATEFUL_DOMAINS', ''));

if (empty($statefulFromEnv)) {
    $derived = array_values(array_filter([
        $hostWithPortFromUrl((string) env('FRONTEND_URL', '')),
        $hostWithPortFromUrl((string) env('APP_URL', '')),
    ]));
    $statefulFromEnv = array_values(array_unique($derived));
}

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => $statefulFromEnv,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. If this value is null, personal access tokens do
    | not expire. This won't tweak the lifetime of first-party sessions.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
