// app/api/packs/status/route.ts

export async function GET(request: Request) {
  // In real life, you'd:
  // 1. Check the user session
  // 2. Read cooldown and gems from the DB

  // For now, return static example data
  const nextPackAt = Date.now() + 1000 * 60 * 60; // 1 hour from now
  const gems = 100;

  return Response.json({
    nextPackAt,
    gems,
  });
}
