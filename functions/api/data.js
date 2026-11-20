import { createClient } from "@libsql/client/web";

function getDb(env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

// Mengambil semua data publik (Kajian, Doa, Motivasi)
export async function onRequestGet({ env }) {
  const db = getDb(env);
  try {
    const [kajian, doa, motivasi] = await Promise.all([
      db.execute("SELECT * FROM kajian ORDER BY id DESC"),
      db.execute("SELECT * FROM doa ORDER BY id DESC"),
      db.execute("SELECT * FROM motivasi ORDER BY id DESC"),
    ]);

    return new Response(
      JSON.stringify({
        kajian: kajian.rows,
        doa: doa.rows,
        motivasi: motivasi.rows,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Aksi Admin (Login, Tambah, Hapus, Ganti Password) dengan cek DB Turso
export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const { password, action, table, payload, id } = body;

  if (!password) {
    return new Response(JSON.stringify({ error: "Password wajib diisi" }), { status: 401 });
  }

  const db = getDb(env);

  try {
    // Cek password langsung ke tabel admin_settings di Turso
    const authRes = await db.execute("SELECT password FROM admin_settings WHERE id = 1");
    const dbPassword = authRes.rows[0]?.password;

    if (!dbPassword || password !== dbPassword) {
      return new Response(JSON.stringify({ error: "Password salah!" }), { status: 401 });
    }

    // Jika hanya mengetes login
    if (action === "test") {
      return new Response(JSON.stringify({ success: true }));
    }

    // Fitur ganti password langsung dari dashboard
    if (action === "change_password") {
      if (!payload?.newPassword || payload.newPassword.length < 4) {
        return new Response(JSON.stringify({ error: "Password baru minimal 4 karakter" }), { status: 400 });
      }
      await db.execute({
        sql: "UPDATE admin_settings SET password = ? WHERE id = 1",
        args: [payload.newPassword],
      });
      return new Response(JSON.stringify({ success: true }));
    }

    // Validasi tabel konten
    const allowedTables = ["kajian", "doa", "motivasi"];
    if (!allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: "Tabel tidak valid" }), { status: 400 });
    }

    if (action === "delete") {
      await db.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [id] });
      return new Response(JSON.stringify({ success: true }));
    }

    if (action === "add") {
      if (table === "kajian") {
        await db.execute({
          sql: "INSERT INTO kajian (judul, pemateri, waktu, lokasi, ig_url) VALUES (?, ?, ?, ?, ?)",
          args: [payload.judul, payload.pemateri, payload.waktu, payload.lokasi, payload.ig_url || ""],
        });
      } else if (table === "doa") {
        await db.execute({
          sql: "INSERT INTO doa (judul, arab, arti) VALUES (?, ?, ?)",
          args: [payload.judul, payload.arab, payload.arti],
        });
      } else if (table === "motivasi") {
        await db.execute({
          sql: "INSERT INTO motivasi (teks, sumber) VALUES (?, ?)",
          args: [payload.teks, payload.sumber],
        });
      }
      return new Response(JSON.stringify({ success: true }));
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
