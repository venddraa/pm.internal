<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAgendaTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = Project::query()->active()->find($this->integer('area_id'));

        return $project !== null
            && ($this->user()?->can('create', [Task::class, $project]) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'area_id' => ['required', 'integer', Rule::exists('projects', 'id')->whereNull('archived_at')],
            'description' => ['nullable', 'string', 'max:20000'],
            'scheduled_at' => ['nullable', 'date'],
            'assignee_ids' => ['sometimes', 'array', 'max:30'],
            'assignee_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where('is_active', true)->whereNull('removed_at'),
            ],
        ];
    }
}
