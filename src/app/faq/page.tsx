"use client";

import React, { useState } from 'react';

const faqItems = [
  {
    question: "What is the typical timeline for a commission?",
    answer: "Timelines vary significantly based on the complexity and medium of the piece. Generally, standard digital portraits take 2-3 weeks, while intricate concept pieces or full scene illustrations may require 4-8 weeks. A specific timeline will be established during our initial consultation and detailed in the commission agreement."
  },
  {
    question: "How does the payment process work?",
    answer: "I require a 50% non-refundable deposit upfront before any sketch work begins. This secures your spot in my queue. The remaining 50% is due upon completion and approval of the final watermarked artwork, prior to the delivery of the high-resolution files. Payments are accepted via standard wire transfer or Midtrans."
  },
  {
    question: "Are revisions included?",
    answer: "Yes, standard commissions include up to three revision rounds. The first occurs at the initial sketch phase (major structural changes allowed). The second is during the block-in/color comp phase (color and mood adjustments). The final revision is near completion for minor detailing. Additional revisions beyond these stages are billed at an hourly rate."
  },
  {
    question: "Who retains the copyright and usage rights?",
    answer: "As the creator, I retain full copyright of the artwork. Unless explicitly negotiated otherwise, commissions are for personal use only (e.g., displaying in your home, using as a personal avatar). Commercial rights (using the art for profit, branding, or merchandise) require a separate commercial license and an adjusted pricing structure."
  },
  {
    question: "Do you provide physical prints?",
    answer: "ZuhraGraph specializes in premium digital art. Final deliverables are high-resolution digital files (typically TIFF and JPEG). I do not handle printing in-house, but I am happy to recommend reputable fine art printing services to ensure your piece is reproduced with the highest fidelity."
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
          Frequently Asked Questions
        </h1>
        <p className="text-lg font-body-lg text-[var(--color-secondary)] leading-relaxed">
          Details on timelines, payment structures, usage rights, and the commission process. If your question isn't answered here, feel free to reach out directly.
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
        <h3 className="text-3xl font-headline-lg font-semibold text-[var(--color-primary)] mb-4">Still have questions?</h3>
        <p className="text-base font-body-md text-[var(--color-secondary)] mb-6 leading-relaxed">
          If your specific inquiry wasn't covered, please reach out directly. I aim to respond to all inquiries within 48 hours.
        </p>
        <button className="inline-flex items-center justify-center bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-6 py-3 text-sm font-label-md hover:bg-[#f6e4e0] hover:border-transparent transition-all duration-200">
          Contact Support
        </button>
      </div>

    </div>
  );
}
