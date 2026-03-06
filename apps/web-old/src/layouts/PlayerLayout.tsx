import React, { useMemo, useState } from "react";
import PlayerSidebar from "../components/player/PlayerSidebar";
import PlayerHeader from "../components/player/PlayerHeader";
import { PLAYER_NAV } from "../components/player/playerNav";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function PlayerLayout({ title = "Page Title", children }: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => PLAYER_NAV, []);

  const onLogout = () => {
    console.log("logout");
  };

  return (
    <div className="min-h-screen w-full bg-[var(--neo-bg)]">
      <div className="flex">
        <PlayerSidebar
          open={open}
          onClose={() => setOpen(false)}
          items={items}
          playerName="Player name"
          clubName="associated club"
        />

        <main className="flex-1">
          <PlayerHeader
            title={title}
            onMenu={() => setOpen(true)}
            onLogout={onLogout}
          />
          <div className="mx-auto max-w-[1500px] px-3 pb-10 pt-6 md:px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}