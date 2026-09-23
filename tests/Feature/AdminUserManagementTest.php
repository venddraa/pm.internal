<?php

namespace Tests\Feature;

use App\Enums\GlobalUserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_employee_account(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);

        $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Raina Putri',
            'email' => 'raina@monitor.local',
            'role' => 'member',
            'password' => 'Secure123!',
            'password_confirmation' => 'Secure123!',
        ])->assertSessionHasNoErrors();

        $user = User::where('email', 'raina@monitor.local')->firstOrFail();
        $this->assertTrue($user->is_active);
        $this->assertTrue(Hash::check('Secure123!', $user->password));
    }

    public function test_admin_can_update_role_status_and_password(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $user = $this->makeUser();

        $this->actingAs($admin)->patch(route('admin.users.update', $user), [
            'name' => 'Updated Employee',
            'email' => $user->email,
            'role' => 'admin',
            'is_active' => false,
            'password' => 'Replacement123!',
            'password_confirmation' => 'Replacement123!',
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Updated Employee', $user->name);
        $this->assertSame(GlobalUserRole::Admin, $user->role);
        $this->assertFalse($user->is_active);
        $this->assertTrue(Hash::check('Replacement123!', $user->password));
    }

    public function test_normal_member_cannot_create_or_update_users(): void
    {
        $member = $this->makeUser();
        $target = $this->makeUser();

        $this->actingAs($member)->post(route('admin.users.store'), [
            'name' => 'Unauthorized User',
            'email' => 'unauthorized@monitor.local',
            'role' => 'member',
            'password' => 'Secure123!',
            'password_confirmation' => 'Secure123!',
        ])->assertForbidden();

        $this->actingAs($member)->patch(route('admin.users.update', $target), ['is_active' => false])->assertForbidden();
        $this->actingAs($member)->delete(route('admin.users.destroy', $target))->assertForbidden();
    }

    public function test_admin_can_remove_account_without_deleting_work_history(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $user = $this->makeUser();
        $project = $this->makeProject($user);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $user))
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertFalse($user->is_active);
        $this->assertNotNull($user->removed_at);
        $this->assertNotNull($project->fresh());
        $this->assertTrue($project->fresh()->owner->is($user));

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/index')
                ->where('users.data', fn ($users) => collect($users)->doesntContain('id', $user->id)));
    }

    public function test_admin_cannot_remove_self(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $admin))
            ->assertSessionHasErrors('user');

        $this->assertNull($admin->fresh()->removed_at);
    }

    public function test_last_active_administrator_cannot_be_deactivated(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);

        $this->actingAs($admin)->patch(route('admin.users.update', $admin), [
            'is_active' => false,
        ])->assertSessionHasErrors('is_active');

        $this->assertTrue($admin->fresh()->is_active);
    }
}
