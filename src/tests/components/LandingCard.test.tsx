import type { ImgHTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingCard } from "@/components/landing/LandingCard";
import { useBeamStore } from "@/store/useBeamStore";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    const { priority, ...rest } = props as ImgHTMLAttributes<HTMLImageElement> & {
      priority?: boolean;
    };
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" {...rest} />
    );
  },
}));

vi.mock("@/lib/generateRoomCode", async () => {
  const actual = await vi.importActual<typeof import("@/lib/generateRoomCode")>(
    "@/lib/generateRoomCode",
  );

  return {
    ...actual,
    generateRoomCode: () => "B3K7PQ",
  };
});

describe("LandingCard", () => {
  beforeEach(() => {
    push.mockReset();
    window.sessionStorage.clear();
    useBeamStore.setState({
      copyLinkStatus: "idle",
      displayName: "",
      isParticipantsPanelOpen: false,
    });
  });

  it(
    "creates a room, stores the display name, and routes to the room",
    async () => {
      render(<LandingCard />);

      fireEvent.change(screen.getByLabelText("Display name"), {
        target: { value: "Samin" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Create Room" }));

      expect(window.sessionStorage.getItem("beam-display-name")).toBe("Samin");
      expect(push).toHaveBeenCalledWith("/room/B3K7PQ");
    },
    10000,
  );

  it("uppercases join codes and routes to the matching room", async () => {
    render(<LandingCard />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Samin" },
    });
    fireEvent.change(screen.getByLabelText("Room code"), {
      target: { value: "ab23pq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join Room" }));

    expect(push).toHaveBeenCalledWith("/room/AB23PQ");
  });

  it("blocks room entry when no display name is present", async () => {
    render(<LandingCard />);

    fireEvent.click(screen.getByRole("button", { name: "Create Room" }));

    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByText("Add your name before creating or joining a room."),
    ).toBeInTheDocument();
  });
});
