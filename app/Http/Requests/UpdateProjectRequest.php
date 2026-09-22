<?php

namespace App\Http\Requests;

use App\Enums\ProjectHealth;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('project')) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('key')) {
            $this->merge(['key' => strtoupper(trim((string) $this->input('key')))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'key' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:12',
                'regex:/^[A-Z][A-Z0-9]*$/',
                Rule::unique('projects', 'key')->ignore($project->id),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'owner_id' => [
                'sometimes',
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'status' => ['sometimes', 'required', Rule::enum(ProjectStatus::class)],
            'health' => ['sometimes', 'required', Rule::enum(ProjectHealth::class)],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
        ];
    }
}
