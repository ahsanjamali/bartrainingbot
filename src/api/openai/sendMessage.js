export async function POST(req) {
  try {
    const { threadId, assistantId, message } = await req.json();

    // Step 1: Add a message to the thread
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v1",
        },
        body: JSON.stringify({
          role: "user",
          content: message,
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error(
        `OpenAI API error adding message: ${messageResponse.status}`
      );
    }

    // Step 2: Run the assistant
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v1",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`OpenAI API error starting run: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Step 3: Wait for the run to complete
    let runStatus = await checkRunStatus(threadId, runId);
    let attempts = 0;
    const maxAttempts = 10;

    while (runStatus.status !== "completed" && attempts < maxAttempts) {
      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await checkRunStatus(threadId, runId);
      attempts++;
    }

    if (runStatus.status !== "completed") {
      throw new Error("Run did not complete in the allotted time");
    }

    // Step 4: Get messages from the thread
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v1",
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(
        `OpenAI API error getting messages: ${messagesResponse.status}`
      );
    }

    const messagesData = await messagesResponse.json();

    // Get the latest assistant message
    const latestMessage = messagesData.data
      .filter((msg) => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (!latestMessage) {
      throw new Error("No assistant message found");
    }

    // Extract the text content
    const messageContent = latestMessage.content[0].text.value;

    return new Response(JSON.stringify({ message: messageContent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending message to OpenAI:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function checkRunStatus(threadId, runId) {
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v1",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`OpenAI API error checking run status: ${response.status}`);
  }

  return await response.json();
}
