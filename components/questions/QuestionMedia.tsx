/* eslint-disable @next/next/no-img-element */

export function QuestionMedia({
  src,
  alt = "Reference image for this question",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="mx-auto max-h-[28rem] w-auto max-w-full object-contain"
      />
    </figure>
  );
}
