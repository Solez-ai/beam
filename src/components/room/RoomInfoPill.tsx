import { InfoIcon } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";

export function RoomInfoPill() {
  return (
    <div className="beam-surface hidden rounded-full px-4 py-2 text-xs text-white/68 md:flex md:items-center md:gap-3">
      <InfoIcon className="h-4 w-4 text-pink-200" />
      <span>
        Created by{" "}
        <a
          className="text-pink-200 hover:text-pink-100"
          href={siteConfig.creator.github}
          rel="noreferrer"
          target="_blank"
        >
          {siteConfig.creator.name}
        </a>
      </span>
      <span className="text-white/28">|</span>
      <a
        className="hover:text-white"
        href={siteConfig.repositoryUrl}
        rel="noreferrer"
        target="_blank"
      >
        GitHub
      </a>
      <a
        className="hover:text-white"
        href={siteConfig.creator.portfolio}
        rel="noreferrer"
        target="_blank"
      >
        Portfolio
      </a>
    </div>
  );
}

