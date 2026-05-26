'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/landing/icons';

export function MarketplaceNav() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <Link
          href="/"
          className="liquid-glass h-12 w-64 rounded-full grid place-items-center shrink-0"
        >
          <span className="font-heading italic text-white text-2xl leading-none tracking-tight">
            Fork Flow
          </span>
        </Link>

        <nav className="hidden md:flex items-center liquid-glass rounded-full px-1.5 py-1.5">
          {[
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/marketplace' },
            { label: 'Builder', href: '/builder' },
            { label: 'Dashboard', href: '/dashboard' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-black whitespace-nowrap inline-flex items-center gap-2"
          >
            Sign in <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </nav>

        <div className="h-12 w-12 shrink-0 md:hidden" aria-hidden />
      </div>
    </header>
  );
}
