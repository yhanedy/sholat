import React, { useState, useEffect } from "react";

const DOA_PELAJAR = [
  {
    judul: "Doa Sebelum Belajar",
    arab: "رَبِّ زِدْنِي عِلْمًا، وَارْزُقْنِيْ فَهْمًا",
    arti: "Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan, dan berilah aku karunia untuk dapat memahaminya.",
  },
  {
    judul: "Doa Saat Kesulitan Ujian",
    arab: "اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً",
    arti: "Ya Allah, tidak ada kemudahan kecuali yang Engkau buat mudah. Dan Engkau menjadikan kesedihan (kesulitan), jika Engkau kehendaki pasti akan menjadi mudah.",
  },
];

export default function App() {
  const [jadwal, setJadwal] = useState(null);
  const [lokasi, setLokasi] = useState("Mendeteksi lokasi...");
  const [kajianList, setKajianList] = useState([]);
  
  // State Pomodoro (25 menit = 1500 detik)
  const [secondsLeft, setSecondsLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);

  // 1. Ambil Jadwal Sholat berbasis GPS (Metode Kemenag RI = 20)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=20`
          );
          const data = await res.json();
          setJadwal(data.data.timings);
          setLokasi(data.data.meta.timezone);
        },
        () => {
          setLokasi("Akses lokasi ditolak (Default: Jakarta)");
          fetch("https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20")
            .then((r) => r.json())
            .then((d) => setJadwal(d.data.timings));
        }
      );
    }
  }, []);

  // 2. Ambil Info Kajian dari Cloudflare Function -> Turso
  useEffect(() => {
    fetch("/api/kajian")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKajianList(data);
      })
      .catch((err) => console.error("Gagal memuat kajian:", err));
  }, []);

  // 3. Logika Timer Pomodoro Belajar
  useEffect(() => {
    let timer;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
      alert("Waktu fokus selesai! Saatnya istirahat atau cek waktu sholat.");
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-zinc-100 font-sans selection:bg-[#D4AF37] selection:text-black pb-12">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-[#111111]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#D4AF37]">
              NOOR<span className="text-white font-light">STUDENT</span>
            </h1>
            <p className="text-xs text-zinc-400">{lokasi}</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#D4AF37]">
            SMA Edition
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Card Jadwal Sholat */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-[#161616] to-[#0F0F0F] border border-zinc-800/80 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-semibold">
              Jadwal Sholat Hari Ini
            </h2>
            <span className="text-xs text-[#D4AF37]">Kemenag RI</span>
          </div>

          {jadwal ? (
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { name: "Subuh", time: jadwal.Fajr },
                { name: "Dzuhur", time: jadwal.Dhuhr },
                { name: "Ashar", time: jadwal.Asr },
                { name: "Maghrib", time: jadwal.Maghrib },
                { name: "Isya", time: jadwal.Isha },
              ].map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-xl bg-[#1C1C1C]/80 border border-zinc-800/60 hover:border-[#D4AF37]/50 transition"
                >
                  <p className="text-xs text-zinc-400 mb-1">{item.name}</p>
                  <p className="text-base sm:text-lg font-bold text-[#D4AF37]">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 animate-pulse">Memuat jadwal sholat...</p>
          )}
        </section>

        {/* Grid 2 Kolom: Pomodoro Belajar & Doa Pelajar */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pomodoro Islami */}
          <section className="p-6 rounded-2xl bg-[#141414] border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-semibold mb-1">
                Fokus Belajar (Pomodoro)
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                25 menit fokus belajar, berhenti sejenak saat adzan.
              </p>
            </div>

            <div className="text-center my-4">
              <div className="text-5xl font-mono font-bold tracking-wider text-white">
                {formatTime(secondsLeft)}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#c29f2f] transition"
              >
                {isRunning ? "Jeda" : "Mulai Fokus"}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(1500);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition"
              >
                Reset
              </button>
            </div>
          </section>

          {/* Doa Anak Sekolah */}
          <section className="p-6 rounded-2xl bg-[#141414] border border-zinc-800/80 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-semibold">
              Doa Pelajar & Ujian
            </h2>
            {DOA_PELAJAR.map((doa, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#1B1B1B] border border-zinc-800/50">
                <p className="text-xs font-semibold text-[#D4AF37] mb-1">{doa.judul}</p>
                <p className="text-right text-lg font-serif text-zinc-100 my-2 leading-relaxed">
                  {doa.arab}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">{doa.arti}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Info Kajian & Rohis (Dari Turso + Link IG) */}
        <section className="p-6 rounded-2xl bg-[#141414] border border-zinc-800/80">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-semibold">
              Info Kajian & Rohis
            </h2>
            <span className="text-xs text-zinc-500">Update via Turso DB</span>
          </div>

          <div className="space-y-3">
            {kajianList.length > 0 ? (
              kajianList.map((kajian) => (
                <div
                  key={kajian.id}
                  className="p-4 rounded-xl bg-[#1B1B1B] border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-100">{kajian.judul}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {kajian.pemateri} • {kajian.waktu} • {kajian.lokasi}
                    </p>
                  </div>
                  {kajian.ig_url && (
                    <a
                      href={kajian.ig_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-center px-4 py-2 rounded-lg bg-zinc-900 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37] hover:text-black transition shrink-0"
                    >
                      Lihat Poster IG ↗
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">
                Belum ada jadwal kajian terdekat.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
