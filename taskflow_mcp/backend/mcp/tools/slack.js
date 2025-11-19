/**
 * Slack integration - Fetches action items from Slack messages
 * Phase 1: Mock data
 * Phase 2: Real Slack API integration with OAuth token
 */

export async function fetchSlackTasks() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 220));

  // Mock data - Phase 1
  // Slack is disabled by default in Phase 1
  return [];

  // Uncomment below for mock tasks if needed
  /*
  return [
    {
      title: "Schedule team sync for next week",
      description: "Action item from #general: organize team sync meeting",
      source: "Slack",
      externalId: "msg_slack456def",
      status: "todo",
      priorityGuess: 3,
      tags: ["slack", "meeting", "quick-win"],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      url: "https://workspace.slack.com/archives/C123/p456789"
    }
  ];
  */
}

// TODO Phase 2: Implement real Slack API integration
// - OAuth token authentication
// - Search for messages with specific reactions or keywords
// - Parse messages marked as action items
// - Support saved items / starred messages
// - Handle threads and replies
