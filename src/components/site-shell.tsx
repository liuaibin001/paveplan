import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <button
          className="mobile-menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          id="main-navigation"
          className={`main-nav${open ? " nav-open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="/#calculator" onClick={() => setOpen(false)}>
            Calculator
          </a>
          <a href="/guides/measure-driveway" onClick={() => setOpen(false)}>
            Field notes
          </a>
          <a href="/methodology" onClick={() => setOpen(false)}>
            Our method
          </a>
          <a
            className="nav-action"
            href="/#calculator"
            onClick={() => setOpen(false)}
          >
            Plan your project <ArrowUpRight size={15} />
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top content-width">
        <div className="footer-intro">
          <Brand inverse />
          <p>
            Measure thoughtfully.
            <br />
            Build a clearer material plan.
          </p>
        </div>
        <div>
          <h2>THE WORKBENCH</h2>
          <a href="/#calculator">Asphalt calculator</a>
          <a href="/guides/asphalt-coverage">Coverage per ton</a>
          <a href="/guides/asphalt-density">Density &amp; units</a>
        </div>
        <div>
          <h2>FIELD NOTES</h2>
          <a href="/guides/measure-driveway">Measure your project</a>
          <a href="/guides/asphalt-material-vs-installed-cost">
            Understand the cost
          </a>
          <a href="/methodology">Method &amp; assumptions</a>
        </div>
        <div>
          <h2>BEHIND THE NUMBERS</h2>
          <a href="/about">About PavePlan</a>
          <a href="/editorial-policy">Sources &amp; corrections</a>
          <a href="/contact">Report an issue</a>
        </div>
      </div>
      <div className="footer-bottom content-width">
        <span>
          &copy; {new Date().getFullYear()} PavePlan. Built for better
          estimates.
        </span>
        <div>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span className="footer-coordinate">FEET. INCHES. NO GUESSWORK.</span>
        </div>
      </div>
    </footer>
  );
}
