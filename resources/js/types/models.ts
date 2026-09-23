import type { User } from './auth';

export type Option = { value: string; label: string };
export type ProjectStatusValue =
    | 'planning'
    | 'active'
    | 'on_hold'
    | 'completed'
    | 'archived';
export type ProjectHealthValue = 'on_track' | 'at_risk' | 'off_track';
export type TaskPriorityValue = 'urgent' | 'high' | 'normal' | 'low' | 'none';
export type StatusCategory = 'todo' | 'in_progress' | 'done';

export type Project = {
    id: number;
    name: string;
    key: string;
    description: string | null;
    status: ProjectStatusValue;
    status_label: string;
    health: ProjectHealthValue;
    health_label: string;
    progress_mode: 'checklist' | 'numeric';
    target_value: number | null;
    progress_unit: string | null;
    start_date: string | null;
    due_date: string | null;
    blockers: string | null;
    next_steps: string | null;
    last_progress_update_at: string | null;
    archived_at: string | null;
    updated_at: string | null;
    owner: User;
    members?: Array<User & { project_role: string }>;
    member_count: number;
    progress: {
        total: number;
        completed: number;
        open: number;
        percent: number;
    };
};

export type ProgressItem = {
    id: number;
    name: string;
    target_value: number;
    completed_value: number;
    percent: number;
    status: StatusCategory;
    status_label: string;
    due_date: string | null;
    notes: string | null;
    assignee: User | null;
    updated_at: string | null;
};

export type WorkflowStatus = {
    id: number;
    name: string;
    color: string;
    category: StatusCategory;
    position: number;
    task_count?: number | null;
};

export type Label = {
    id: number;
    name: string;
    color: string;
    task_count?: number;
};

export type Activity = {
    id: number;
    event: string;
    metadata: { description?: string; [key: string]: unknown };
    created_at: string;
    actor: User | null;
};

export type Comment = {
    id: number;
    content: string;
    edited_at: string | null;
    created_at: string;
    author: User;
};

export type Attachment = {
    id: number;
    original_name: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    uploader: User;
    download_url: string;
};

export type Task = {
    completion_status_id?: number | null;
    comments_count?: number;
    id: number;
    task_number: number;
    reference: string;
    title: string;
    description: string | null;
    priority: TaskPriorityValue;
    priority_label: string;
    status_id: number;
    status: WorkflowStatus;
    project: Pick<Project, 'id' | 'name' | 'key'>;
    assignees: User[];
    labels: Label[];
    start_date: string | null;
    due_date: string | null;
    position: number;
    completed_at: string | null;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
    creator?: User;
};

export type TaskDetail = Task & {
    comments: Comment[];
    attachments: Attachment[];
    activity: Activity[];
    permissions: {
        update: boolean;
        archive: boolean;
        comment: boolean;
        attach: boolean;
    };
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string;
};
