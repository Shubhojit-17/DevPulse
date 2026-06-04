"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface UserMenuProps {
  name?: string | null;
  image?: string | null;
}

export function UserMenu({ name, image }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-panel/70 px-4 py-2 shadow-soft">
      {image ? (
        <Image
          src={image}
          alt={name ?? "User"}
          width={28}
          height={28}
          className="rounded-full"
        />
      ) : (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground/10 text-xs">
          {(name ?? "U").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="text-xs">
        <p className="font-medium text-foreground">{name ?? "Developer"}</p>
        <p className="text-muted-foreground">Signed in</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
