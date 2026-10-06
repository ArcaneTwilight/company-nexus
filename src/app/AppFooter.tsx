export function AppFooter() {
  return (
    <footer className="pt-8 border-t border-border flex justify-center items-center text-fg-subtle text-[12px] font-mono">
      <span>© {new Date().getFullYear()} Nexus Dashboard</span>
    </footer>
  );
}
