<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MoveTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('move', $this->route('task')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'status_id' => [
                'required',
                'integer',
                Rule::exists('project_statuses', 'id')->where('project_id', $project->id),
            ],
            'target_index' => ['required', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
