/**
 * Notion integration - Fetches tasks from Notion databases
 * Phase 1: Mock data
 * Phase 2: Real Notion API integration with integration token
 */

export async function fetchNotionTasks() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 280));

  // Mock data - Phase 1
  // Notion is disabled by default in Phase 1
  return [];

  // Uncomment below for mock tasks if needed
  /*
  return [
    {
      title: "Write technical blog post about TaskFlow",
      description: "Document the architecture and benefits of TaskFlow MCP system",
      source: "Notion",
      externalId: "page_notion123abc",
      status: "todo",
      priorityGuess: 3,
      tags: ["writing", "content", "deep-work"],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      url: "https://notion.so/page_notion123abc"
    }
  ];
  */
}

// TODO Phase 2: Implement real Notion API integration
// - Integration token authentication
// - Query specific databases
// - Parse page properties (status, tags, due dates)
// - Handle relations and rollups
// - Support multiple workspaces
