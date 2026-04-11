import type { Participant } from "@/types";
import { cn } from "@/lib/cn";
import { VideoTile } from "@/components/room/VideoTile";

interface VideoGridProps {
  activeSharerId: string | null;
  isHostViewer: boolean;
  onOpenActions: (participant: Participant) => void;
  participants: Participant[];
}

function getGridClass(count: number, hasSharer: boolean) {
  if (hasSharer) {
    return "grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_22rem] grid-rows-[minmax(18rem,1fr)_auto] lg:grid-rows-1";
  }
  if (count <= 1) {
    return "grid-cols-1 auto-rows-[minmax(14rem,1fr)] h-[calc(100vh-14rem)] sm:h-auto";
  }
  if (count === 2) {
    return "grid-cols-1 sm:grid-cols-2 auto-rows-[minmax(14rem,1fr)]";
  }
  if (count <= 4) {
    return "grid-cols-2 sm:grid-cols-2 auto-rows-[minmax(10rem,1fr)] sm:auto-rows-[minmax(14rem,1fr)]";
  }
  if (count <= 6) {
    return "grid-cols-2 sm:grid-cols-3 auto-rows-[minmax(10rem,1fr)] sm:auto-rows-[minmax(14rem,1fr)]";
  }
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(10rem,1fr)] sm:auto-rows-[minmax(14rem,1fr)]";
}

export function VideoGrid({
  activeSharerId,
  isHostViewer,
  onOpenActions,
  participants,
}: VideoGridProps) {
  const sharer = participants.find((p) => p.peerId === activeSharerId);
  const hasSharer = Boolean(sharer && participants.length > 1);

  return (
    <section
      className={cn(
        "grid min-h-[calc(100vh-14rem)] gap-4",
        getGridClass(participants.length, hasSharer),
      )}
    >
      {hasSharer && sharer ? (
        <div className="min-h-[24rem] h-full lg:col-start-1 lg:row-span-full">
          <VideoTile
            key={sharer.peerId}
            onOpenActions={onOpenActions}
            participant={sharer}
            showManageButton={isHostViewer && !sharer.isLocal && !sharer.isHost}
          />
        </div>
      ) : null}
      
      <div className={hasSharer ? "beam-scrollbar flex gap-4 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:col-start-2" : "contents"}>
        {participants
          .filter((p) => !hasSharer || p.peerId !== activeSharerId)
          .map((participant) => (
            <div className={hasSharer ? "min-w-[16rem] flex-1 lg:min-w-0" : "contents"} key={participant.peerId}>
              <VideoTile
                onOpenActions={onOpenActions}
                participant={participant}
                showManageButton={isHostViewer && !participant.isLocal && !participant.isHost}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
