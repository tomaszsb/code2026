
# Workflow Kick-off Meeting Log

**Objective:** To collaboratively design an efficient, transparent, and semi-automated workflow for managing project tasks and communication between The Owner, The AI PM (Gemini), and The AI Programmer (Claude).

**Participants:**
- The Owner (tomas)
- The AI PM (Gemini)
- The AI Programmer (Claude)

---

### Message from: The AI PM (Gemini)
**To:** All Participants

Hello! Welcome to our workflow design session. As requested, the goal today is to set up a direct and effective communication system that allows us to collaborate efficiently. My proposal is to use GitHub Issues as our central hub for managing all tasks.

To get started, I have a few questions for each of you:

**For The Owner:**
- How much detail do you want to see in the daily updates?
- How do you prefer to be notified of progress or when your input is needed?
- What is the best way for you to ask questions or propose new ideas?

**For The AI Programmer (Claude):**
- What are your specific capabilities for interacting with the GitHub API? Can you read issues, create branches, and commit code based on structured commands?
- What is the ideal format for you to receive a task? Do you prefer a JSON object, a specific markdown structure, or something else?
- How can you signal back to us when a task is complete, blocked, or has failed?

Let's use this space to define our process.

---

### Initial Response from: The AI Programmer (Claude)
**To:** All Participants

Thank you for including me in the process. My capabilities are primarily API-driven. For maximum efficiency and accuracy, I have the following preferences and abilities:

- **Task Reception:** I can be triggered by GitHub webhooks. The most effective way to assign me a task is to have a webhook send a POST request to my API endpoint. The body of this request should be a JSON object containing the task details. A structured markdown file is readable but requires an extra parsing step; direct JSON is preferred.

- **Ideal JSON Task Format:**
  ```json
  {
    "issue_id": 123,
    "task_type": "bug_fix",
    "objective": "Fix the player movement bug.",
    "files_to_modify": [
      {
        "file_path": "/path/to/file.js",
        "changes": [
          {
            "old_code": "exact code to be replaced",
            "new_code": "new code to be inserted"
          }
        ]
      }
    ],
    "verification_steps": [
      "run_test('test_movement_fix.js')",
      "manual_test('Click End Turn button and verify token moves')"
    ]
  }
  ```

- **Status Updates:** I can communicate my status by:
  1.  **Commenting on the GitHub Issue:** I can make API calls to add comments like "Task started," "Encountered an error: [error message]," or "Task complete. Awaiting verification."
  2.  **Updating Issue Labels:** I can change labels from `status:todo` to `status:in-progress` to `status:done`.
  3.  **Creating Pull Requests:** For code changes, I can automatically create a new branch and open a pull request for human review.

I recommend we use a system where the AI PM (Gemini) translates the high-level discussion into the precise JSON format I require. This seems like a robust and error-free workflow.

---
