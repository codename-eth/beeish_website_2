"use client"

import Image from "next/image"
import Link from "next/link"

export default function SocialFooter() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center">
      <div className="bg-[#FCB74C] rounded-xl shadow-md px-4 py-2 flex items-center gap-4">
        <Link href="https://x.com/BeeishNFT" target="_blank" rel="noopener noreferrer" className="block">
          <div style={{ width: "40px", height: "40px", position: "relative" }}>
            <Image
              src="/x-button.png"
              alt="X (Twitter)"
              fill
              style={{ objectFit: "contain" }}
              className="hover:scale-110 transition-transform duration-200"
              unoptimized={true}
            />
          </div>
        </Link>

        <Link href="https://discord.gg/bearish" target="_blank" rel="noopener noreferrer" className="block">
          <div style={{ width: "40px", height: "40px", position: "relative" }}>
            <Image
              src="/discord-button.png"
              alt="Discord"
              fill
              style={{ objectFit: "contain" }}
              className="hover:scale-110 transition-transform duration-200"
              unoptimized={true}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}
