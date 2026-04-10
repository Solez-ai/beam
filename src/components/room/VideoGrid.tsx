import type { Participant } from "@/types";
import { cn } from "@/lib/cn";
import { VideoTile } from "@/components/room/VideoTile";

interface VideoGridProps {
  activeSharerId: string | null;
  isHostViewer: boolean;
  onOpenActions: (participant: Participant) => void;
  participants: Participant[];
}

function getGridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1";
  }
  if (count === 2) {
    return "grid-cols-1 md:grid-cols-2";
  }
  if (count <= 4) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  if (count <= 6) {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  }
  if (count <= 9) {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
}

export function VideoGrid({
  activeSharerId,
  isHostViewer,
  onOpenActions,
  participants,
}: VideoGridProps) {
  if (activeSharerId && participants.length > 1) {
    const sharer = participants.find((participant) => participant.peerId === activeSharerId);
    const others = participants.filter((participant) => participant.peerId !== activeSharerId);

    return (
      <section className="grid min-h-[calc(100vh-14rem)] gap-4 lg:grid-cols-[minmax(0,1.55fr)_22rem]">
        <div className="min-h-[24rem]">
          {sharer ? (
            <VideoTile
              onOpenActions={onOpenActions}
              participant={sharer}
              showManageButton={isHostViewer && !sharer.isLocal && !sharer.isHost}
            />
          ) : null}
        </div>
        <div className="beam-scrollbar flex gap-4 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
          {others.map((participant) => (
            <div className="min-w-[16rem] flex-1 lg:min-w-0" key={participant.peerId}>
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

  return (
    <section
      className={cn(
        "grid min-h-[calc(100vh-14rem)] gap-4 auto-rows-[minmax(14rem,1fr)]",
        getGridClass(participants.length),
      )}
    >
      {participants.map((participant) => (
        <VideoTile
          key={participant.peerId}
          onOpenActions={onOpenActions}
          participant={participant}
          showManageButton={isHostViewer && !participant.isLocal && !participant.isHost}
        />
      ))}
    </section>
  );
}
