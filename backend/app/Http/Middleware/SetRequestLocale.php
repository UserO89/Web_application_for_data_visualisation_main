<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetRequestLocale
{
    public function handle(Request $request, Closure $next)
    {
        $supportedLocales = config('app.supported_locales', ['en', 'sk', 'ru', 'uk']);
        $locale = $this->resolveLocale($request, $supportedLocales);

        app()->setLocale($locale);

        return $next($request);
    }

    private function resolveLocale(Request $request, array $supportedLocales): string
    {
        $candidates = [
            $request->header('X-Locale'),
            $request->header('Accept-Language'),
        ];

        foreach ($candidates as $candidate) {
            $resolved = $this->normalizeLocaleCandidate($candidate, $supportedLocales);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return (string) config('app.locale', 'en');
    }

    private function normalizeLocaleCandidate(?string $candidate, array $supportedLocales): ?string
    {
        $value = strtolower(trim((string) $candidate));
        if ($value === '') {
            return null;
        }

        $parts = preg_split('/[,;]/', $value) ?: [];
        foreach ($parts as $part) {
            $normalized = trim((string) $part);
            if ($normalized === '' || str_starts_with($normalized, 'q=')) {
                continue;
            }

            if (in_array($normalized, $supportedLocales, true)) {
                return $normalized;
            }

            $baseLocale = explode('-', $normalized)[0] ?? null;
            if ($baseLocale !== null && in_array($baseLocale, $supportedLocales, true)) {
                return $baseLocale;
            }
        }

        return null;
    }
}
