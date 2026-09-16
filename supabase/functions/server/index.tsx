import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Supabase client (service role) ────────────────────────────────────────────
function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ── Password hashing (SHA-256) ────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Helpers: DB rows → frontend shape ────────────────────────────────────────
async function buildLessons(supabase: ReturnType<typeof createClient>) {
  const { data: courses, error: ce } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order");
  if (ce) throw new Error(ce.message);
  if (!courses || courses.length === 0) return [];

  const courseIds = courses.map((c: any) => c.id);

  const { data: questions, error: qe } = await supabase
    .from("questions")
    .select("*")
    .in("course_id", courseIds)
    .order("sort_order");
  if (qe) throw new Error(qe.message);

  const questionIds = (questions ?? []).map((q: any) => q.id);
  let options: any[] = [];
  if (questionIds.length > 0) {
    const { data: opts, error: oe } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questionIds)
      .order("sort_order");
    if (oe) throw new Error(oe.message);
    options = opts ?? [];
  }

  return courses.map((c: any) => {
    const qs = (questions ?? []).filter((q: any) => q.course_id === c.id);
    return {
      id: c.id,
      order: c.sort_order,
      title: c.title,
      description: c.description,
      videoUrl: c.video_url,
      videoDurationMinutes: c.video_duration_minutes,
      requireFullWatch: c.require_full_watch,
      passingScore: c.passing_score,
      questions: qs.map((q: any) => {
        const opts = options
          .filter((o: any) => o.question_id === q.id)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        return {
          id: q.id,
          type: q.question_type,
          question: q.question_text,
          options: opts.map((o: any) => o.option_text),
          correct: q.correct_option_indexes,
          points: q.points,
          explanation: q.explanation ?? undefined,
        };
      }),
    };
  });
}

