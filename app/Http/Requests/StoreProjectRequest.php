<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Project::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'key' => strtoupper(trim((string) $this->input('key'))),
            'progress_mode' => $this->input('progress_mode', 'checklist'),
        ]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'key' => ['required', 'string', 'min:2', 'max:12', 'regex:/^[A-Z][A-Z0-9]*$/', 'unique:projects,key'],
            'description' => ['nullable', 'string', 'max:10000'],
            'owner_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress_mode' => ['required', Rule::in(['checklist', 'numeric'])],
            'target_value' => ['nullable', 'required_if:progress_mode,numeric', 'integer', 'min:1', 'max:100000000'],
            'progress_unit' => ['nullable', 'required_if:progress_mode,numeric', 'string', 'max:40'],
        ];
    }
}
