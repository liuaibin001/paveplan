import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";

const navigation = [
  { href: "/", label: "Calculator" },
  { href: "/guides/asphalt-coverage", label: "Coverage per ton" },
  { href: "/#guides-heading", label: "Planning guides" },
  { href: "/methodology", label: "Our method" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setOpen(false);
    requestAnimationFrame(() => toggleRef.current?.focus());
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => toggleRef.current?.focus());
      }
      if (event.key !== "Tab") return;
      const controls =
        menuRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = navigation.map(({ href, label }) => (
    <a
      key={href}
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      onClick={() => setOpen(false)}
    >
      {label}
    </a>
  ));

  return (
    <div className="app-shell">
      <div className="site-surface" inert={open || undefined}>
        <header className="site-header">
          <div className="header-inner content-width">
            <Brand />
            <nav className="desktop-navigation" aria-label="Main navigation">
              {links}
            </nav>
            <a className="header-help" href="/contact">
              Help <ArrowUpRight size={14} />
            </a>
            <button
              ref={toggleRef}
              className="shell-icon-button mobile-navigation-toggle"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>
        {children}
        <SiteFooter />
      </div>
      {open && (
        <div className="mobile-navigation-layer">
          <button
            className="navigation-scrim"
            aria-label="Close navigation"
            onClick={closeMenu}
          />
          <div
            ref={menuRef}
            className="mobile-navigation-panel"
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="mobile-menu-heading">
              <Brand />
              <button
                className="shell-icon-button"
                aria-label="Close navigation"
                onClick={closeMenu}
              >
                <X size={22} />
              </button>
            </div>
            <nav aria-label="Mobile navigation">
              {links}
              <a href="/about">About PavePlan</a>
              <a href="/contact">Help &amp; feedback</a>
            </nav>
            <p className="mobile-menu-note">
              A clearer start to your next paving project.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main content-width">
        <div className="footer-brand">
          <Brand />
          <p>
            Material estimates.
            <br /> Every assumption included.
          </p>
        </div>
        <nav aria-label="Planning resources">
          <p>Plan your project</p>
          <a href="/guides/measure-driveway">Measure a driveway</a>
          <a href="/guides/asphalt-density">Asphalt density &amp; units</a>
          <a href="/guides/asphalt-material-vs-installed-cost">
            Material vs. installed cost
          </a>
        </nav>
        <nav aria-label="About PavePlan">
          <p>About PavePlan</p>
          <a href="/about">About the project</a>
          <a href="/editorial-policy">Sources &amp; corrections</a>
          <a href="/contact">Help &amp; feedback</a>
        </nav>
      </div>
      <div className="footer-bottom content-width">
        <p>&copy; {new Date().getFullYear()} PavePlan</p>
        <nav aria-label="Legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span>Free to use. No account needed.</span>
      </div>
    </footer>
  );
}
