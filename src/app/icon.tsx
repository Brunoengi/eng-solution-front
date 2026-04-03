import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #0b3149 55%, #0e7490 100%)",
          borderRadius: "8px",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12.99 6.74 1.93 3.44" />
          <path d="M19.136 12a10 10 0 0 1-14.271 0" />
          <path d="m21 21-2.16-3.84" />
          <path d="m3 21 8.02-14.26" />
          <circle cx="12" cy="5" r="2" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
