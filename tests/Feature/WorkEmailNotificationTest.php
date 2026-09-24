<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use App\Jobs\SendWorkNotificationEmail;
use App\Notifications\ProjectMemberAddedNotification;
use App\Notifications\TaskAssignedNotification;
use App\Notifications\WorkEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class WorkEmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['work_notifications.email_enabled' => true, 'work_notifications.allowed_recipients' => ['pilot@example.com']]);
        Queue::fake();
    }

    public function test_assignment_keeps_inbox_immediate_and_queues_one_email(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser(attributes: ['notification_email' => 'pilot@example.com']);
        $project = $this->makeProject($owner);
        $project->members()->attach($member, ['role' => ProjectMemberRole::Member->value]);
        $task = $this->makeTask($project, $owner);
        $task->assignees()->attach($member);
        $member->notify(new TaskAssignedNotification($task, $owner));

        $this->assertSame(1, $member->notifications()->count());
        Queue::assertPushed(SendWorkNotificationEmail::class, 1);
        Queue::assertPushed(SendWorkNotificationEmail::class, fn ($job) => $job->queue === 'emails' && $job->afterCommit === true);
        Notification::fake();
        (new SendWorkNotificationEmail($member->id, $member->notifications()->firstOrFail()->id))->handle();
        Notification::assertSentOnDemand(WorkEmailNotification::class, function ($notification, $channels, $notifiable) use ($task) {
            return $notifiable->routes['mail'] === 'pilot@example.com'
                && str_contains($notification->url, 'task='.$task->id)
                && $channels === ['mail'];
        });
    }

    public function test_pilot_gate_and_opt_out_do_not_affect_inbox(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        foreach ([null, 'outside@example.com', 'pilot@example.com'] as $address) {
            $member = $this->makeUser(attributes: ['notification_email' => $address]);
            if ($address === 'pilot@example.com') {
                config(['work_notifications.email_enabled' => false]);
            }
            $member->notify(new ProjectMemberAddedNotification($project, $owner));
            $this->assertSame(1, $member->notifications()->count());
        }
        Queue::assertNothingPushed();
    }

    public function test_removed_assignee_does_not_receive_queued_email(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser(attributes: ['notification_email' => 'pilot@example.com']);
        $project = $this->makeProject($owner);
        $project->members()->attach($member, ['role' => ProjectMemberRole::Member->value]);
        $task = $this->makeTask($project, $owner);
        $member->notify(new TaskAssignedNotification($task, $owner));
        Notification::fake();
        (new SendWorkNotificationEmail($member->id, $member->notifications()->firstOrFail()->id))->handle();
        Notification::assertNothingSent();
    }

    public function test_project_email_rechecks_membership_and_opt_out_at_delivery(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser(attributes: ['notification_email' => 'pilot@example.com']);
        $project = $this->makeProject($owner);
        $project->members()->attach($member, ['role' => ProjectMemberRole::Member->value]);
        $member->notify(new ProjectMemberAddedNotification($project, $owner));
        $job = new SendWorkNotificationEmail($member->id, $member->notifications()->firstOrFail()->id);
        Notification::fake();
        $job->handle();
        Notification::assertSentOnDemand(WorkEmailNotification::class);
        Notification::fake();
        $member->update(['notification_email' => null]);
        $job->handle();
        $member->update(['notification_email' => 'pilot@example.com']);
        $project->members()->detach($member);
        $job->handle();
        Notification::assertNothingSent();
    }

    public function test_notification_email_is_separate_from_login_and_can_be_cleared(): void
    {
        $user = $this->makeUser(attributes: ['email' => 'person@planning']);
        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name, 'email' => $user->email, 'notification_email' => 'pilot@example.com',
        ])->assertSessionHasNoErrors();
        $this->assertSame('person@planning', $user->fresh()->email);
        $this->assertSame('pilot@example.com', $user->fresh()->notification_email);
        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name, 'email' => $user->email, 'notification_email' => '',
        ])->assertSessionHasNoErrors();
        $this->assertNull($user->fresh()->notification_email);
        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name, 'email' => $user->email, 'notification_email' => 'person@planning',
        ])->assertSessionHasErrors('notification_email');
    }

    public function test_preview_sends_nothing_and_send_requires_smtp(): void
    {
        $user = $this->makeUser(attributes: ['notification_email' => 'pilot@example.com']);
        Notification::fake();
        $this->artisan('notifications:test-email', ['login' => $user->email])->assertSuccessful();
        config(['mail.default' => 'log']);
        $this->artisan('notifications:test-email', ['login' => $user->email, '--send' => true])->assertFailed();
        Notification::assertNothingSent();
    }
}
