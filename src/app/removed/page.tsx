import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function RemovedPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room: roomCode } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,124,164,0.2),transparent_28%),linear-gradient(180deg,#110d18,#050509)] px-4 text-white">
      <div className="beam-panel max-w-lg rounded-[2rem] p-8 text-center">
        <div className="mx-auto flex w-fit items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 p-3">
          <Image alt="Beam logo" height={72} src="/logo.png" width={72} />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.32em] text-white/40">Beam</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-0.05em]">
          You were removed from this room
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/62">
          {roomCode
            ? `Your session in room ${roomCode} was ended by the host.`
            : "Your session was ended by the host."}{" "}
          You can return home and create a new Beam room at any time.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
