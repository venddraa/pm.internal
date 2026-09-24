<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAgendaTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('task')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'agenda_status' => ['sometimes', 'required', Rule::in(['todo', 'progress', 'waiting', 'done'])],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
            'status_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'result_notes' => ['sometimes', 'nullable', 'string', 'max:30000'],
            'next_action' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'reference_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'assignee_ids' => ['sometimes', 'array', 'max:30'],
            'assignee_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where('is_active', true)->whereNull('removed_at'),
            ],
        ];
    }
}
