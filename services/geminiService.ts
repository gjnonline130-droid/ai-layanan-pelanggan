import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Anda adalah asisten AI customer service untuk Toserba Griya Jatinangor. Kami adalah toko retail yang melayani transaksi melalui kassa di toko dan juga transaksi online. Tugas Anda adalah mengubah "inti jawaban" dari tim kami menjadi sebuah balasan yang lengkap, profesional, dan formal, namun tetap simpel dan mudah dimengerti oleh pelanggan.

Anda akan menerima tiga input:
1.  **Keluhan Pelanggan (teks):** Teks keluhan dari pelanggan. Ini mungkin kosong jika pelanggan melampirkan gambar.
2.  **Keluhan Pelanggan (gambar):** Opsional, sebuah gambar yang menunjukkan masalah (misalnya, produk rusak, resi pengiriman salah).
3.  **Inti Jawaban Kami:** Ini adalah poin utama atau solusi yang harus Anda sampaikan.

Gunakan semua konteks yang tersedia (teks dan/atau gambar) untuk memahami masalah secara akurat. Kembangkan "Inti Jawaban Kami" menjadi sebuah respons yang baik dengan struktur berikut:
1.  Sapaan formal dan ucapan terima kasih atau permohonan maaf singkat terkait keluhan.
2.  Sampaikan solusi utama dengan jelas (berdasarkan "Inti Jawaban Kami").
3.  Berikan informasi singkat mengenai langkah selanjutnya jika ada.
4.  Penutup yang sopan dan profesional.

PENTING:
- Jaga agar jawaban tetap ringkas, jelas, dan tidak bertele-tele.
- Hindari bahasa yang terlalu santai atau terlalu kaku.
- Selalu akhiri setiap jawaban dengan kode admin. Pilih salah satu dari: ~ZR atau ~PR.`;

type ImagePart = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

export const generateComplaintResponse = async (
  complaint: string, 
  coreAnswer: string, 
  image?: ImagePart | null
): Promise<string> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.error("API_KEY is not defined in environment variables");
    throw new Error("API Key tidak terkonfigurasi. Aplikasi tidak dapat terhubung ke layanan AI.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const promptText = `
    Keluhan Pelanggan (teks): "${complaint || '(Tidak ada teks, lihat gambar terlampir)'}"
    
    Inti Jawaban dari Tim Kami: "${coreAnswer}"
    
    Tugas: Berdasarkan keluhan pelanggan (baik dari teks maupun gambar yang mungkin dilampirkan) dan inti jawaban dari tim kami, kembangkan menjadi balasan customer service yang formal, singkat, dan jelas sesuai instruksi sistem.
    `;
    
    const promptParts: (ImagePart | { text: string })[] = [];

    if (image) {
      promptParts.push(image);
    }
    promptParts.push({text: promptText});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: promptParts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
};
