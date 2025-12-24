"use client";

import { AGENDA_ONLINE_URL, WHATSAPP_URL } from "@/src/lib/constants";

export function StickyCTA() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 mx-auto w-[min(480px,calc(100vw-2rem))] sm:hidden">
      <div className="rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur-xl">
        <div className="flex gap-3">
          <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer" className="flex-1">
            <button className="btn-primary w-full !py-3 !text-xs">
              Agendar
            </button>
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex-1">
            <button className="btn-outline w-full !py-3 !text-xs">
              WhatsApp
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
