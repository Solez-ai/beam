import type { SVGProps } from "react";

function createIcon(path: string, viewBox = "0 0 24 24") {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox={viewBox}
        {...props}
      >
        <path d={path} />
      </svg>
    );
  };
}

export const CameraIcon = createIcon("M4 8a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1.25l4-2.25v10l-4-2.25V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z");
export const CameraOffIcon = createIcon("M3 3l18 18M15 9.25V8a2 2 0 0 0-2-2H7.75M10.5 18H6a2 2 0 0 1-2-2v-5.25M15 14.75l4 2.25V7l-4 2.25");
export const MicIcon = createIcon("M12 15a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4m0 0v4m-5 0h10M19 11a7 7 0 0 1-14 0");
export const MicOffIcon = createIcon("M3 3l18 18M9 9v2a3 3 0 0 0 4.6 2.55M12 15v4m-5 0h10M19 11a7 7 0 0 1-3.2 5.88M8.05 5.6A4 4 0 0 1 16 7v4");
export const LinkIcon = createIcon("M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 1 1 7 7L17 13M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11");
export const LeaveIcon = createIcon("M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3");
export const UsersIcon = createIcon("M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8.5 10v-2a4 4 0 0 0-3-3.87M15 3.13A4 4 0 0 1 15 11");
export const ScreenShareIcon = createIcon("M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l2 4H8l2-4H5a2 2 0 0 1-2-2zm9 1.5V13m0-6.5L9.5 9M12 6.5 14.5 9");
export const CrownIcon = createIcon("M4 18h16l-1.5-8-4.5 3-2-5-2 5-4.5-3z");
export const InfoIcon = createIcon("M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20");
export const XIcon = createIcon("M6 6l12 12M18 6 6 18");
export const CopyIcon = createIcon("M9 9h10v12H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1");
export const CheckIcon = createIcon("M5 12.5 9.5 17 19 7");
export const VolumeXIcon = createIcon("M11 5 6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6");
export const PinIcon = createIcon("M21.17 3.23a3 3 0 0 0-4.24 0L14 6l-5.66-2L6.22 6.12 9.4 9.3 3.75 14.95a1 1 0 0 0 0 1.41l3.89 3.89a1 1 0 0 0 1.41 0l5.66-5.66 3.18 3.18 2.12-2.12-2-5.66 2.83-2.83a3 3 0 0 0 0-4.24zM16.41 12l2-2");

