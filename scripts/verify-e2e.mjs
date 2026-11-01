const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("=== Testing End-to-End with Neon Postgres Service ===");

  // Test 1: Fetch Spaces
  console.log("\n1. Testing GET /api/spaces...");
  const spacesRes = await fetch(`${BASE_URL}/api/spaces`);
  if (!spacesRes.ok) throw new Error(`Spaces fetch failed: ${spacesRes.status}`);
  const spacesData = await spacesRes.json();
  console.log(`✓ Fetched ${spacesData.spaces.length} spaces:`, spacesData.spaces.map(s => s.name).join(", "));

  // Test 2: Fetch Tasks
  console.log("\n2. Testing GET /api/tasks...");
  const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
  if (!tasksRes.ok) throw new Error(`Tasks fetch failed: ${tasksRes.status}`);
  const tasksData = await tasksRes.json();
  console.log(`✓ Fetched ${tasksData.tasks.length} tasks from Neon DB:`);
  tasksData.tasks.forEach(t => {
    console.log(`  - [${t.space_name}] ${t.title} (Deadline: ${t.deadline ? t.deadline.slice(0, 10) : 'none'}, Lead Time: ${t.lead_time_days}d, Reminder: ${t.reminder_date ? t.reminder_date.slice(0, 10) : 'none'})`);
  });

  // Test 3: Create a Task
  console.log("\n3. Testing POST /api/tasks (Create Task in Neon Postgres)...");
  const newTaskPayload = {
    space_id: "space-couples",
    title: "Plan anniversary weekend trip",
    description: "Book cabin in the mountains and pack hiking gear @partner",
    deadline: "2027-10-15T00:00:00.000Z",
    lead_time_days: 21,
    created_by: "Alex"
  };
  const createRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTaskPayload)
  });
  if (!createRes.ok) throw new Error(`Create task failed: ${createRes.status}`);
  const createData = await createRes.json();
  const createdTaskId = createData.task.id;
  console.log(`✓ Created task "${createData.task.title}" with ID ${createdTaskId}`);
  console.log(`  - Deadline: ${createData.task.deadline}`);
  console.log(`  - Calculated Reminder Date: ${createData.task.reminder_date}`);

  // Test 4: Add a note with @mention
  console.log(`\n4. Testing POST /api/tasks/${createdTaskId}/notes (Add Note & Tag)...`);
  const notePayload = {
    author: "Taylor",
    content: "I found two great cabin options! Look at the link @alex and let me know @partner"
  };
  const noteRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notePayload)
  });
  if (!noteRes.ok) throw new Error(`Note creation failed: ${noteRes.status}`);
  const noteData = await noteRes.json();
  console.log(`✓ Note created with tagged users:`, noteData.note.tagged_users);

  // Test 5: Fetch single task with notes
  console.log(`\n5. Testing GET /api/tasks/${createdTaskId} (Verify notes attached)...`);
  const getTaskRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`);
  if (!getTaskRes.ok) throw new Error(`Get task failed: ${getTaskRes.status}`);
  const getTaskData = await getTaskRes.json();
  console.log(`✓ Retrieved task with ${getTaskData.task.notes.length} note(s):`);
  getTaskData.task.notes.forEach(n => console.log(`  - [${n.author}] ${n.content}`));

  // Test 6: Update status (PATCH)
  console.log(`\n6. Testing PATCH /api/tasks/${createdTaskId} (Update status to in_progress)...`);
  const patchRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "in_progress" })
  });
  if (!patchRes.ok) throw new Error(`Patch task failed: ${patchRes.status}`);
  const patchData = await patchRes.json();
  console.log(`✓ Task status updated to: ${patchData.task.status}`);

  // Test 7: Verify Web Page HTML renders
  console.log("\n7. Testing GET / (Frontend Page HTML Render)...");
  const pageRes = await fetch(`${BASE_URL}/`);
  if (!pageRes.ok) throw new Error(`Page HTML fetch failed: ${pageRes.status}`);
  const html = await pageRes.text();
  console.log(`✓ Page HTML served (${html.length} bytes, contains title: "${html.includes("Tandem") ? "Yes" : "No"}")`);

  // Test 8: Clean up test task
  console.log(`\n8. Testing DELETE /api/tasks/${createdTaskId}...`);
  const deleteRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, { method: "DELETE" });
  if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
  console.log("✓ Test task cleaned up successfully.");

  console.log("\n=== ALL NEON POSTGRES END-TO-END TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

