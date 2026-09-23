<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', [Task::class, $this->route('project')]) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:20000'],
            'status_id' => [
                'nullable',
                'integer',
                Rule::exists('project_statuses', 'id')->where('project_id', $project->id),
            ],
            'priority' => ['nullable', Rule::enum(TaskPriority::class)],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'assignee_ids' => ['sometimes', 'array', 'max:30'],
            'assignee_ids.*' => ['integer', 'distinct'],
            'label_ids' => ['sometimes', 'array', 'max:30'],
            'label_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('labels', 'id')->where('project_id', $project->id),
            ],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->assigneesAreActive()) {
                $validator->errors()->add('assignee_ids', 'Setiap penanggung jawab harus merupakan pengguna aktif.');
            }
        }];
    }

    private function assigneesAreActive(): bool
    {
        $rawIds = $this->input('assignee_ids', []);
        if (! is_array($rawIds)) {
            return false;
        }

        $ids = collect($rawIds)->map(fn (mixed $id): int => (int) $id)->unique()->values();
        if ($ids->isEmpty()) {
            return true;
        }

        return User::query()
            ->whereNull('removed_at')
            ->where('is_active', true)
            ->whereIn('id', $ids)
            ->count() === $ids->count();
    }
}
