'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

type Member = {
  name: string;
  role: string;
  photo: string;
  links?: {
    label: 'GitHub' | 'LinkedIn' | 'Email' | 'Portfolio';
    href: string;
  }[];
};

const members: Member[] = [
  {
    name: 'GAN MING HUI',
    role: 'Leader',
    photo: '/images/team/member1.jpg',
    links: [
      { label: 'GitHub', href: 'https://github.com/minghui0721' },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/gan-ming-hui-8311bb293/',
      },
    ],
  },
  {
    name: 'LIM CZE FENG',
    role: 'Membee',
    photo: '/images/team/member2.jpg',
  },
  {
    name: 'LIM ZHI XIANG',
    role: 'Membee',
    photo: '/images/team/member3.jpeg',
  },
  {
    name: 'CHEN YU RUI',
    role: 'Member',
    photo: '/images/team/member4.jpg',
  },
];

export default function AboutContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-200">
        <p className="text-sm font-semibold">
          Academic Project — Non-commercial coursework at Asia Pacific
          University (APU).
        </p>
      </div>

      <div>
        <motion.h1
          className="text-2xl md:text-3xl font-extrabold"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          About Us
        </motion.h1>
        <motion.p
          className="mt-3 text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          We are students from <strong>Asia Pacific University (APU)</strong>.
          This prototype explores trading-card mechanics with blockchain
          integration.
        </motion.p>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {members.map((m, i) => (
          <motion.li
            key={m.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="group rounded-2xl border border-gray-800 bg-gray-900/40 p-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Image
                src={m.photo || '/images/team/placeholder.jpg'}
                alt={`${m.name} — ${m.role}`}
                fill
                sizes="(min-width:1024px) 250px, (min-width:640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={i < 2}
              />
            </div>
            <div className="mt-3">
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-gray-400">{m.role}</div>
            </div>
            {m.links?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-xs rounded-md border border-cyan-500/30 px-2 py-1 text-cyan-300 hover:border-cyan-400"
                    target={l.href.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </motion.li>
        ))}
      </ul>

      <div className="rounded-2xl border border-cyan-900 bg-cyan-900/20 p-4 text-sm text-gray-300">
        Our assignment references existing trading card games for academic
        discussion only. We do not use official Pokémon artwork, logos, or
        character names in this prototype, and we are not affiliated with
        Nintendo, Game Freak, Creatures, or The Pokémon Company.
      </div>
    </div>
  );
}
