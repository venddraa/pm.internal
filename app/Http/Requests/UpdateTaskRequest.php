<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('task')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'status_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('project_statuses', 'id')->where('project_id', $project->id),
            ],
            'priority' => ['sometimes', 'required', Rule::enum(TaskPriority::class)],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date'],
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
            if (! $this->assigneesBelongToProject()) {
                $validator->errors()->add('assignee_ids', 'Every assignee must be an active member of this project.');
            }

            /** @var Task $task */
            $task = $this->route('task');
            $start = $this->input('start_date', $task->start_date?->toDateString());
            $due = $this->input('due_date', $task->due_date?->toDateString());
            if ($start && $due && $due < $start) {
                $validator->errors()->add('due_date', 'The due date must be on or after the start date.');
            }
        }];
    }

    private function assigneesBelongToProject(): bool
    {
        if (! $this->has('assignee_ids')) {
            return true;
        }

        $rawIds = $this->input('assignee_ids', []);
        if (! is_array($rawIds)) {
            return false;
        }

        $ids = collect($rawIds)->map(fn (mixed $id): int => (int) $id)->unique()->values();
        if ($ids->isEmpty()) {
            return true;
        }

        /** @var Project $project */
        $project = $this->route('project');

        return $project->members()
            ->where('users.is_active', true)
            ->whereIn('users.id', $ids)
            ->count() === $ids->count();
    }
}
