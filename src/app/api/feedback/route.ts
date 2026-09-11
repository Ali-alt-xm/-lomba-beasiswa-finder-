import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, type, url } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const accessKey = process.env.WEB3FORMS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    }

    const typeLabels: Record<string, string> = {
      saran: "💡 Saran Fitur",
      bug: "🐛 Laporan Bug",
      lomba: "🏆 Tambah Lomba",
      beasiswa: "🎓 Tambah Beasiswa",
      lainnya: "📝 Lainnya",
    };

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `📬 Feedback LombaFinder — ${typeLabels[type] || type}`,
        from_name: "LombaFinder Feedback",
        email: "noreply@lombafinder.app",
        message: `Tipe: ${typeLabels[type] || type}\n\nPesan:\n${text}\n\nHalaman: ${url || "N/A"}\nWaktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
      }),
    });

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
