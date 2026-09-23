<?php

namespace App\Http\Controllers\Admin;

use App\Enums\GlobalUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->isAdmin(), 403);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $users = User::query()
            ->whereNull('removed_at')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $term = '%'.mb_strtolower($search).'%';
                $query->where(fn (Builder $query) => $query
                    ->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term]));
            })
            ->when($filters['role'] ?? null, fn (Builder $query, string $role) => $query->where('role', $role))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('is_active', $status === 'active'))
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (User $user) => [
                ...InertiaData::user($user),
                'created_at' => $user->created_at?->toIso8601String(),
                'can_delete' => ! $user->is($request->user())
                    && ! ($user->role === GlobalUserRole::Admin
                        && $user->is_active
                        && User::query()
                            ->whereNull('removed_at')
                            ->where('role', GlobalUserRole::Admin->value)
                            ->where('is_active', true)
                            ->count() <= 1),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => array_map(fn ($role) => ['value' => $role->value, 'label' => $role->label()], GlobalUserRole::cases()),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create([
            ...$request->safe()->only(['name', 'email', 'role', 'password']),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        return back()->with('success', 'Pengguna berhasil dibuat.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = array_filter(
            $request->validated(),
            fn ($value, $key) => $key !== 'password' || filled($value),
            ARRAY_FILTER_USE_BOTH,
        );

        if ($user->is($request->user()) && array_key_exists('is_active', $data) && ! $data['is_active']) {
            throw ValidationException::withMessages(['is_active' => 'Kamu tidak dapat menonaktifkan akun sendiri.']);
        }

        if ($user->role === GlobalUserRole::Admin
            && ((array_key_exists('role', $data) && $data['role'] !== GlobalUserRole::Admin->value)
                || ($data['is_active'] ?? true) === false)
            && User::query()->where('role', GlobalUserRole::Admin->value)->where('is_active', true)->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'Sedikitnya satu administrator harus tetap aktif.']);
        }

        DB::transaction(fn () => $user->update(Arr::only($data, [
            'name', 'email', 'role', 'password', 'is_active',
        ])));

        return back()->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'Kamu tidak dapat menghapus akun sendiri.',
            ]);
        }

        if ($user->role === GlobalUserRole::Admin
            && $user->is_active
            && User::query()
                ->whereNull('removed_at')
                ->where('role', GlobalUserRole::Admin->value)
                ->where('is_active', true)
                ->count() <= 1) {
            throw ValidationException::withMessages([
                'user' => 'Sedikitnya satu administrator harus tetap aktif.',
            ]);
        }

        DB::transaction(function () use ($user): void {
            $user->forceFill([
                'is_active' => false,
                'removed_at' => now(),
                'remember_token' => null,
            ])->save();

            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        return back()->with('success', 'Akun berhasil dihapus. Riwayat pekerjaan tetap tersimpan.');
    }
}
