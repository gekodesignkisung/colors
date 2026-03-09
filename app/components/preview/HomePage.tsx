'use client';

import { useState, useEffect } from 'react';
import { useColorStore } from '@/store/colorStore';
import { usePreviewContext } from './PreviewContext';

function useCol() {
  const tokens = useColorStore(s => s.tokens);
  return (variant: string, type: string, state: string): string =>
    tokens.find(t =>
      t.rule.namingVariant === variant &&
      t.rule.namingType    === type    &&
      t.rule.namingState   === state
    )?.color ?? '#cccccc';
}


function useVariants() {
  const tokens = useColorStore(s => s.tokens);
  return [...new Set(tokens.filter(t => t.rule.namingVariant).map(t => t.rule.namingVariant!))];
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const col = useCol();
  const { getColor, isEditMode, selectedElementId, setSelectedElementId, setPanelAnchor } = usePreviewContext();
  const variants = useVariants();
  const primary   = variants[0] ?? 'primary';
  const secondary = variants[1] ?? variants[0] ?? 'primary';
  const tertiary  = variants[2] ?? variants[1] ?? variants[0] ?? 'primary';

  const navItems = ['Home', 'Features', 'Pricing', 'Contact'];
  const [activeNav, setActiveNav] = useState(0);

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedElementId(elementId);
    setPanelAnchor({ x: e.clientX, y: e.clientY });
  };

  const editStyle = (elementId: string): React.CSSProperties =>
    isEditMode
      ? {
          outline:
            selectedElementId === elementId
              ? '2px solid #6750a4'
              : '1px dashed rgba(103,80,164,0.4)',
          outlineOffset: '2px',
          cursor: 'pointer',
        }
      : {};

  if (!mounted) {
    return <div id="page-bg" className="flex flex-col min-h-full w-full" style={{ backgroundColor: getColor('page-bg','neutral','background','default') }} />;
  }

  return (
    <div id="page-bg" className="flex flex-col min-h-full w-full" style={{ backgroundColor: getColor('page-bg','neutral','background','default') }}>
      {/* Top Navigation */}
      <nav
        id="nav-bg"
        className="flex items-center justify-between px-8 h-16 sticky top-0 z-50"
        
        style={{ backgroundColor: getColor('nav-bg', primary, 'background', 'default'), borderBottom: `1px solid ${getColor('nav-bg', primary, 'outline', 'default')}`, ...editStyle('nav-bg') }}
      >
        <div className="flex items-center gap-2">
          <div
            id="nav-logo-bg"
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            
            style={{ backgroundColor: getColor('nav-logo-bg', secondary, 'background', 'default'), color: getColor('nav-logo-bg', secondary, 'text', 'default'), ...editStyle('nav-logo-bg') }}
          >
            D
          </div>
          <span id="nav-logo-text" className="font-bold text-lg" style={{ color: getColor('nav-logo-text', primary, 'text', 'default') }}>
            Design System
          </span>
        </div>

        {/* Menu items */}
        <div className="flex items-center gap-8">
          {navItems.map((item, i) => (
            <button
              id={`nav-item-${i}`}
              key={item}
              type="button"
              onClick={() => setActiveNav(i)}
              className="font-medium text-sm transition-opacity hover:opacity-80"
              style={{
                color: getColor(`nav-item-${i}`, primary, 'text', 'default'),
                opacity: activeNav === i ? 1 : 0.7,
                borderBottom: activeNav === i ? `2px solid ${getColor(`nav-item-${i}`, primary, 'text', 'default')}` : 'none',
                paddingBottom: '6px',
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CTA button */}
        <button
          id="nav-cta-bg"
          type="button"
          className="px-6 h-10 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
          
          style={{ backgroundColor: getColor('nav-cta-bg', secondary, 'background', 'default'), color: getColor('nav-cta-bg', secondary, 'text', 'default'), ...editStyle('nav-cta-bg') }}
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section
        id="hero-bg"
        className="px-8 py-20 text-center"
        
        style={{ backgroundColor: getColor('hero-bg', primary, 'background-dark', 'default'), ...editStyle('hero-bg') }}
      >
        <h1 id="hero-title" className="text-5xl font-bold mb-4 max-w-2xl mx-auto" style={{ color: getColor('hero-title', primary, 'text', 'default') }}>
          Beautiful Design Tokens
        </h1>
        <p id="hero-sub" className="text-xl mb-8 mx-auto opacity-90" style={{ color: getColor('hero-sub', primary, 'text', 'default') }}>
          Generate and manage your design system colors with a single tool
        </p>
        <button
          id="hero-cta-bg"
          type="button"
          className="px-8 py-3 rounded-full font-semibold text-base transition-opacity hover:opacity-90 inline-block"
          
          style={{ backgroundColor: getColor('hero-cta-bg', secondary, 'background', 'default'), color: getColor('hero-cta-bg', secondary, 'text', 'default'), ...editStyle('hero-cta-bg') }}
        >
          Explore Documentation
        </button>
      </section>

      {/* Features Section */}
      <section id="features-bg" className="px-8 py-16" style={{ backgroundColor: getColor('features-bg','neutral','background','hover') }}>
        <div className="max-w-6xl mx-auto">
          <h2 id="features-heading" className="text-3xl font-bold mb-12 text-center" style={{ color: getColor('features-heading', primary, 'text', 'default') }}>
            Key Features
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Color Generation', desc: 'Automatically generate color palettes', v: primary },
              { title: 'Design Tokens', desc: 'Export tokens in CSS and JSON formats', v: secondary },
              { title: 'Dark Mode', desc: 'Built-in support for light and dark modes', v: tertiary },
            ].map(({ title, desc, v }, idx) => (
              <div
                id={`feature-card-${idx}`}
                key={title}
                className="p-6 rounded-xl"
                style={{ backgroundColor: getColor(`feature-card-${idx}`, v, 'background', 'hover'), borderColor: getColor(`feature-card-${idx}`, v, 'outline', 'default'), border: `1px solid ${getColor(`feature-card-${idx}`, v, 'outline', 'default')}`, ...editStyle(`feature-card-${idx}`) }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: getColor(`feature-card-${idx}`, v, 'background', 'default'), color: getColor(`feature-card-${idx}`, v, 'text', 'default') }}
                  >
                    ✨
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: getColor(`feature-card-${idx}`, v, 'text', 'default') }}>
                    {title}
                  </h3>
                </div>
                <p className="text-sm opacity-75" style={{ color: getColor(`feature-card-${idx}`, v, 'text', 'default') }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 id="pricing-heading" className="text-3xl font-bold mb-12 text-center" style={{ color: getColor('pricing-heading', primary, 'text', 'default') }}>
            Simple Pricing
          </h2>

          <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { name: 'Starter', price: 'Free', features: ['Basic Colors', 'CSS Export', 'Community Support'], v: secondary },
              { name: 'Pro', price: '$99', features: ['Unlimited Colors', 'All Formats', 'Priority Support'], highlight: true, v: primary },
            ].map(({ name, price, features, highlight, v }, idx) => (
              <div
                id={`pricing-card-${idx}`}
                key={name}
                className="rounded-2xl p-8 border"
                style={{
                  backgroundColor: getColor(`pricing-card-${idx}`, primary, 'card', 'default'),
                  borderColor: getColor(`pricing-card-${idx}`, v, 'border', 'default'),
                  ...editStyle(`pricing-card-${idx}`),
                }}
              >
                <h3 className="text-xl font-bold mb-2" style={{ color: getColor(`pricing-card-${idx}`, v, 'text', 'default') }}>
                  {name}
                </h3>
                <div id={`pricing-price-${idx}`} className="text-3xl font-bold mb-6" style={{ color: getColor(`pricing-card-${idx}`, v, 'text', 'default') }}>
                  {price}
                </div>
                <ul className="mb-8 space-y-3">
                  {features.map(f => (
                    <li key={f} className="text-sm flex items-center gap-2" style={{ color: getColor(`pricing-card-${idx}`, v, 'text', 'default') }}>
                      <span style={{ color: getColor(`pricing-card-${idx}`, v, 'background', 'default') }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  id={`pricing-btn-${idx}`}
                  type="button"
                  className="w-full py-2 rounded-lg font-semibold transition-opacity hover:opacity-90"

                  style={{
                    backgroundColor: getColor(`pricing-btn-${idx}`, highlight ? tertiary : v, 'background', 'default'),
                    color: highlight ? getColor(`pricing-btn-${idx}`, tertiary, 'text', 'default') : getColor(`pricing-btn-${idx}`, v, 'text', 'default'),
                    ...editStyle(`pricing-btn-${idx}`),
                  }}
                >
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta-bg"
        className="px-8 py-20 text-center rounded-2xl mx-8 my-16"
        
        style={{ backgroundColor: getColor('cta-bg', primary, 'background', 'default'), ...editStyle('cta-bg') }}
      >
        <h2 id="cta-heading" className="text-3xl font-bold mb-4" style={{ color: getColor('cta-heading', primary, 'text', 'default') }}>
          Ready to get started?
        </h2>
        <p id="cta-sub" className="text-lg mb-8" style={{ color: getColor('cta-sub', primary, 'text', 'hover') }}>
          Create your design system today with our easy-to-use token generator
        </p>
        <button
          id="cta-button"
          type="button"
          className="px-8 py-3 rounded-lg font-semibold text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: getColor('cta-button', secondary, 'background', 'default'), color: getColor('cta-button', secondary, 'text', 'default') }}
        >
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer
        id="footer-bg"
        className="px-8 py-12"
        
        style={{ backgroundColor: getColor('footer-bg', 'neutral', 'background', 'hover'), borderTop: `1px solid ${getColor('footer-bg','neutral','outline','default')}`, ...editStyle('footer-bg') }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-4 gap-8 mb-8">
            {[
              { title: 'Product', items: ['Features', 'Pricing', 'Security', 'Updates'] },
              { title: 'Company', items: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', items: ['Docs', 'Community', 'Help', 'API'] },
              { title: 'Legal', items: ['Privacy', 'Terms', 'License', 'Cookies'] },
            ].map(({ title, items }) => (
              <div key={title}>
                <h4 className="font-semibold mb-4" style={{ color: getColor('footer-head', 'neutral', 'text', 'default') }}>
                  {title}
                </h4>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item}>
                      <button
                        type="button"
                        className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: getColor('footer-link', 'neutral', 'text', 'default') }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex items-center justify-between" style={{ borderTop: `1px solid ${getColor('footer-head','neutral','outline','default')}` }}>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: getColor('footer-logo','neutral', 'background', 'default'), color: getColor('footer-logo','neutral', 'text', 'default') }}
              >
                D
              </div>
              <span className="font-semibold" style={{ color: getColor('footer-text','neutral', 'text', 'default') }}>
                Design System
              </span>
            </div>
            <p className="text-sm opacity-50" style={{ color: getColor('footer-copy','neutral', 'text', 'default') }}>
              © 2026 Design System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
