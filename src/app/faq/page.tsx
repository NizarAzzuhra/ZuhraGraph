"use client";

import React, { useState } from 'react';

const faqItems = [
  {
    question: "Berapa lama estimasi waktu pengerjaan komisi?",
    answer: "Waktu pengerjaan umumnya memakan waktu 3–5 hari kerja tergantung pada kompleksitas paket yang dipilih serta antrean aktif saat ini."
  },
  {
    question: "Bagaimana alur dan metode pembayarannya?",
    answer: "Pembayaran dilakukan di awal secara lunas melalui Payment Gateway terintegrasi (Midtrans) yang mendukung berbagai metode pembayaran seperti QRIS (GoPay, OVO, DANA) dan Transfer Virtual Account Bank."
  },
  {
    question: "Apakah sudah termasuk kuota revisi?",
    answer: "Ya, kami memberlakukan 3 klasifikasi revisi: Artist Error (gratis tanpa memotong kuota), Minor Revision (penyesuaian kecil sesuai kuota paket), dan Scope Change (perubahan konsep besar di luar brief awal dengan biaya tambahan)."
  },
  {
    question: "Siapa yang memegang hak cipta dan lisensi penggunaan karya?",
    answer: "Hak cipta karya (*copyright*) tetap menjadi milik desainer/artist. Klien mendapatkan lisensi penuh untuk penggunaan personal (*Personal Use*). Untuk kebutuhan komersial atau merchandise, silakan komunikasikan terlebih dahulu untuk lisensi komersial."
  },
  {
    question: "Apakah menyediakan cetak fisik?",
    answer: "Layanan kami murni pengiriman berkas digital berkualitas tinggi (High-Resolution File) seperti format PNG, JPG, atau file master sesuai kesepakatan paket tanpa cetak fisik."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-16 md:py-[var(--spacing-section-gap)]">
      
      <header className="max-w-3xl mb-16 md:mb-24">
        <h1 className="text-4xl md:text-[64px] font-display-lg-mobile md:font-display-lg text-[var(--color-primary)] mb-6 font-bold tracking-tight">
          Pertanyaan yang Sering Diajukan
        </h1>
        <p className="text-lg font-body-lg text-[var(--color-secondary)] leading-relaxed">
          Rincian mengenai estimasi waktu pengerjaan, skema pembayaran, hak cipta & lisensi, serta alur komisi. Jika ada pertanyaan yang belum terjawab di sini, silakan hubungi kami secara langsung.
        </p>
      </header>

      {/* FAQ Accordion List */}
      <div className="max-w-3xl border-t border-[var(--color-border-line)]">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b border-[var(--color-border-line)]">
            <button 
              className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
              onClick={() => toggleFAQ(index)}
            >
              <span className="text-xl md:text-2xl font-headline-md font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors pr-4">
                {item.question}
              </span>
              <span className={`material-symbols-outlined text-[var(--color-secondary)] transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="pb-6 text-base font-body-md text-[var(--color-secondary)] pl-4 border-l border-[var(--color-accent)] opacity-80">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-24 max-w-3xl p-8 border border-[var(--color-border-line)] rounded bg-white">
        <h3 className="text-3xl font-headline-lg font-semibold text-[var(--color-primary)] mb-4">Masih punya pertanyaan?</h3>
        <p className="text-base font-body-md text-[var(--color-secondary)] mb-6 leading-relaxed">
          Jika pertanyaan spesifik Anda belum terjawab, silakan hubungi kami secara langsung. Kami berupaya merespons semua pesan secepat mungkin.
        </p>
        <a 
          href="https://mail.google.com/mail/?view=cm&fs=1&to=nizarazzuhra@gmail.com&su=Tanya%20Layanan%20Komisi%20-%20ZuhraGraph" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-6 py-3 text-sm font-label-md hover:bg-[#f6e4e0] hover:border-transparent transition-all duration-200"
        >
          Hubungi Kami
        </a>
      </div>

    </div>
  );
}
