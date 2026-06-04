export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    full_name: string;
    name: string;
    owner: { login: string };
    default_branch?: string;
    private?: boolean;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  user: { login: string };
  state: string;
  merged: boolean;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
}

export interface GitHubReview {
  id: number;
  user: { login: string } | null;
  state: string;
  submitted_at: string | null;
}

export interface GitHubDeployment {
  id: number;
  environment: string;
  ref: string;
  sha: string;
  created_at: string;
}

export interface GitHubDeploymentStatus {
  id: number;
  state: string;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}
