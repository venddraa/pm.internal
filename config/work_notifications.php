<?php

return [
    'email_enabled' => (bool) env('WORK_EMAIL_ENABLED', false),
    // Pilot rollout: an empty list intentionally disables all recipients.
    'allowed_recipients' => array_values(array_filter(array_map(
        fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('WORK_EMAIL_ALLOWED_RECIPIENTS', '')),
    ))),
];
