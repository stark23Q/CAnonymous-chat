import { customAlphabet } from "nanoid";

const adjectives = [
  "Silent",
  "Shadow",
  "Phantom",
  "Hidden",
  "Cipher",
  "Velvet",
  "Nova",
  "Frost",
  "Echo",
  "Lunar",
  "Obsidian",
  "Midnight",
  "Ghost",
  "Raven",
  "Signal",
  "Static"
];

const nouns = [
  "Fox",
  "Wolf",
  "Raven",
  "Comet",
  "Pulse",
  "Vortex",
  "Quill",
  "Spark",
  "Drift",
  "Cipher",
  "Halo",
  "Byte",
  "Mosaic",
  "Nova",
  "X",
  "17"
];

const seedId = customAlphabet("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", 14);

export function createPseudonym(): { anonymousName: string; avatarSeed: string } {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)] ?? "Shadow";
  const noun = nouns[Math.floor(Math.random() * nouns.length)] ?? "Fox";
  const suffix = Math.random() > 0.65 ? Math.floor(Math.random() * 90 + 10).toString() : "";

  return {
    anonymousName: `${adjective}${noun}${suffix}`,
    avatarSeed: seedId()
  };
}
