<?php

namespace App\Http\Requests;

use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\ProjectProgressItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProjectProgressItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('project')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'assignee_id' => [
                'sometimes',
                'nullable',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->whereNull('removed_at')
                    ->where('is_active', true)),
            ],
            'target_value' => ['sometimes', 'required', 'integer', 'min:1', 'max:100000000'],
            'completed_value' => ['sometimes', 'required', 'integer', 'min:0', 'max:100000000'],
            'status' => ['sometimes', 'required', Rule::enum(StatusCategory::class)],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $routeItem = $this->route('progressItem');
            $item = $routeItem instanceof ProjectProgressItem ? $routeItem : null;
            $target = (int) $this->input('target_value', $item ? $item->target_value : 0);
            $completed = (int) $this->input('completed_value', $item ? $item->completed_value : 0);

            if ($target > 0 && $completed > $target) {
                $validator->errors()->add('completed_value', 'Realisasi tidak boleh melebihi target.');
            }
        }];
    }
}
