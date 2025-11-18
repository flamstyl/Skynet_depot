/**
 * GitHub integration - Fetches tasks from GitHub issues and PRs
 * Phase 1: Mock data
 * Phase 2: Real GitHub API integration with Personal Access Token
 */

export async function fetchGithubTasks() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock data - Phase 1
  return [
    {
      title: "Fix authentication bug in login flow",
      description: "Users report intermittent 401 errors when logging in with OAuth. Need to investigate token refresh logic.",
      source: "GitHub",
      externalId: "issue_456",
      status: "inprogress",
      priorityGuess: 1,
      tags: ["bug", "authentication", "urgent", "deep-work"],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      url: "https://github.com/skynet/taskflow/issues/456"
    },
    {
      title: "Implement dark mode for settings page",
      description: "Add dark mode support to the settings page following design system guidelines",
      source: "GitHub",
      externalId: "issue_457",
      status: "todo",
      priorityGuess: 3,
      tags: ["feature", "ui", "enhancement"],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      url: "https://github.com/skynet/taskflow/issues/457"
    },
    {
      title: "Review PR: Add export functionality",
      description: "Team member submitted PR for CSV/JSON export. Needs code review.",
      source: "GitHub",
      externalId: "pr_123",
      status: "todo",
      priorityGuess: 2,
      tags: ["code-review", "feature", "quick-win"],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      url: "https://github.com/skynet/taskflow/pull/123"
    },
    {
      title: "Update dependencies to latest versions",
      description: "Security vulnerability detected in old dependency. Update to latest stable versions.",
      source: "GitHub",
      externalId: "issue_458",
      status: "todo",
      priorityGuess: 2,
      tags: ["security", "maintenance", "urgent"],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      url: "https://github.com/skynet/taskflow/issues/458"
    }
  ];
}

// TODO Phase 2: Implement real GitHub API integration
// - Personal Access Token authentication
// - Fetch assigned issues from specific repos
// - Fetch PRs waiting for review
// - Handle pagination
// - Filter by labels, milestones, assignees
// - Support multiple repositories
