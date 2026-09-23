<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Project $project */
        $project = $this->route('project');

        return $this->user()?->can('delete', $project) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
            'confirmation' => ['required', 'string', Rule::in([$project->key])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reason.required' => 'Alasan penghapusan wajib diisi.',
            'reason.min' => 'Alasan penghapusan minimal 10 karakter.',
            'confirmation.in' => 'Kode pekerjaan tidak sesuai.',
        ];
    }
}
