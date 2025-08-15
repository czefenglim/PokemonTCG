// components/SocialShareModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

/* ---------- Types ---------- */
export interface PokemonCard {
  tokenId: number;
  name: string;
  rarity?: string;
  imageUrl?: string;
  transactionHash?: string;
  networkName?: string;
  blockchainVerified?: boolean;
}

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: PokemonCard[]; // required for caption generation
  packType?: string; // optional, defaults below
  maxRareNames?: number; // optional limit for rare names listed
}

/* ---------- Helpers ---------- */
function buildCaption(
  cards: PokemonCard[],
  packType = 'Pokemon Booster Pack',
  maxRareNames = 5
) {
  const total = cards.length;
  const rare = cards.filter((c) => c.rarity && c.rarity !== 'Common');
  const rareList = rare
    .slice(0, maxRareNames)
    .map((c) => `✨ ${c.name} (${c.rarity})`)
    .join('\n');
  const more =
    rare.length > maxRareNames
      ? `\n…and ${rare.length - maxRareNames} more!`
      : '';

  const blockchainText = cards.some((c) => c.transactionHash)
    ? `\n\n⛓️ Verified on blockchain`
    : '';

  return `🎉 Just opened a ${packType}!
📦 ${total} cards revealed
💎 ${rare.length} rare cards found!
${rareList}${more}${blockchainText}

#PokemonTCG #PackOpening #BlockchainGaming`;
}

/* ---------- Toast ---------- */
export function Toast({
  message,
  isVisible,
  onClose,
}: ToastProps): JSX.Element | null {
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 50 }}
          className="fixed top-4 right-4 z-[100] bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg border border-white/20"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Platform intents ---------- */
type Platform =
  | 'caption' // text-only (works fully offline)
  | 'twitter'
  | 'whatsapp'
  | 'facebook'; // requires a public URL

function buildIntentUrl(platform: Platform, caption: string) {
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        caption
      )}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(caption)}`;

    case 'caption':
    default:
      // Encode the caption text itself (no network needed)
      return caption;
  }
}

/* ---------- Modal: QR with platform selector ---------- */
export function SocialShareModal({
  isOpen,
  onClose,
  cards,
  packType = 'Pokemon Booster Pack',
  maxRareNames = 5,
}: SocialShareModalProps): JSX.Element {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [qrError, setQrError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Default to Twitter for “no-copy” experience; change if you prefer
  const [platform, setPlatform] = useState<Platform>('whatsapp');

  const caption = useMemo(
    () => buildCaption(cards, packType, maxRareNames),
    [cards, packType, maxRareNames]
  );

  // Optional: provide a public/demo URL for Facebook sharing via .env.local
  const demoUrl = process.env.NEXT_PUBLIC_SHARE_DEMO_URL;

  // QR payload (either intent URL or text)
  const qrPayload = useMemo(
    () => buildIntentUrl(platform, caption),
    [platform, caption]
  );

  useEffect(() => {
    if (!isOpen || !qrPayload) return;
    let cancelled = false;

    (async () => {
      try {
        setQrLoading(true);
        setQrError('');
        const dataUrl = await QRCode.toDataURL(qrPayload, {
          margin: 1,
          scale: 8,
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (e) {
        if (!cancelled) setQrError('Failed to generate QR code');
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, qrPayload]);

  const showToastNow = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      showToastNow('Caption copied!');
    } catch {
      showToastNow('Unable to copy');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `share-${platform}.png`;
    a.click();
    showToastNow('QR downloaded');
  };

  if (!cards?.length) return <></>;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-2xl">🔗</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Scan to Share
                </h3>
              </div>

              {/* Platform selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(
                  [
                    { id: 'twitter', label: 'X/Twitter' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'caption', label: 'Text Only' },
                  ] as { id: Platform; label: string }[]
                ).map(({ id, label }) => {
                  const disabled = id === 'facebook' && !demoUrl; // FB needs a URL
                  const active = platform === id;
                  return (
                    <button
                      key={id}
                      disabled={disabled}
                      onClick={() => setPlatform(id)}
                      className={[
                        'text-xs py-2 px-2 rounded-lg border transition',
                        active
                          ? 'bg-yellow-600 text-white border-yellow-500'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600',
                        disabled ? 'opacity-50 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* QR section */}
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5 flex flex-col items-center gap-3 mb-6">
                {qrLoading ? (
                  <div className="text-gray-300 text-sm">Generating QR…</div>
                ) : qrError ? (
                  <div className="text-red-300 text-sm">{qrError}</div>
                ) : (
                  <>
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="Share QR"
                        className="w-40 h-40 rounded-lg shadow-md bg-white p-2"
                      />
                    )}

                    {/* Payload preview */}
                    {platform === 'caption' ? (
                      <pre className="text-[11px] text-gray-300 break-words whitespace-pre-wrap text-center max-h-40 overflow-auto px-2">
                        {caption}
                      </pre>
                    ) : (
                      <div className="text-[11px] text-blue-300 break-all text-center">
                        Scan the QR to open the app with your caption.
                      </div>
                    )}

                    <div className="flex gap-2 w-full">
                      {/* Only show copy when in caption mode */}
                      {platform === 'caption' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCopyCaption}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg border border-slate-600 text-sm"
                        >
                          Copy Caption
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadQr}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg border border-slate-600 text-sm"
                      >
                        Download QR
                      </motion.button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center">
                      Instagram doesn’t support prefilled captions via links.
                    </p>
                  </>
                )}
              </div>

              {/* Close */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-600"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

/* ---------- Centered button to open the modal ---------- */
export function ShareButtonTextQR({
  className = '',
  cards,
  label = 'Share (QR)',
}: {
  className?: string;
  cards: PokemonCard[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className={`bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-8 py-3 rounded-xl shadow-lg font-medium border border-yellow-400/30 transition-all duration-300 flex items-center gap-2 ${className}`}
        >
          <span className="text-lg">📱</span>
          {label}
        </motion.button>
      </div>

      <SocialShareModal
        isOpen={open}
        onClose={() => setOpen(false)}
        cards={cards}
      />
    </>
  );
}

/* Re-export alias so existing imports still work */
export { ShareButtonTextQR as ShareButton };
