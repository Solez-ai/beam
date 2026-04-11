import type { Participant } from "@/types";
import { cn } from "@/lib/cn";
import { VideoTile } from "@/components/room/VideoTile";

interface VideoGridProps {
  activeSharerId: string | null;
  pinnedPeerId?: string | null;
  isHostViewer: boolean;
  onOpenActions: (participant: Participant) => void;
  onTogglePin: (peerId: string) => void;
  participants: Participant[];
}

function getGridClass(count: number, hasFeatured: boolean) {
  if (hasFeatured) {
    return "grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_22rem] grid-rows-[minmax(18rem,1fr)_12rem] lg:grid-rows-1";
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
  if (count <= 9) {
    return "grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(8rem,1fr)] sm:auto-rows-[minmax(14rem,1fr)]";
  }
  return "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 auto-rows-[minmax(8rem,1fr)] sm:auto-rows-[minmax(12rem,1fr)]";
}

export function VideoGrid({
  activeSharerId,
  pinnedPeerId,
  isHostViewer,
  onOpenActions,
  onTogglePin,
  participants,
}: VideoGridProps) {
  const featuredId = activeSharerId || pinnedPeerId;
  const featuredParticipant = participants.find((p) => p.peerId === featuredId);
  const hasFeatured = Boolean(featuredParticipant && participants.length > 1);

  return (
    <section
      className={cn(
        "grid min-h-[calc(100vh-14rem)] gap-4",
        getGridClass(participants.length, hasFeatured),
      )}
    >
      {hasFeatured && featuredParticipant ? (
        <div className="min-h-[24rem] h-full lg:col-start-1 lg:row-span-full">
          <VideoTile
            key={featuredParticipant.peerId}
            onOpenActions={onOpenActions}
            onTogglePin={() => onTogglePin(featuredParticipant.peerId)}
            isPinned={pinnedPeerId === featuredParticipant.peerId}
            participant={featuredParticipant}
            showManageButton={isHostViewer && !featuredParticipant.isLocal && !featuredParticipant.isHost}
          />
        </div>
      ) : null}
      
      <div className={hasFeatured ? "beam-scrollbar flex gap-4 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:col-start-2 h-full pb-2 lg:pb-0" : "contents"}>
        {participants
          .filter((p) => !hasFeatured || p.peerId !== featuredId)
          .map((participant) => (
            <div className={hasFeatured ? "min-w-[12rem] sm:min-w-[16rem] flex-1 lg:min-w-0 lg:min-h-[14rem]" : "contents"} key={participant.peerId}>
              <VideoTile
                onOpenActions={onOpenActions}
                onTogglePin={() => onTogglePin(participant.peerId)}
                isPinned={pinnedPeerId === participant.peerId}
                participant={participant}
                showManageButton={isHostViewer && !participant.isLocal && !participant.isHost}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
