import { Navigation } from "./Navigation";

interface HeaderProps {
  client?: "load" | "idle" | "visible" | "media" | "only";
  basePath?: string;
}

export function Header({ client = "load", basePath = "" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <Navigation basePath={basePath} />
    </header>
  );
}
