'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FadingVideo } from '@/components/landing/FadingVideo';
import { BlurText } from '@/components/landing/BlurText';
import { ArrowUpRightIcon, PlayIcon, ClockIcon, GlobeIcon } from '@/components/landing/icons';

export default function Home() {
  const HERO_VIDEO =
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4';

  const enter = {
    initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
    animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden bg-black">
        <FadingVideo
          src={HERO_VIDEO}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: '120%', height: '120%' }}
        />

        {/* Navbar */}
        <div className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <div className="liquid-glass h-12 w-64 rounded-full grid place-items-center">
              <span className="font-heading italic text-white text-2xl leading-none">Fork Flow </span>
            </div>

            <div className="hidden md:flex items-center liquid-glass rounded-full px-1.5 py-1.5">
              {['Home', 'Marketplace', 'Builder', 'Dashboard', 'Launch'].map((t) => (
                <Link
                  key={t}
                  href={
                    t === 'Home'
                      ? '/'
                      : t === 'Marketplace'
                        ? '/marketplace'
                        : t === 'Builder'
                          ? '/builder'
                          : t === 'Dashboard'
                            ? '/dashboard'
                            : '/signup'
                  }
                  className="px-3 py-2 text-sm font-medium text-white/90 font-body"
                >
                  {t}
                </Link>
              ))}
              <Link
                href="/marketplace"
                className="ml-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-black whitespace-nowrap inline-flex items-center gap-2"
              >
                Claim a Spot <ArrowUpRightIcon className="h-5 w-5" />
              </Link>
            </div>

            <div className="h-12 w-12 opacity-0" />
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center pt-24 px-4">
            <div className="text-center max-w-4xl">
              <motion.div {...enter} transition={{ ...enter.transition, delay: 0.4 }}>
                <div className="liquid-glass inline-flex items-center rounded-full">
                  <span className="m-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                    New
                  </span>
                  <span className="text-sm text-white/90 pr-3 font-body">
                    ForkFlow Marketplace: buy, rent, and run AI agents instantly
                  </span>
                </div>
              </motion.div>

              <div className="mt-6">
                <BlurText
                  text="Build, Fork, and Deploy Agents at Scale"
                  className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl mx-auto tracking-[-4px]"
                />
              </div>

              <motion.p
                {...enter}
                transition={{ ...enter.transition, delay: 0.8 }}
                className="mt-4 text-sm md:text-base text-white max-w-2xl mx-auto font-body font-light leading-tight"
              >
                ForkFlow is a creator-first marketplace for AI agents. Launch agents from templates,
                monetize with subscriptions or pay-per-use, and give users instant access through
                demo Stripe checkout.
              </motion.p>

              <motion.div
                {...enter}
                transition={{ ...enter.transition, delay: 1.1 }}
                className="flex items-center justify-center gap-6 mt-6"
              >
                <Link
                  href="/marketplace"
                  className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2"
                >
                  Start Exploring <ArrowUpRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href="/builder"
                  className="text-sm font-body text-white/90 inline-flex items-center gap-2"
                >
                  View Builder <PlayIcon className="h-4 w-4" />
                </Link>
              </motion.div>

             
            </div>
          </div>

          {/* Partners */}
          <motion.div
            {...enter}
            transition={{ ...enter.transition, delay: 1.4 }}
            className="pb-8 flex flex-col items-center gap-4"
          >
            <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
              Built with modern AI + web3 primitives.
            </div>
            <div className="flex items-center gap-12 md:gap-16 font-heading italic text-white text-2xl md:text-3xl tracking-tight">
              <span>ForkFlow</span>
              <span>Agents</span>
              <span>Creators</span>
              <span>Payments</span>
              <span>Execution</span>
            </div>
          </motion.div>
        </div>
      </section>

      
    </div>
  );
}