async function upsertLesson(supabase: ReturnType<typeof createClient>, lesson: any) {
  const { error: ce } = await supabase.from("courses").upsert({
    id: lesson.id,
    sort_order: lesson.order,
    title: lesson.title,
    description: lesson.description ?? "",
    video_url: lesson.videoUrl ?? "",
    video_duration_minutes: lesson.videoDurationMinutes ?? 0,
    require_full_watch: lesson.requireFullWatch ?? true,
    passing_score: Math.max(85, lesson.passingScore ?? 85),
    updated_at: new Date().toISOString(),
  });
  if (ce) throw new Error(ce.message);

  // Delete old questions (cascades to options)
  await supabase.from("questions").delete().eq("course_id", lesson.id);

  const questions = lesson.questions ?? [];
  if (questions.length === 0) return;

  const { error: qe } = await supabase.from("questions").insert(
    questions.map((q: any, i: number) => ({
      id: q.id,
      course_id: lesson.id,
      sort_order: i,
      question_type: q.type,
      question_text: q.question,
      correct_option_indexes: q.correct,
      points: q.points ?? 1,
      explanation: q.explanation ?? null,
    })),
  );
  if (qe) throw new Error(qe.message);

  const optionRows: any[] = [];
  for (const q of questions) {
    (q.options ?? []).forEach((text: string, i: number) => {
      optionRows.push({ question_id: q.id, sort_order: i, option_text: text });
    });
  }
  if (optionRows.length > 0) {
    const { error: oe } = await supabase.from("question_options").insert(optionRows);
    if (oe) throw new Error(oe.message);
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/make-server-13fc189e/health", (c) => c.json({ status: "ok" }));

// ── Lessons ───────────────────────────────────────────────────────────────────
app.get("/make-server-13fc189e/lessons", async (c) => {
  try {
    const lessons = await buildLessons(db());
    return c.json(lessons);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-13fc189e/lessons/bulk", async (c) => {
  try {
    const lessons: any[] = await c.req.json();
    const supabase = db();
    for (const lesson of lessons) {
      await upsertLesson(supabase, lesson);
    }
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/make-server-13fc189e/lessons/:id", async (c) => {
  try {
    const lesson = await c.req.json();
    await upsertLesson(db(), lesson);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete("/make-server-13fc189e/lessons/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = db();
    await supabase.from("questions").delete().eq("course_id", id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post("/make-server-13fc189e/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabase = db();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!user) return c.json({ error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" }, 401);

    const hash = await hashPassword(password);
    const valid = user.password_hash === hash || user.password_hash === password;
    if (!valid) return c.json({ error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" }, 401);

    return c.json({
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role === "admin" ? "admin" : "user",
        department: user.department,
        startDate: user.start_date,
        progress: [],
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get("/make-server-13fc189e/users", async (c) => {
  try {
    const { data, error } = await db()
      .from("users")
      .select("id, email, full_name, role, department, start_date")
      .order("created_at");
    if (error) throw new Error(error.message);
    return c.json(
      (data ?? []).map((u: any) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role === "admin" ? "admin" : "user",
        department: u.department,
        startDate: u.start_date,
        progress: [],
      })),
    );
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-13fc189e/users", async (c) => {
  try {
    const user = await c.req.json();
    const hash = await hashPassword(user.password ?? "user123");
    const { error } = await db().from("users").upsert({
      id: user.id,
      email: (user.email ?? "").trim().toLowerCase(),
      full_name: user.name ?? "",
      password_hash: hash,
      role: user.role === "admin" ? "admin" : "employee",
      department: user.department ?? "",
      start_date: user.startDate ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete("/make-server-13fc189e/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await db().from("users").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-13fc189e/users/seed", async (c) => {
  try {
    const users: any[] = await c.req.json();
    const supabase = db();
    const { data: existing } = await supabase.from("users").select("id");
    const existingIds = new Set((existing ?? []).map((u: any) => u.id));

    for (const user of users) {
      if (existingIds.has(user.id)) continue;
      const hash = await hashPassword(user.password ?? "user123");
      await supabase.from("users").upsert({
        id: user.id,
        email: (user.email ?? "").trim().toLowerCase(),
        full_name: user.name ?? "",
        password_hash: hash,
        role: user.role === "admin" ? "admin" : "employee",
        department: user.department ?? "",
        start_date: user.startDate ?? new Date().toISOString().slice(0, 10),
      });
    }
    return c.json({ seeded: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ── Progress ──────────────────────────────────────────────────────────────────
app.get("/make-server-13fc189e/progress/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const { data, error } = await db()
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return c.json(
      (data ?? []).map((p: any) => ({
        lessonId: p.course_id,
        videoCompleted: p.video_completed,
        quizAttempt: p.passed !== null
          ? {
              answers: p.quiz_answers ?? {},
              score: p.score ?? 0,
              totalPoints: p.total_points ?? 0,
              passed: p.passed,
              completedAt: p.completed_at ?? new Date().toISOString(),
            }
          : null,
      })),
    );
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/make-server-13fc189e/progress", async (c) => {
  try {
    const { data, error } = await db().from("user_progress").select("*");
    if (error) throw new Error(error.message);
    const byUser: Record<string, any[]> = {};
    for (const p of data ?? []) {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push({
        lessonId: p.course_id,
        videoCompleted: p.video_completed,
        quizAttempt: p.passed !== null
          ? {
              answers: p.quiz_answers ?? {},
              score: p.score ?? 0,
              totalPoints: p.total_points ?? 0,
              passed: p.passed,
              completedAt: p.completed_at ?? new Date().toISOString(),
            }
          : null,
      });
    }
    return c.json(byUser);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-13fc189e/progress/video", async (c) => {
  try {
    const { userId, lessonId } = await c.req.json();
    const supabase = db();
    const { data: existing } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", lessonId)
      .maybeSingle();

    const { error } = await supabase.from("user_progress").upsert({
      user_id: userId,
      course_id: lessonId,
      video_completed: true,
      quiz_answers: existing?.quiz_answers ?? null,
      score: existing?.score ?? null,
      total_points: existing?.total_points ?? null,
      passed: existing?.passed ?? null,
      completed_at: existing?.completed_at ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/make-server-13fc189e/progress/quiz", async (c) => {
  try {
    const { userId, lessonId, attempt } = await c.req.json();
    const supabase = db();
    const { data: existing } = await supabase
      .from("user_progress")
      .select("video_completed")
      .eq("user_id", userId)
      .eq("course_id", lessonId)
      .maybeSingle();

    const { error } = await supabase.from("user_progress").upsert({
      user_id: userId,
      course_id: lessonId,
      video_completed: existing?.video_completed ?? true,
      quiz_answers: attempt.answers ?? {},
      score: attempt.score ?? 0,
      total_points: attempt.totalPoints ?? 0,
      passed: attempt.passed ?? false,
      completed_at: attempt.completedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);
