'use client';

import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import Button from '@/components/ui/button';
import { NoorMark } from '@/components/nura-mark';

export default function HomePage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 24, stiffness: 300 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="max-w-3xl space-y-8">
        <motion.div variants={itemVariants}>
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 rounded-full shadow-2xs">
            <NoorMark size={16} className="text-terracotta-600" />
            <span>Soin Numérique • Maroc • Conforme CNDP</span>
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="font-display text-6xl sm:text-7xl font-medium text-charcoal tracking-tight leading-[1.0]"
        >
          Votre cabinet,
          <br />
          <span className="text-terracotta-600">unifié.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto"
        >
          Noor centralise les dossiers patients, les rendez-vous et la
          facturation de vos cliniques. Chaque clinique reste strictement
          cloisonnée — vos données de santé ne quittent jamais votre équipe.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Link href="/auth/login">
            <Button size="lg" className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium px-6 py-3">
              Accéder à l&apos;espace praticien
            </Button>
          </Link>
          <Link href="/clinic">
            <Button variant="outline" size="lg" className="border-gray-300">
              Paramètres Cabinet
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="outline" size="lg" className="border-gray-300">
              Gestion de l&apos;équipe
            </Button>
          </Link>
        </motion.div>

        {/* Feature Cards with subtle hover lift and spring response */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left"
        >
          <motion.div
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
          >
            <Link
              href="/clinic"
              className="sheet-card p-6 flex flex-col gap-3 hover:border-terracotta-300 hover:shadow-md transition-all block h-full"
            >
              <NoorMark size={28} className="text-terracotta-600" />
              <div>
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  Isolation multi-tenant
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Données de chaque clinique strictement cloisonnées par
                  clinic_id et vérifiées à chaque requête.
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
          >
            <Link
              href="/agenda"
              className="sheet-card p-6 flex flex-col gap-3 hover:border-terracotta-300 hover:shadow-md transition-all block h-full"
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                💬
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  WhatsApp 1-Clic
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Rappels interactifs en Darija marocaine réduisant l&apos;absentéisme de plus de 60%.
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
          >
            <Link
              href="/team"
              className="sheet-card p-6 flex flex-col gap-3 hover:border-terracotta-300 hover:shadow-md transition-all block h-full"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                🛡️
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  Conformité CNDP
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chiffrement AES-256-GCM du CIN marocain et journal d&apos;audit légal (Loi 09-08).
                </p>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
