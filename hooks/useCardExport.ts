import { ExportImageCard, ExportImageCardProps, CARD_HEIGHT, CARD_WIDTH, ITEMS_PER_PAGE } from '@/components/ui/ExportImageCard';
import type { ExportRow } from '@/components/ui/ExportImageCard';
import { captureViewImage, shareImage } from '@/utils/captureImage';
import { createElement, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type { ExportRow };

function chunk<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

function today(): string {
  return new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export { today as todayStr };

export function useCardExport() {
  const cardRef = useRef<View>(null);
  const [cardProps, setCardProps] = useState<ExportImageCardProps | null>(null);
  const busyRef = useRef(false);

  // Off-screen card element — include in the component's JSX
  const cardElement = cardProps
    ? createElement(
        View,
        { ref: cardRef, pointerEvents: 'none' as const, style: styles.offscreen },
        createElement(ExportImageCard, cardProps)
      )
    : null;

  async function _capturePage(props: ExportImageCardProps): Promise<string> {
    return new Promise((resolve, reject) => {
      setCardProps(props);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              const uri = await captureViewImage(cardRef);
              resolve(uri);
            } catch (e) {
              reject(e);
            }
          }, 120);
        });
      });
    });
  }

  async function exportImages(
    title: string,
    subtitle: string,
    rows: ExportRow[],
    footer?: string
  ): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const pages = chunk(rows, ITEMS_PER_PAGE);
      const uris: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        const pageLabel = pages.length > 1 ? `${i + 1} / ${pages.length}` : undefined;
        const uri = await _capturePage({
          title,
          subtitle,
          rows: pages[i],
          footer: i === pages.length - 1 ? footer : undefined,
          pageLabel,
        });
        uris.push(uri);
      }
      setCardProps(null);
      for (const uri of uris) {
        await shareImage(uri, title);
      }
    } finally {
      busyRef.current = false;
      setCardProps(null);
    }
  }

  return { cardElement, exportImages };
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    opacity: 0,
  },
});
