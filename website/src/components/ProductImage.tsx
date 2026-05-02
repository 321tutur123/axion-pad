"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function ProductImage({ src, alt, fallback, sizes, priority, className }: Props) {
  const [err, setErr] = useState(false);

  if (err) return <>{fallback ?? null}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(max-width: 1024px) 100vw, 50vw"}
      className={className ?? "object-contain p-6"}
      priority={priority}
      onError={() => setErr(true)}
    />
  );
}
