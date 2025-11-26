/**
 * Gmail integration - Fetches tasks from Gmail emails
 * Phase 1: Mock data
 * Phase 2: Real Gmail API integration with OAuth
 */

export async function fetchGmailTasks() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // Mock data - Phase 1
  return [
    {
      title: "Review proposal from client X",
      description: "Email received with detailed proposal for Q1 2024 project",
      source: "Gmail",
      externalId: "msg_18c4f2a1b3d5e6f7",
      status: "todo",
      priorityGuess: 2,
      tags: ["email", "client", "proposal"],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      url: "https://mail.google.com/mail/u/0/#inbox/msg_18c4f2a1b3d5e6f7"
    },
    {
      title: "Follow up with team about meeting notes",
      description: "Need to consolidate and share meeting notes from yesterday",
      source: "Gmail",
      externalId: "msg_28d5g3b2c4e6f8g9",
      status: "todo",
      priorityGuess: 3,
      tags: ["email", "team", "follow-up"],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      url: "https://mail.google.com/mail/u/0/#inbox/msg_28d5g3b2c4e6f8g9"
    },
    {
      title: "Respond to vendor quote request",
      description: "Vendor requesting feedback on pricing quote",
      source: "Gmail",
      externalId: "msg_39e6h4c3d5f7g9h1",
      status: "todo",
      priorityGuess: 3,
      tags: ["email", "vendor", "urgent"],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      url: "https://mail.google.com/mail/u/0/#inbox/msg_39e6h4c3d5f7g9h1"
    }
  ];
}

// TODO Phase 2: Implement real Gmail API integration
// - OAuth 2.0 authentication
// - Search for emails with specific labels or keywords
// - Parse email content to extract task information
// - Handle pagination for large inboxes
