import { NextResponse } from "next/server";
import { emptyTrash } from "@/server/services/notes";

// N5 — empty the trash: permanently deletes every soft-deleted note (demo
// backend). One SQL statement + best-effort attachment cleanup. On the cloud
// backend the same operation runs as chunked committed delete-batches in the
// Firestore repository (S8 pattern). Irreversible by design — the UI is
// required to run the mandatory two-step confirmation first.
export async function DELETE() {
  try {
    const result = await emptyTrash();
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/trash failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
