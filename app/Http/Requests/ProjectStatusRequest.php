<?php

namespace App\Http\Requests;

use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageWorkflow', $this->route('project')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var ProjectStatusRecord|null $status */
        $status = $this->route('status');
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('project_statuses', 'name')
                    ->where('project_id', $project->id)
                    ->ignore($status?->id),
            ],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'category' => ['required', Rule::enum(StatusCategory::class)],
            'position' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'replacement_status_id' => ['nullable', 'integer'],
        ];
    }
}
