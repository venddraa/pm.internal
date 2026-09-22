<?php

namespace App\Http\Requests;

use App\Models\Comment;
use Illuminate\Foundation\Http\FormRequest;

class CommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $comment = $this->route('comment');

        return $comment
            ? ($this->user()?->can('update', $comment) ?? false)
            : ($this->user()?->can('create', [Comment::class, $this->route('task')]) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['content' => ['required', 'string', 'max:10000']];
    }
}
