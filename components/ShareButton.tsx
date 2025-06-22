"use client";

import Image from "next/image";
import { useState } from "react";

const ShareButton = ({ productId }: { productId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      // Construct the product page URL (replace with your domain if needed)
      const url = `${window.location.origin}/product/${productId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      alert("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 bg-[#efefef] rounded-md hover:bg-red-500 transition"
    >
      <Image src="/assets/icons/share.svg" alt="share" width={20} height={20} />
    </button>
  ); 
};

export default ShareButton;