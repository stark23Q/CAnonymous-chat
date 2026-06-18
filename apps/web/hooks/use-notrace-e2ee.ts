import { useState, useEffect } from "react";
import { decryptText } from "@/lib/e2ee";
import type { ChatMessage } from "@/lib/types";

export function useNoTraceE2EE({
  messages,
  selectedCommunityId,
  selectedChannelId,
  e2eeMode
}: {
  messages: ChatMessage[];
  selectedCommunityId: string;
  selectedChannelId: string;
  e2eeMode?: boolean;
}) {
  const [groupPassphrases, setGroupPassphrases] = useState<Record<string, string>>({});
  const [groupKeys, setGroupKeys] = useState<Record<string, CryptoKey>>({});
  const [decryptedContents, setDecryptedContents] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!e2eeMode) {
      return;
    }
    const key = groupKeys[selectedCommunityId];
    if (!key) {
      return;
    }

    let active = true;

    async function decryptAll() {
      const newDecrypted: Record<string, string> = {};
      let changed = false;
      for (const msg of messages) {
        if (msg.channelId === selectedChannelId && msg.content && !decryptedContents[msg.id]) {
          try {
            const dec = await decryptText(msg.content, key);
            newDecrypted[msg.id] = dec;
            changed = true;
          } catch (err) {
            newDecrypted[msg.id] = "[Decryption Failed]";
            changed = true;
          }
        }
      }

      if (changed && active) {
        setDecryptedContents((current) => ({
          ...current,
          ...newDecrypted
        }));
      }
    }

    void decryptAll();

    return () => {
      active = false;
    };
  }, [messages, groupKeys, selectedCommunityId, e2eeMode, selectedChannelId]);

  return {
    groupPassphrases,
    setGroupPassphrases,
    groupKeys,
    setGroupKeys,
    decryptedContents,
    setDecryptedContents
  };
}
