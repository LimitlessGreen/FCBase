import { Navigation } from "./Navigation";

interface HeaderProps {
  client?: "load" | "idle" | "visible" | "media" | "only";
}

export function Header({ client = "load" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <Navigation />
    </header>
  );
}
