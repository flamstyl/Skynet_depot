/**
 * Trello integration - Fetches tasks from Trello boards
 * Phase 1: Mock data
 * Phase 2: Real Trello API integration with API key + token
 */

export async function fetchTrelloTasks() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));

  // Mock data - Phase 1
  return [
    {
      title: "Prepare presentation for Q1 review",
      description: "Create slides summarizing Q1 achievements and Q2 roadmap",
      source: "Trello",
      externalId: "card_abc123def456",
      status: "todo",
      priorityGuess: 2,
      tags: ["presentation", "planning", "deep-work"],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      url: "https://trello.com/c/abc123def456"
    },
    {
      title: "Update project documentation",
      description: "Revise README and architecture docs with latest changes",
      source: "Trello",
      externalId: "card_def456ghi789",
      status: "todo",
      priorityGuess: 3,
      tags: ["documentation", "maintenance"],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      url: "https://trello.com/c/def456ghi789"
    },
    {
      title: "Research AI task prioritization options",
      description: "Investigate Claude CLI vs OpenAI API for task prioritization feature",
      source: "Trello",
      externalId: "card_ghi789jkl012",
      status: "inprogress",
      priorityGuess: 2,
      tags: ["research", "ai", "deep-work"],
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
      url: "https://trello.com/c/ghi789jkl012"
    }
  ];
}

// TODO Phase 2: Implement real Trello API integration
// - API Key + Token authentication
// - Fetch cards from specific boards
// - Support multiple boards
// - Parse card checklists as subtasks
// - Handle due dates, labels, members
// - Sync card status (To Do, Doing, Done)
