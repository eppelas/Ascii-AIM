import { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import { useAnimationFrame, useMotionValue, animate } from 'framer-motion';
import { motion } from 'motion/react';
import { RefreshCw, Play, Pause, Video, Copy, Check, FileDown, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Upload, Maximize2, LayoutGrid } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import defaultExamples from './data/examples.json';
import { svgLibrary } from './data/svgLibrary';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ExamplePreset = {
  name: string;
  style: 'classic' | 'technical' | 'blueprint' | 'glitch' | 'complex-ascii' | string;
  shapes: string[];
  color: string;
  bgColor?: string;
};

const DEFAULT_EXAMPLES = defaultExamples as ExamplePreset[];
const CUSTOM_EXAMPLES_STORAGE_KEY = 'ascii-aim-custom-examples';

function getDefaultBackgroundForStyle(style: ExamplePreset['style']) {
  if (style === 'technical') return '#050505';
  if (style === 'blueprint') return '#0a1a3a';
  if (style === 'complex-ascii') return '#08080a';
  return '#111113';
}

function readCustomExamples(): ExamplePreset[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_EXAMPLES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read saved examples:', error);
    return [];
  }
}

function writeCustomExamples(examples: ExamplePreset[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_EXAMPLES_STORAGE_KEY, JSON.stringify(examples));
}

function mergeExamples(customExamples: ExamplePreset[]) {
  return [...DEFAULT_EXAMPLES, ...customExamples];
}

// --- Data Definitions ---

// 1. The ASCII Art Data (Source)
const asciiArt = [
  [ // 0: Neural Architecture (Complex, Layered)
    "   .-----------.   ",
    "  / [ SYNAPSE ] \\  ",
    " |  { 010101 }  | ",
    " |   < CORE >   | ",
    " |  { 101010 }  | ",
    "  \\ [ NETWORK ] /  ",
    "   '-----------'   "
  ],
  [ // 1: Cognitive Mirror (Reflection, Symmetry)
    "  <===[ REF ]===>  ",
    "  |  (O) | (O)  |  ",
    "  |  ---[X]---  |  ",
    "  |  (O) | (O)  |  ",
    "  <===[ LEX ]===>  "
  ],
  [ // 2: Latent Space (Density, Symbols)
    " @ # % & * + . ~ ",
    " ~ . + * & % # @ ",
    " @ # % & * + . ~ ",
    " ~ . + * & % # @ ",
    " @ # % & * + . ~ "
  ],
  [ // 3: Recursive Logic (Nested Structures)
    " [ [ [ [ X ] ] ] ] ",
    " [ [  { --- }  ] ] ",
    " [   < / | \\ >   ] ",
    " [  [ (  O  ) ]  ] ",
    " [ [ [ [ X ] ] ] ] "
  ],
  [ // 4: Ethical Framework (Boundaries, Foundation)
    " +---------------+ ",
    " | [ PRINCIPLE ] | ",
    " |---------------| ",
    " | [ INTEGRITY ] | ",
    " +---------------+ "
  ],
  [ // 5: Data Synthesis (Merging Streams)
    "  >>>>> [X] <<<<<  ",
    "  ----- (O) -----  ",
    "  <<<<< [X] >>>>>  ",
    "  ----- (O) -----  ",
    "  >>>>> [X] <<<<<  "
  ],
  [ // 6: The Weaver (Synergy, Interlocking)
    "  /\\  /\\  /\\  /\\  ",
    " <  ><  ><  ><  > ",
    "  \\/  \\/  \\/  \\/  ",
    "  /\\  /\\  /\\  /\\  ",
    " <  ><  ><  ><  > ",
    "  \\/  \\/  \\/  \\/  "
  ],
  [ // 7: Cognitive Core (Radiation, Energy)
    "      \\ | /      ",
    "    --[ O ]--    ",
    "   / / | \\ \\   ",
    "  | | (X) | |  ",
    "   \\ \\ | / /   ",
    "    --[ O ]--    ",
    "      / | \\      "
  ],
  [ // 8: Human-AI Synergy (Interlocking Minds)
    " (H) <========> (A) ",
    "  \\   /  ||  \\   /  ",
    "   >-[ SYNC ]-<   ",
    "  /   \\  ||  /   \\  ",
    " (I) <========> (I) "
  ],
  [ // 9: Synthetic Consciousness (Evolving)
    "  .-------------.  ",
    " /  [ EVOLVE ]  \\ ",
    "|  { 01010101 }  |",
    "|  <  MIND  >  |",
    "|  { 10101010 }  |",
    " \\  [ ASCEND ]  / ",
    "  '-------------'  "
  ],
  [ // 10: Data Horizon (Perspective, Future)
    "  _________________  ",
    "  \\               /  ",
    "   \\  [ FUTURE ] /   ",
    "    \\-----------/    ",
    "     \\ [ NOW ] /     ",
    "      \\_______/      "
  ],
  [ // 11: Neural Loom (Weaving Thought)
    "  | | | | | | | |  ",
    "  +-+-+-+-+-+-+-+  ",
    "  |X|O|X|O|X|O|X|  ",
    "  +-+-+-+-+-+-+-+  ",
    "  | | | | | | | |  "
  ],
  [ // 12: Latent Explorer (Navigation)
    "   /-----------\\   ",
    "  |  [ SCAN ]   |  ",
    "  |   <--->     |  ",
    "  |  [ MAP ]    |  ",
    "   \\-----------/   "
  ],
  [ // 13: Recursive Feedback (Loop)
    "   .---------.     ",
    "  /  ----->  \\    ",
    " |  | [X] |  |    ",
    "  \\  <-----  /    ",
    "   '---------'     "
  ],
  [ // 14: Ethical Compass (Direction)
    "      [ N ]      ",
    "    /   |   \\    ",
    " [W] ---O--- [E] ",
    "    \\   |   /    ",
    "      [ S ]      "
  ],
  [ // 15: Data Pulse (Rhythm, Life)
    "  ~ ~ ~ ~ ~ ~ ~ ~  ",
    " / \\ / \\ / \\ / \\ / ",
    " | | | | | | | | | ",
    " \\ / \\ / \\ / \\ / \\ ",
    "  ~ ~ ~ ~ ~ ~ ~ ~  "
  ],
  [ // 16: Cognitive Shield (Protection)
    "   /XXXXXXXXXXX\\   ",
    "  |XXXXXXXXXXXXX|  ",
    "  |XXXX[SAFE]XXX|  ",
    "  |XXXXXXXXXXXXX|  ",
    "   \\XXXXXXXXXXX/   "
  ],
  [ // 17: Neural Bridge (Connection)
    " [LEFT] <---> [RIGHT] ",
    "   ||           ||    ",
    "   ||===========||    ",
    "   ||           ||    "
  ],
  [ // 18: The Machine (Robot Face - Complex)
    "   [-----------]   ",
    "  | [X]     [X] |  ",
    "  |    --|--    |  ",
    "  |   [=====]   |  ",
    "   [-----------]   "
  ],
  [ // 19: Community - Node Genesis
    "      (O)      ",
    "       |       ",
    "    --[ ]--    "
  ],
  [ // 20: Community - Peer Connection
    "  (O) <---> (O)  ",
    "   |   [S]   |   ",
    "  (O) <---> (O)  "
  ],
  [ // 21: Practice - Lab Setup
    "   [ LAB_01 ]  ",
    "   |        |  ",
    "   |________|  "
  ],
  [ // 22: Practice - Process Initiation
    "   [ LAB_01 ]  ",
    "   | # # #  |  ",
    "   | EXE:25%|  "
  ],
  [ // 23: Practice - Active Iteration
    "   [ LAB_01 ]  ",
    "   |####### |  ",
    "   | EXE:75%|  "
  ],
  [ // 24: Practice - Artifact Creation
    "   [ RESULT ]  ",
    "   |########|  ",
    "   | ARTIFACT|  ",
    "   [ 0x00FF ]  "
  ],
  [ // 25: Personalization - Latent Point
    "   < SEARCH >  ",
    "   ..........  "
  ],
  [ // 26: Personalization - Radar Scan
    "   < SCANNING > ",
    "   (  .  .  )  ",
    "   ..........  "
  ],
  [ // 27: Personalization - Target Lock
    "   [ TARGET ]  ",
    "     X: 255    ",
    "     Y: 128    ",
    "     ||  ||    "
  ],
  [ // 28: Personalization - Deep Focus
    "  [ PERSONAL ] ",
    "  { TRACK_01 } ",
    "  [[[ (X) ]]]  ",
    "  <-- DEEP --> "
  ]
];

const asciiMetaphors = [
  { name: "Neural Architecture", desc: "Complex cognitive mapping" },
  { name: "Cognitive Mirror", desc: "Reflection of human-AI synergy" },
  { name: "Latent Space", desc: "Hidden dimensions of data" },
  { name: "Recursive Logic", desc: "Self-evolving thought loops" },
  { name: "Ethical Framework", desc: "Foundational principles" },
  { name: "Data Synthesis", desc: "Merging information streams" },
  { name: "The Weaver", desc: "Interlocking neural patterns" },
  { name: "Cognitive Core", desc: "Radiating intelligence" },
  { name: "Human-AI Synergy", desc: "Interlocking minds" },
  { name: "Synthetic Consciousness", desc: "Evolving digital awareness" },
  { name: "Data Horizon", desc: "Perspective on the future" },
  { name: "Neural Loom", desc: "Weaving thought structures" },
  { name: "Latent Explorer", desc: "Navigating hidden spaces" },
  { name: "Recursive Feedback", desc: "Continuous learning loop" },
  { name: "Ethical Compass", desc: "Directional guidance" },
  { name: "Data Pulse", desc: "Rhythm of the ecosystem" },
  { name: "Cognitive Shield", desc: "Protection and safety" },
  { name: "Neural Bridge", desc: "Connecting modes of thought" },
  { name: "The Machine", desc: "Synthetic intelligence" },
  { name: "Node Genesis", desc: "Community: expert node" },
  { name: "Peer Connection", desc: "Community: peer-to-peer" },
  { name: "Lab Setup", desc: "Practice: empty environment" },
  { name: "Process Initiation", desc: "Practice: 25% execution" },
  { name: "Active Iteration", desc: "Practice: 75% execution" },
  { name: "Artifact Creation", desc: "Practice: final result" },
  { name: "Latent Point", desc: "Personalization: search start" },
  { name: "Radar Scan", desc: "Personalization: scanning tracks" },
  { name: "Target Lock", desc: "Personalization: X:255 Y:128" },
  { name: "Deep Focus", desc: "Personalization: deep dive" }
];

// Helper to convert ASCII to a list of segments
// We map each character to a set of lines within a 1x1 cell.
const charMap: Record<string, {x1: number, y1: number, x2: number, y2: number}[]> = {
  '[': [{x1: 0.8, y1: 0, x2: 0.2, y2: 0}, {x1: 0.2, y1: 0, x2: 0.2, y2: 1}, {x1: 0.2, y1: 1, x2: 0.8, y2: 1}],
  ']': [{x1: 0.2, y1: 0, x2: 0.8, y2: 0}, {x1: 0.8, y1: 0, x2: 0.8, y2: 1}, {x1: 0.8, y1: 1, x2: 0.2, y2: 1}],
  '|': [{x1: 0.5, y1: 0, x2: 0.5, y2: 1}],
  '-': [{x1: 0, y1: 0.5, x2: 1, y2: 0.5}],
  '=': [{x1: 0, y1: 0.3, x2: 1, y2: 0.3}, {x1: 0, y1: 0.7, x2: 1, y2: 0.7}],
  '/': [{x1: 0.8, y1: 0, x2: 0.2, y2: 1}],
  '\\': [{x1: 0.2, y1: 0, x2: 0.8, y2: 1}],
  '<': [{x1: 0.8, y1: 0.1, x2: 0.2, y2: 0.5}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.9}],
  '>': [{x1: 0.2, y1: 0.1, x2: 0.8, y2: 0.5}, {x1: 0.8, y1: 0.5, x2: 0.2, y2: 0.9}],
  'X': [{x1: 0.2, y1: 0.2, x2: 0.8, y2: 0.8}, {x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.8}],
  '0': [{x1: 0.2, y1: 0.2, x2: 0.8, y2: 0.2}, {x1: 0.8, y1: 0.2, x2: 0.8, y2: 0.8}, {x1: 0.8, y1: 0.8, x2: 0.2, y2: 0.8}, {x1: 0.2, y1: 0.8, x2: 0.2, y2: 0.2}],
  'x': [{x1: 0.3, y1: 0.3, x2: 0.7, y2: 0.7}, {x1: 0.7, y1: 0.3, x2: 0.3, y2: 0.7}],
  'F': [{x1: 0.8, y1: 0.1, x2: 0.2, y2: 0.1}, {x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.5, x2: 0.7, y2: 0.5}],
  'E': [{x1: 0.8, y1: 0.1, x2: 0.2, y2: 0.1}, {x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.9, x2: 0.8, y2: 0.9}, {x1: 0.2, y1: 0.5, x2: 0.7, y2: 0.5}],
  '#': [{x1: 0.3, y1: 0, x2: 0.3, y2: 1}, {x1: 0.7, y1: 0, x2: 0.7, y2: 1}, {x1: 0, y1: 0.3, x2: 1, y2: 0.3}, {x1: 0, y1: 0.7, x2: 1, y2: 0.7}],
  ':': [{x1: 0.5, y1: 0.3, x2: 0.5, y2: 0.4}, {x1: 0.5, y1: 0.6, x2: 0.5, y2: 0.7}],
  '%': [{x1: 0.2, y1: 0.2, x2: 0.4, y2: 0.2}, {x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.8}, {x1: 0.6, y1: 0.8, x2: 0.8, y2: 0.8}],
  '1': [{x1: 0.4, y1: 0.2, x2: 0.6, y2: 0.1}, {x1: 0.6, y1: 0.1, x2: 0.6, y2: 0.9}, {x1: 0.4, y1: 0.9, x2: 0.8, y2: 0.9}],
  'A': [{x1: 0.2, y1: 0.9, x2: 0.5, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.8, y2: 0.9}, {x1: 0.35, y1: 0.6, x2: 0.65, y2: 0.6}],
  'B': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.7, y1: 0.1, x2: 0.8, y2: 0.3}, {x1: 0.8, y1: 0.3, x2: 0.7, y2: 0.5}, {x1: 0.7, y1: 0.5, x2: 0.2, y2: 0.5}, {x1: 0.7, y1: 0.5, x2: 0.8, y2: 0.7}, {x1: 0.8, y1: 0.7, x2: 0.7, y2: 0.9}, {x1: 0.7, y1: 0.9, x2: 0.2, y2: 0.9}],
  'S': [{x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.2}, {x1: 0.2, y1: 0.2, x2: 0.2, y2: 0.5}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5}, {x1: 0.8, y1: 0.5, x2: 0.8, y2: 0.8}, {x1: 0.8, y1: 0.8, x2: 0.2, y2: 0.8}],
  'T': [{x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.9}],
  'R': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.7, y1: 0.1, x2: 0.8, y2: 0.3}, {x1: 0.8, y1: 0.3, x2: 0.7, y2: 0.5}, {x1: 0.7, y1: 0.5, x2: 0.2, y2: 0.5}, {x1: 0.5, y1: 0.5, x2: 0.8, y2: 0.9}],
  'G': [{x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.2}, {x1: 0.2, y1: 0.2, x2: 0.2, y2: 0.8}, {x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.8}, {x1: 0.8, y1: 0.8, x2: 0.8, y2: 0.5}, {x1: 0.8, y1: 0.5, x2: 0.5, y2: 0.5}],
  '~': [{x1: 0, y1: 0.5, x2: 0.2, y2: 0.3}, {x1: 0.2, y1: 0.3, x2: 0.4, y2: 0.7}, {x1: 0.4, y1: 0.7, x2: 0.6, y2: 0.3}, {x1: 0.6, y1: 0.3, x2: 0.8, y2: 0.7}, {x1: 0.8, y1: 0.7, x2: 1, y2: 0.5}],
  '{': [{x1: 0.8, y1: 0, x2: 0.5, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.4}, {x1: 0.5, y1: 0.4, x2: 0.2, y2: 0.5}, {x1: 0.2, y1: 0.5, x2: 0.5, y2: 0.6}, {x1: 0.5, y1: 0.6, x2: 0.5, y2: 0.9}, {x1: 0.5, y1: 0.9, x2: 0.8, y2: 1}],
  '}': [{x1: 0.2, y1: 0, x2: 0.5, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.4}, {x1: 0.5, y1: 0.4, x2: 0.8, y2: 0.5}, {x1: 0.8, y1: 0.5, x2: 0.5, y2: 0.6}, {x1: 0.5, y1: 0.6, x2: 0.5, y2: 0.9}, {x1: 0.5, y1: 0.9, x2: 0.2, y2: 1}],
  '@': [{x1: 0.5, y1: 0.5, x2: 0.7, y2: 0.5}, {x1: 0.7, y1: 0.5, x2: 0.7, y2: 0.8}, {x1: 0.7, y1: 0.8, x2: 0.3, y2: 0.8}, {x1: 0.3, y1: 0.8, x2: 0.3, y2: 0.2}, {x1: 0.3, y1: 0.2, x2: 0.8, y2: 0.2}, {x1: 0.8, y1: 0.2, x2: 0.8, y2: 0.6}, {x1: 0.8, y1: 0.6, x2: 0.6, y2: 0.6}],
  '&': [{x1: 0.8, y1: 0.8, x2: 0.2, y2: 0.2}, {x1: 0.2, y1: 0.2, x2: 0.8, y2: 0.2}, {x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.8}, {x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.8}],
  '*': [{x1: 0.5, y1: 0.2, x2: 0.5, y2: 0.8}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5}, {x1: 0.3, y1: 0.3, x2: 0.7, y2: 0.7}, {x1: 0.7, y1: 0.3, x2: 0.3, y2: 0.7}],
  '+': [{x1: 0.5, y1: 0.2, x2: 0.5, y2: 0.8}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5}],
  '.': [{x1: 0.45, y1: 0.8, x2: 0.55, y2: 0.8}, {x1: 0.55, y1: 0.8, x2: 0.55, y2: 0.9}, {x1: 0.55, y1: 0.9, x2: 0.45, y2: 0.9}, {x1: 0.45, y1: 0.9, x2: 0.45, y2: 0.8}],
  ',': [{x1: 0.5, y1: 0.8, x2: 0.5, y2: 0.9}, {x1: 0.5, y1: 0.9, x2: 0.4, y2: 1.0}],
  '^': [{x1: 0.2, y1: 0.6, x2: 0.5, y2: 0.3}, {x1: 0.5, y1: 0.3, x2: 0.8, y2: 0.6}],
  'v': [{x1: 0.2, y1: 0.3, x2: 0.5, y2: 0.7}, {x1: 0.5, y1: 0.7, x2: 0.8, y2: 0.3}],
  '_': [{x1: 0, y1: 0.9, x2: 1, y2: 0.9}],
  'M': [{x1: 0.1, y1: 0.9, x2: 0.1, y2: 0.1}, {x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5}, {x1: 0.5, y1: 0.5, x2: 0.9, y2: 0.1}, {x1: 0.9, y1: 0.1, x2: 0.9, y2: 0.9}],
  'W': [{x1: 0.1, y1: 0.1, x2: 0.1, y2: 0.9}, {x1: 0.1, y1: 0.9, x2: 0.5, y2: 0.5}, {x1: 0.5, y1: 0.5, x2: 0.9, y2: 0.9}, {x1: 0.9, y1: 0.9, x2: 0.9, y2: 0.1}],
  'H': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.8, y1: 0.1, x2: 0.8, y2: 0.9}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5}],
  'U': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.8}, {x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.8}, {x1: 0.8, y1: 0.8, x2: 0.8, y2: 0.1}],
  'V': [{x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.9}, {x1: 0.5, y1: 0.9, x2: 0.9, y2: 0.1}],
  'O': [{x1: 0.3, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.7, y1: 0.1, x2: 0.9, y2: 0.3}, {x1: 0.9, y1: 0.3, x2: 0.9, y2: 0.7}, {x1: 0.9, y1: 0.7, x2: 0.7, y2: 0.9}, {x1: 0.7, y1: 0.9, x2: 0.3, y2: 0.9}, {x1: 0.3, y1: 0.9, x2: 0.1, y2: 0.7}, {x1: 0.1, y1: 0.7, x2: 0.1, y2: 0.3}, {x1: 0.1, y1: 0.3, x2: 0.3, y2: 0.1}],
  'C': [{x1: 0.8, y1: 0.2, x2: 0.5, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.2, y2: 0.3}, {x1: 0.2, y1: 0.3, x2: 0.2, y2: 0.7}, {x1: 0.2, y1: 0.7, x2: 0.5, y2: 0.9}, {x1: 0.5, y1: 0.9, x2: 0.8, y2: 0.8}],
  'D': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.1, x2: 0.6, y2: 0.1}, {x1: 0.6, y1: 0.1, x2: 0.9, y2: 0.4}, {x1: 0.9, y1: 0.4, x2: 0.9, y2: 0.6}, {x1: 0.9, y1: 0.6, x2: 0.6, y2: 0.9}, {x1: 0.6, y1: 0.9, x2: 0.2, y2: 0.9}],
  'I': [{x1: 0.3, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.9}, {x1: 0.3, y1: 0.9, x2: 0.7, y2: 0.9}],
  'L': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.9, x2: 0.8, y2: 0.9}],
  'N': [{x1: 0.2, y1: 0.9, x2: 0.2, y2: 0.1}, {x1: 0.2, y1: 0.1, x2: 0.8, y2: 0.9}, {x1: 0.8, y1: 0.9, x2: 0.8, y2: 0.1}],
  'P': [{x1: 0.2, y1: 0.9, x2: 0.2, y2: 0.1}, {x1: 0.2, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.7, y1: 0.1, x2: 0.8, y2: 0.3}, {x1: 0.8, y1: 0.3, x2: 0.7, y2: 0.5}, {x1: 0.7, y1: 0.5, x2: 0.2, y2: 0.5}],
  'Q': [{x1: 0.3, y1: 0.1, x2: 0.7, y2: 0.1}, {x1: 0.7, y1: 0.1, x2: 0.9, y2: 0.3}, {x1: 0.9, y1: 0.3, x2: 0.9, y2: 0.7}, {x1: 0.9, y1: 0.7, x2: 0.7, y2: 0.9}, {x1: 0.7, y1: 0.9, x2: 0.3, y2: 0.9}, {x1: 0.3, y1: 0.9, x2: 0.1, y2: 0.7}, {x1: 0.1, y1: 0.7, x2: 0.1, y2: 0.3}, {x1: 0.1, y1: 0.3, x2: 0.3, y2: 0.1}, {x1: 0.6, y1: 0.6, x2: 0.9, y2: 0.9}],
  'K': [{x1: 0.2, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.8, y1: 0.1, x2: 0.2, y2: 0.5}, {x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.9}],
  'J': [{x1: 0.6, y1: 0.1, x2: 0.6, y2: 0.7}, {x1: 0.6, y1: 0.7, x2: 0.4, y2: 0.9}, {x1: 0.4, y1: 0.9, x2: 0.2, y2: 0.7}],
  'Z': [{x1: 0.2, y1: 0.1, x2: 0.8, y2: 0.1}, {x1: 0.8, y1: 0.1, x2: 0.2, y2: 0.9}, {x1: 0.2, y1: 0.9, x2: 0.8, y2: 0.9}],
  ' ': [],
};

function getAsciiSegments(art: string[]) {
  const segments: {x1: number, y1: number, x2: number, y2: number}[] = [];
  const charWidth = 4;
  const charHeight = 8;
  const offsetX = 50 - (art[0].length * charWidth) / 2;
  const offsetY = 50 - (art.length * charHeight) / 2;

  art.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (charMap[char]) {
        charMap[char].forEach(line => {
          segments.push({
            x1: offsetX + (x + line.x1) * charWidth,
            y1: offsetY + (y + line.y1) * charHeight,
            x2: offsetX + (x + line.x2) * charWidth,
            y2: offsetY + (y + line.y2) * charHeight,
          });
        });
      }
    }
  });
  return segments;
}

// 2. The 3D/Geometric Data (Target)
// We'll generate segments for these programmatically to look like the second image.

function getCubeSegments() {
  const s = 25;
  const cx = 50, cy = 50;
  const offset = 8;
  
  // Front face
  const f1 = {x: cx - s - offset, y: cy - s + offset};
  const f2 = {x: cx + s - offset, y: cy - s + offset};
  const f3 = {x: cx + s - offset, y: cy + s + offset};
  const f4 = {x: cx - s - offset, y: cy + s + offset};
  
  // Back face
  const b1 = {x: cx - s + offset, y: cy - s - offset};
  const b2 = {x: cx + s + offset, y: cy - s - offset};
  const b3 = {x: cx + s + offset, y: cy + s - offset};
  const b4 = {x: cx - s + offset, y: cy + s - offset};

  return [
    {x1: f1.x, y1: f1.y, x2: f2.x, y2: f2.y},
    {x1: f2.x, y1: f2.y, x2: f3.x, y2: f3.y},
    {x1: f3.x, y1: f3.y, x2: f4.x, y2: f4.y},
    {x1: f4.x, y1: f4.y, x2: f1.x, y2: f1.y},
    
    {x1: b1.x, y1: b1.y, x2: b2.x, y2: b2.y},
    {x1: b2.x, y1: b2.y, x2: b3.x, y2: b3.y},
    {x1: b3.x, y1: b3.y, x2: b4.x, y2: b4.y},
    {x1: b4.x, y1: b4.y, x2: b1.x, y2: b1.y},
    
    {x1: f1.x, y1: f1.y, x2: b1.x, y2: b1.y},
    {x1: f2.x, y1: f2.y, x2: b2.x, y2: b2.y},
    {x1: f3.x, y1: f3.y, x2: b3.x, y2: b3.y},
    {x1: f4.x, y1: f4.y, x2: b4.x, y2: b4.y},
  ];
}

function getSphereSegments() {
  const segments = [];
  const cx = 50, cy = 50, r = 30;
  const numLatitudes = 5;
  const numLongitudes = 8;
  const resolution = 16;

  // Latitudes (horizontal rings)
  for (let i = 1; i < numLatitudes; i++) {
    const phi = (i / numLatitudes) * Math.PI;
    const y = cy + r * Math.cos(phi);
    const ringR = r * Math.sin(phi);
    
    for (let j = 0; j < resolution; j++) {
      const theta1 = (j / resolution) * Math.PI * 2;
      const theta2 = ((j + 1) / resolution) * Math.PI * 2;
      segments.push({
        x1: cx + ringR * Math.cos(theta1), y1: y,
        x2: cx + ringR * Math.cos(theta2), y2: y
      });
    }
  }

  // Longitudes (vertical rings)
  for (let i = 0; i < numLongitudes; i++) {
    const theta = (i / numLongitudes) * Math.PI;
    for (let j = 0; j < resolution; j++) {
      const phi1 = (j / resolution) * Math.PI * 2;
      const phi2 = ((j + 1) / resolution) * Math.PI * 2;
      
      // 3D to 2D projection (orthographic)
      const x1 = cx + r * Math.sin(phi1) * Math.cos(theta);
      const y1 = cy + r * Math.cos(phi1);
      const x2 = cx + r * Math.sin(phi2) * Math.cos(theta);
      const y2 = cy + r * Math.cos(phi2);
      
      segments.push({ x1, y1, x2, y2 });
    }
  }
  return segments;
}

function getTorusSegments() {
  const segments = [];
  const cx = 50, cy = 50;
  const R = 20; // major radius
  const r = 10; // minor radius
  const numTubes = 12;
  const resolution = 16;

  // Draw the tubes
  for (let i = 0; i < numTubes; i++) {
    const theta = (i / numTubes) * Math.PI * 2;
    const tubeCx = cx + R * Math.cos(theta);
    const tubeCy = cy + R * Math.sin(theta) * 0.5; // tilt
    
    for (let j = 0; j < resolution; j++) {
      const phi1 = (j / resolution) * Math.PI * 2;
      const phi2 = ((j + 1) / resolution) * Math.PI * 2;
      
      const x1 = tubeCx + r * Math.cos(phi1) * Math.cos(theta);
      const y1 = tubeCy + r * Math.sin(phi1) + r * Math.cos(phi1) * Math.sin(theta) * 0.5;
      const x2 = tubeCx + r * Math.cos(phi2) * Math.cos(theta);
      const y2 = tubeCy + r * Math.sin(phi2) + r * Math.cos(phi2) * Math.sin(theta) * 0.5;
      
      segments.push({ x1, y1, x2, y2 });
    }
  }
  return segments;
}

function getNetworkSegments() {
  const segments = [];
  const nodes = [
    {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
    {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
    {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
  ];

  // Connect close nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < 45) {
        segments.push({x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y});
      }
    }
  }
  
  // Add some random floating segments to match the "particles" look
  for(let i=0; i<20; i++) {
     const x = Math.random() * 100;
     const y = Math.random() * 100;
     segments.push({x1: x, y1: y, x2: x + (Math.random()-0.5)*10, y2: y + (Math.random()-0.5)*10});
  }

  return segments;
}

function getSvgSegments(input: string, numSegments: number) {
  if (!input) return [];
  
  let pathData = "";
  
  // Check if it's likely an SVG or contains SVG tags
  if (input.includes('<svg') || input.includes('<path') || input.includes('<rect') || 
      input.includes('<circle') || input.includes('<line') || input.includes('<polygon')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'image/svg+xml');
      
      // Find all drawable elements
      const drawables = doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text');
      const pathParts: string[] = [];
      
      drawables.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'path') {
          pathParts.push(el.getAttribute('d') || '');
        } else if (tag === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = parseFloat(el.getAttribute('width') || '0');
          const h = parseFloat(el.getAttribute('height') || '0');
          pathParts.push(`M ${x} ${y} h ${w} v ${h} h ${-w} z`);
        } else if (tag === 'circle' || tag === 'ellipse') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const rx = parseFloat(el.getAttribute('rx') || el.getAttribute('r') || '0');
          const ry = parseFloat(el.getAttribute('ry') || el.getAttribute('r') || '0');
          pathParts.push(`M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`);
        } else if (tag === 'line') {
          const x1 = el.getAttribute('x1') || '0';
          const y1 = el.getAttribute('y1') || '0';
          const x2 = el.getAttribute('x2') || '0';
          const y2 = el.getAttribute('y2') || '0';
          pathParts.push(`M ${x1} ${y1} L ${x2} ${y2}`);
        } else if (tag === 'polyline' || tag === 'polygon') {
          const points = el.getAttribute('points');
          if (points) pathParts.push(`M ${points}${tag === 'polygon' ? ' z' : ''}`);
        } else if (tag === 'text') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          // Text is hard, so we just put a small cross or dot
          pathParts.push(`M ${x-0.5} ${y-0.5} L ${x+0.5} ${y+0.5} M ${x+0.5} ${y-0.5} L ${x-0.5} ${y+0.5}`);
        }
      });
      
      pathData = pathParts.filter(Boolean).join(' ');
    } catch (e) {
      console.error("Failed to parse SVG input", e);
    }
  }

  // Fallback to regex if we still have nothing
  if (!pathData.trim()) {
    const matches = input.match(/d\s*=\s*["']([^"']+)["']/g);
    if (matches) {
      pathData = matches.map(m => m.match(/["']([^"']+)["']/)?.[1] || '').join(' ');
    } else {
      // If it looks like raw path data (starts with M, L, etc.)
      if (/^[MLHVCSQTAZmlhvcsqtaz0-9\s,.-]+$/.test(input.trim().substring(0, 20))) {
        pathData = input.trim();
      }
    }
  }

  if (!pathData) return [];

  const segments: {x1: number, y1: number, x2: number, y2: number}[] = [];
  
  try {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    const length = path.getTotalLength();
    if (!length || length === 0) return [];
    
    // Get bounding box to normalize
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.position = 'absolute';
    tempSvg.style.width = '0';
    tempSvg.style.height = '0';
    tempSvg.appendChild(path);
    document.body.appendChild(tempSvg);
    const bbox = path.getBBox();
    document.body.removeChild(tempSvg);

    // Normalize to fit in 100x100 with some padding
    const maxDim = Math.max(bbox.width, bbox.height);
    const scale = maxDim > 0 ? 85 / maxDim : 1; // Slightly larger fit
    const offsetX = 50 - (bbox.x + bbox.width / 2) * scale;
    const offsetY = 50 - (bbox.y + bbox.height / 2) * scale;

    for (let i = 0; i < numSegments; i++) {
      const p1 = path.getPointAtLength((i / numSegments) * length);
      const p2 = path.getPointAtLength(((i + 1) / numSegments) * length);
      segments.push({ 
        x1: p1.x * scale + offsetX, 
        y1: p1.y * scale + offsetY, 
        x2: p2.x * scale + offsetX, 
        y2: p2.y * scale + offsetY 
      });
    }
  } catch (e) {
    console.error("Error sampling SVG path", e);
  }
  return segments;
}

// Convert {x1,y1,x2,y2} to {cx,cy,length,angle}
function toTransformFormat(segs: {x1: number, y1: number, x2: number, y2: number}[]) {
  const formatted = segs.map(s => {
    const cx = (s.x1 + s.x2) / 2;
    const cy = (s.y1 + s.y2) / 2;
    const length = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    return { cx, cy, length, angle };
  });
  
  // Sort by position to make morphing more "organic" (less crossing)
  return formatted.sort((a, b) => (a.cy * 100 + a.cx) - (b.cy * 100 + b.cx));
}


function padSegments(segments: any[], targetLength: number) {
  if (segments.length === 0) return Array(targetLength).fill({cx: 50, cy: 50, length: 0, angle: 0});
  
  const padded = [];
  if (targetLength >= segments.length) {
    for (let i = 0; i < targetLength; i++) {
      const src = segments[i % segments.length];
      // If we are duplicating, make it zero length so it "grows" out of an existing one
      const isDuplicate = i >= segments.length;
      padded.push({ ...src, length: isDuplicate ? 0 : src.length });
    }
  } else {
    // Downsampling: pick segments at regular intervals to preserve shape
    for (let i = 0; i < targetLength; i++) {
      const idx = Math.floor((i / targetLength) * segments.length);
      padded.push(segments[idx]);
    }
  }
  return padded;
}

// Convert segments to a single SVG path string for performance
const segmentsToPath = (segments: any[]) => {
  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.length === 0) continue;
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    const halfLen = s.length / 2;
    const x1 = (s.cx - cos * halfLen).toFixed(2);
    const y1 = (s.cy - sin * halfLen).toFixed(2);
    const x2 = (s.cx + cos * halfLen).toFixed(2);
    const y2 = (s.cy + sin * halfLen).toFixed(2);
    path += `M ${x1} ${y1} L ${x2} ${y2} `;
  }
  return path;
};

export default function App() {
  const [activePreset, setActivePreset] = useState(Math.min(6, DEFAULT_EXAMPLES.length - 1));
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isGeneratingGIF, setIsGeneratingGIF] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingPNG, setIsGeneratingPNG] = useState(false);
  
  // New controls
  const [speed, setSpeed] = useState(3); // Duration in seconds
  const [complexity, setComplexity] = useState(300); // MAX_SEGMENTS
  const [chaos, setChaos] = useState(10); // Scatter amount
  const [color, setColor] = useState('#38bdf8');
  const [shapeSequence, setShapeSequence] = useState<string[]>(['ascii-25', 'ascii-26', 'ascii-27', 'ascii-28']);
  const isNetworkInSequence = shapeSequence.includes('network');
  const [uploadedImages, setUploadedImages] = useState<{id: string, name: string, data: string[]}[]>([]);
  const [customSvg, setCustomSvg] = useState('');
  const [customAscii, setCustomAscii] = useState('');
  const [bgColor, setBgColor] = useState('#0a1a3a');
  const [isDownloadingSVG, setIsDownloadingSVG] = useState(false);
  const [renderStyle, setRenderStyle] = useState<'classic' | 'technical' | 'blueprint' | 'glitch' | 'complex-ascii'>('blueprint');
  const [viewMode, setViewMode] = useState<'single' | 'gallery'>('single');
  const [technicalText, setTechnicalText] = useState('AI Mindset Lab');
  const [examples, setExamples] = useState<ExamplePreset[]>(DEFAULT_EXAMPLES);
  
  // Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newExampleName, setNewExampleName] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setExamples(mergeExamples(readCustomExamples()));
  }, []);

  const progress = useMotionValue(0);

  // Memoized background elements to prevent re-renders during animation
  const technicalStars = useMemo(() => {
    return Array.from({ length: 50 }).map(() => {
      const sizeVal = Math.random();
      let sizeClass = 'w-0.5 h-0.5';
      if (sizeVal > 0.9) sizeClass = 'w-1.5 h-1.5';
      else if (sizeVal > 0.7) sizeClass = 'w-1 h-1';
      
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: sizeClass,
        opacity: 0.3 + Math.random() * 0.6,
        duration: 4 + Math.random() * 6,
        driftX: (Math.random() - 0.5) * 200,
        driftY: (Math.random() - 0.5) * 200,
      };
    });
  }, []);

  const technicalGridMarkers = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      label: `REF_${Math.random().toString(36).substring(2, 5).toUpperCase()}`
    }));
  }, []);

  const complexAsciiData = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      delay: `${i * 0.2}s`,
      duration: `${4 + Math.random() * 3}s`,
      streams: Array.from({ length: 4 }).map((_, j) => ({
        color: j % 2 === 0 ? "text-cyan-500" : "text-zinc-500",
        content: Array.from({ length: 30 }).map(() => "01X#$@%&"[Math.floor(Math.random() * 8)]).join('')
      }))
    }));
  }, []);

  const complexAsciiGlitches = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${10 + Math.random() * 20}%`,
      height: `${2 + Math.random() * 5}%`,
      delay: `${Math.random() * 10}s`
    }));
  }, []);

  // Available shapes registry
  const shapes = useMemo(() => {
    const list: {id: string, name: string, type: 'ascii' | 'svg' | 'geo', data: any, desc?: string}[] = [];
    
    // ASCII
    asciiArt.forEach((art, i) => {
      const meta = (asciiMetaphors as any)[i] || { name: `ASCII ${i+1}`, desc: "Technological metaphor" };
      list.push({ id: `ascii-${i}`, name: meta.name, type: 'ascii', data: art, desc: meta.desc } as any);
    });
    
    if (customAscii) {
      list.push({ id: 'custom-ascii', name: 'Custom ASCII', type: 'ascii', data: customAscii.split('\n') });
    }
    
    // Geometry
    list.push({ id: 'cube', name: 'Cube', type: 'geo', data: getCubeSegments });
    list.push({ id: 'sphere', name: 'Sphere', type: 'geo', data: getSphereSegments });
    list.push({ id: 'torus', name: 'Torus', type: 'geo', data: getTorusSegments });
    list.push({ id: 'network', name: 'Network', type: 'geo', data: getNetworkSegments });
    
    // SVG Library
    svgLibrary.forEach(item => {
      list.push({ id: item.id, name: item.name, type: 'svg', data: item.svg });
    });

    // Uploaded Images
    uploadedImages.forEach(img => {
      list.push({ id: img.id, name: img.name, type: 'ascii', data: img.data });
    });

    // Custom UI options
    list.push({ id: 'custom-ascii', name: 'Custom ASCII', type: 'ascii', data: [], desc: 'Create your own ASCII art' });
    list.push({ id: 'custom', name: 'Custom SVG', type: 'svg', data: '', desc: 'Upload or paste SVG path' });
    list.push({ id: 'metaphor', name: 'Generate Metaphor', type: 'ascii', data: [], desc: 'AI-generated ASCII metaphor' });

    return list;
  }, [customAscii, uploadedImages]);

  const getSegmentsForId = useCallback((id: string, count: number) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return [];

    let raw: any[] = [];
    
    // Placeholder for custom options
    if (['custom-ascii', 'custom', 'metaphor'].includes(shape.id)) {
      raw = getCubeSegments();
    } else if (shape.type === 'ascii') raw = getAsciiSegments(shape.data);
    else if (shape.type === 'geo') raw = shape.data();
    else if (shape.type === 'svg') {
      raw = getSvgSegments(shape.data, count);
    }
    
    return toTransformFormat(raw);
  }, [shapes]);

  // Pre-calculate gallery previews to avoid heavy sampling on every render
  const galleryPreviews = useMemo(() => {
    return shapes.reduce((acc, shape) => {
      // Use a fixed complexity for gallery to ensure detail and performance
      acc[shape.id] = getSegmentsForId(shape.id, 150); 
      return acc;
    }, {} as Record<string, any[]>);
  }, [shapes, getSegmentsForId]);

  // Current active state based on selections
  const currentState = useMemo(() => {
    const sequence = shapeSequence.length > 0 ? [...shapeSequence, shapeSequence[0]] : [];
    const sequenceSegments = sequence.map(id => {
      if (id === 'custom') {
        const customSegments = getSvgSegments(customSvg, complexity);
        return padSegments(customSegments.length > 0 ? toTransformFormat(customSegments) : getSegmentsForId('cube', complexity), complexity);
      }
      if (id === 'custom-ascii') {
        return padSegments(getSegmentsForId('custom-ascii', complexity), complexity);
      }
      return padSegments(getSegmentsForId(id, complexity), complexity);
    });

    return {
      sequence: sequenceSegments,
      color: color
    };
  }, [shapeSequence, complexity, customSvg, color, getSegmentsForId]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || shapeSequence.length < 1) return;
    
    const count = shapeSequence.length;
    const controls = animate(progress, [0, count], {
      duration: speed * count,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [isPlaying, progress, speed, shapeSequence.length]);

  const [currentSegments, setCurrentSegments] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  const copyCode = async () => {
    if (isCopying) return;
    setIsCopying(true);
    setCopied(false);
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const state = currentState;
      const count = shapeSequence.length;
      const totalDur = speed * count;
      const dur = `${totalDur}s`;
      const samples = 30 * count;
      
      const isNetworkInSequence = shapeSequence.includes('network');
      
      const lineElements: string[] = [];
      const chunkSize = 50;
      
      const sequence = state.sequence;
      if (sequence.length < 2) return;

      for (let i = 0; i < complexity; i += chunkSize) {
        const range = Array.from({length: Math.min(chunkSize, complexity - i)}, (_, k) => i + k);
        
        range.forEach((globalIdx) => {
          const x1Values: string[] = [];
          const y1Values: string[] = [];
          const x2Values: string[] = [];
          const y2Values: string[] = [];

          for (let j = 0; j <= samples; j++) {
            const p = (j / samples) * (sequence.length - 1);
            const index = Math.min(Math.floor(p), sequence.length - 2);
            const tRaw = p - index;
            
            let t;
            if (tRaw < 0.25) t = 0;
            else if (tRaw > 0.75) t = 1;
            else {
              const tm = (tRaw - 0.25) * 2;
              t = tm < 0.5 ? 2 * tm * tm : -1 + (4 - 2 * tm) * tm;
            }

            const s1 = sequence[index][globalIdx];
            const s2 = sequence[index + 1][globalIdx];

            const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
            const scatter = scatterFactor * chaos;

            let dAngle = s2.angle - s1.angle;
            if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
            if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
            const rx = Math.sin(globalIdx * 13.5) * scatter;
            const ry = Math.cos(globalIdx * 41.2) * scatter;
            const rSpin = Math.sin(globalIdx * 5.5) * scatter * 0.1;
            const cx = s1.cx + (s2.cx - s1.cx) * t + rx;
            const cy = s1.cy + (s2.cy - s1.cy) * t + ry;
            const length = s1.length + (s2.length - s1.length) * t;
            const angle = s1.angle + dAngle * t + rSpin;
            x1Values.push((cx - (Math.cos(angle) * length) / 2).toFixed(2));
            y1Values.push((cy - (Math.sin(angle) * length) / 2).toFixed(2));
            x2Values.push((cx + (Math.cos(angle) * length) / 2).toFixed(2));
            y2Values.push((cy + (Math.sin(angle) * length) / 2).toFixed(2));
          }

          lineElements.push(`
    <line x1="${x1Values[0]}" y1="${y1Values[0]}" x2="${x2Values[0]}" y2="${y2Values[0]}" stroke="${state.color}" stroke-width="${isNetworkInSequence ? 0.4 : 0.7}" stroke-linecap="round" opacity="0.7">
      <animate attributeName="x1" values="${x1Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="y1" values="${y1Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="x2" values="${x2Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="y2" values="${y2Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
    </line>`);
        });
        await new Promise(r => setTimeout(r, 0));
      }

      let nodes = '';
      if (isNetworkInSequence) {
        const nodePoints = [
          {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
          {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
          {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
        ];
        nodePoints.forEach(n => {
          nodes += `
    <circle cx="${n.x}" cy="${n.y}" r="1.2" fill="${state.color}">
      <animate attributeName="opacity" values="0;0;0;0.8;1;0.8;0;0" dur="${dur}" repeatCount="indefinite" />
    </circle>`;
        });
      }

      const animatedSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${bgColor !== 'transparent' ? ` style="background: ${bgColor}"` : ''}>
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#glow)">
    ${lineElements.join('')}
    ${nodes}
  </g>
</svg>`;
      
      await navigator.clipboard.writeText(animatedSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SVG", err);
    } finally {
      setIsCopying(false);
    }
  };

  const downloadSVG = async () => {
    if (isDownloadingSVG) return;
    setIsDownloadingSVG(true);
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const state = currentState;
      const count = shapeSequence.length;
      const totalDur = speed * count;
      const dur = `${totalDur}s`;
      const samples = 30 * count;
      
      const isNetworkInSequence = shapeSequence.includes('network');
      
      const lineElements: string[] = [];
      const chunkSize = 50;
      
      const sequence = state.sequence;
      if (sequence.length < 2) return;

      for (let i = 0; i < complexity; i += chunkSize) {
        const range = Array.from({length: Math.min(chunkSize, complexity - i)}, (_, k) => i + k);
        
        range.forEach((globalIdx) => {
          const x1Values: string[] = [];
          const y1Values: string[] = [];
          const x2Values: string[] = [];
          const y2Values: string[] = [];

          for (let j = 0; j <= samples; j++) {
            const p = (j / samples) * (sequence.length - 1);
            const index = Math.min(Math.floor(p), sequence.length - 2);
            const tRaw = p - index;
            
            let t;
            if (tRaw < 0.25) t = 0;
            else if (tRaw > 0.75) t = 1;
            else {
              const tm = (tRaw - 0.25) * 2;
              t = tm < 0.5 ? 2 * tm * tm : -1 + (4 - 2 * tm) * tm;
            }

            const s1 = sequence[index][globalIdx];
            const s2 = sequence[index + 1][globalIdx];

            const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
            const scatter = scatterFactor * chaos;

            let dAngle = s2.angle - s1.angle;
            if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
            if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
            const rx = Math.sin(globalIdx * 13.5) * scatter;
            const ry = Math.cos(globalIdx * 41.2) * scatter;
            const rSpin = Math.sin(globalIdx * 5.5) * scatter * 0.1;
            const cx = s1.cx + (s2.cx - s1.cx) * t + rx;
            const cy = s1.cy + (s2.cy - s1.cy) * t + ry;
            const length = s1.length + (s2.length - s1.length) * t;
            const angle = s1.angle + dAngle * t + rSpin;
            x1Values.push((cx - (Math.cos(angle) * length) / 2).toFixed(2));
            y1Values.push((cy - (Math.sin(angle) * length) / 2).toFixed(2));
            x2Values.push((cx + (Math.cos(angle) * length) / 2).toFixed(2));
            y2Values.push((cy + (Math.sin(angle) * length) / 2).toFixed(2));
          }

          lineElements.push(`
    <line x1="${x1Values[0]}" y1="${y1Values[0]}" x2="${x2Values[0]}" y2="${y2Values[0]}" stroke="${state.color}" stroke-width="${isNetworkInSequence ? 0.4 : 0.7}" stroke-linecap="round" opacity="0.7">
      <animate attributeName="x1" values="${x1Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="y1" values="${y1Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="x2" values="${x2Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
      <animate attributeName="y2" values="${y2Values.join(';')}" dur="${dur}" repeatCount="indefinite" calcMode="linear" />
    </line>`);
        });
        await new Promise(r => setTimeout(r, 0));
      }

      let nodes = '';
      if (isNetworkInSequence) {
        const nodePoints = [{x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70}, {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}];
        nodePoints.forEach(n => {
          nodes += `
    <circle cx="${n.x}" cy="${n.y}" r="1.2" fill="${state.color}">
      <animate attributeName="opacity" values="0;0;0;0.8;1;0.8;0;0" dur="${dur}" repeatCount="indefinite" />
    </circle>`;
        });
      }

      const fileContent = `<?xml version="1.0" standalone="no"?>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${bgColor !== 'transparent' ? ` style="background: ${bgColor}"` : ''}>
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#glow)">
    ${lineElements.join('')}
    ${nodes}
  </g>
</svg>`;
      
      const blob = new Blob([fileContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morph-animation-${activePreset + 1}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download SVG", err);
    } finally {
      setIsDownloadingSVG(false);
    }
  };

  const downloadGIF = async () => {
    if (isGeneratingGIF) return;
    setIsGeneratingGIF(true);
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const canvas = document.createElement('canvas');
      const size = 600; // Increased resolution for better quality
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("No 2D context");
      
      const gif = GIFEncoder();
      const isNetworkInSequence = shapeSequence.includes('network');
      const state = currentState;
      const sequence = state.sequence;
      const frames = 90; 
      const totalDurMs = speed * sequence.length * 1000;
      const frameDelay = Math.max(20, Math.floor(totalDurMs / frames));
      
      for (let i = 0; i < frames; i++) {
        const p = (i / frames) * (sequence.length - 1);
        const seqIndex = Math.min(Math.floor(p), sequence.length - 2);
        const tRaw = p - seqIndex;
        
        let t;
        if (tRaw < 0.25) t = 0;
        else if (tRaw > 0.75) t = 1;
        else {
          const tm = (tRaw - 0.25) * 2;
          t = tm < 0.5 ? 2 * tm * tm : -1 + (4 - 2 * tm) * tm;
        }
        
        ctx.fillStyle = bgColor === 'transparent' ? '#111113' : bgColor;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.scale(size / 100, size / 100);
        
        const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
        const scatter = scatterFactor * chaos;
        
        ctx.strokeStyle = state.color;
        ctx.lineWidth = isNetworkInSequence ? 0.5 : 0.8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = state.color;
        
        const source = sequence[seqIndex];
        const target = sequence[seqIndex + 1];

        source.forEach((s1, idx) => {
          const s2 = target[idx];
          let dAngle = s2.angle - s1.angle;
          if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
          if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
          
          const rx = Math.sin(idx * 13.5) * scatter;
          const ry = Math.cos(idx * 41.2) * scatter;
          const rSpin = Math.sin(idx * 5.5) * scatter * 0.1;

          const cx = s1.cx + (s2.cx - s1.cx) * t + rx;
          const cy = s1.cy + (s2.cy - s1.cy) * t + ry;
          const length = s1.length + (s2.length - s1.length) * t;
          const angle = s1.angle + dAngle * t + rSpin;
          
          if (length > 0) {
            ctx.beginPath();
            ctx.globalAlpha = 0.8;
            ctx.moveTo(cx - (Math.cos(angle) * length) / 2, cy - (Math.sin(angle) * length) / 2);
            ctx.lineTo(cx + (Math.cos(angle) * length) / 2, cy + (Math.sin(angle) * length) / 2);
            ctx.stroke();
          }
        });
        
        if (isNetworkInSequence && tRaw > 0.8) {
          ctx.globalAlpha = Math.min(1, (tRaw - 0.8) * 5);
          ctx.fillStyle = state.color;
          const nodePoints = [
            {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
            {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
            {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
          ];
          nodePoints.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        
        ctx.restore();
        
        const { data } = ctx.getImageData(0, 0, size, size);
        const palette = quantize(data, 256);
        const frameIndex = applyPalette(data, palette);
        gif.writeFrame(frameIndex, size, size, { palette, delay: frameDelay });
        
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }
      
      gif.finish();
      const buffer = gif.bytes();
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `morph-animation-${activePreset + 1}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate GIF", err);
    } finally {
      setIsGeneratingGIF(false);
    }
  };

  const downloadVideo = async () => {
    if (isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const canvas = document.createElement('canvas');
      const size = 1080; // High quality
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("No 2D context");
      
      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `morph-video-${activePreset + 1}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      
      recorder.start();
      const isNetworkInSequence = shapeSequence.includes('network');
      const state = currentState;
      const sequence = state.sequence;
      const fps = 60;
      const totalDur = speed * (sequence.length - 1);
      const frames = Math.floor(totalDur * fps);
      
      for (let i = 0; i <= frames; i++) {
        const p = (i / frames) * (sequence.length - 1);
        const index = Math.min(Math.floor(p), sequence.length - 2);
        const tRaw = p - index;
        
        let t;
        if (tRaw < 0.25) t = 0;
        else if (tRaw > 0.75) t = 1;
        else {
          const tm = (tRaw - 0.25) * 2;
          t = tm < 0.5 ? 2 * tm * tm : -1 + (4 - 2 * tm) * tm;
        }
        
        ctx.fillStyle = bgColor === 'transparent' ? '#111113' : bgColor;
        ctx.fillRect(0, 0, size, size);
        ctx.save();
        ctx.scale(size / 100, size / 100);
        
        const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
        const scatter = scatterFactor * chaos;

        ctx.strokeStyle = state.color;
        ctx.lineWidth = isNetworkInSequence ? 0.5 : 0.8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = state.color;
        
        const source = sequence[index];
        const target = sequence[index + 1];

        source.forEach((s1, idx) => {
          const s2 = target[idx];
          let dAngle = s2.angle - s1.angle;
          if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
          if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
          const rx = Math.sin(idx * 13.5) * scatter;
          const ry = Math.cos(idx * 41.2) * scatter;
          const rSpin = Math.sin(idx * 5.5) * scatter * 0.1;
          const cx = s1.cx + (s2.cx - s1.cx) * t + rx;
          const cy = s1.cy + (s2.cy - s1.cy) * t + ry;
          const length = s1.length + (s2.length - s1.length) * t;
          const angle = s1.angle + dAngle * t + rSpin;
          if (length > 0) {
            ctx.beginPath();
            ctx.globalAlpha = 0.8;
            ctx.moveTo(cx - (Math.cos(angle) * length) / 2, cy - (Math.sin(angle) * length) / 2);
            ctx.lineTo(cx + (Math.cos(angle) * length) / 2, cy + (Math.sin(angle) * length) / 2);
            ctx.stroke();
          }
        });
        
        if (isNetworkInSequence && tRaw > 0.8) {
          ctx.globalAlpha = Math.min(1, (tRaw - 0.8) * 5);
          ctx.fillStyle = state.color;
          const nodePoints = [
            {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
            {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
            {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
          ];
          nodePoints.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();
        await new Promise(r => setTimeout(r, 16));
      }
      
      recorder.stop();
    } catch (err) {
      console.error("Failed to generate Video", err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const downloadPNG = async () => {
    if (isGeneratingPNG) return;
    setIsGeneratingPNG(true);
    
    try {
      const canvas = document.createElement('canvas');
      const size = 2000; // Very high quality for design work
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No 2D context");
      
      const p = progress.get();
      const state = currentState;
      const sequence = state.sequence;
      const isNetworkInSequence = shapeSequence.includes('network');
      
      ctx.fillStyle = bgColor === 'transparent' ? '#111113' : bgColor;
      if (bgColor === 'transparent') {
        ctx.clearRect(0, 0, size, size);
      } else {
        ctx.fillRect(0, 0, size, size);
      }
      ctx.save();
      ctx.scale(size / 100, size / 100);
      
      const index = Math.min(Math.floor(p), sequence.length - 2);
      const tRaw = p - index;
      
      let t;
      if (tRaw < 0.25) t = 0;
      else if (tRaw > 0.75) t = 1;
      else {
        const tm = (tRaw - 0.25) * 2;
        t = tm < 0.5 ? 2 * tm * tm : -1 + (4 - 2 * tm) * tm;
      }

      const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
      const scatter = scatterFactor * chaos;

      ctx.strokeStyle = state.color;
      ctx.lineWidth = isNetworkInSequence ? 0.5 : 0.8;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = state.color;
      
      const source = sequence[index];
      const target = sequence[index + 1];

      source.forEach((s1, idx) => {
        const s2 = target[idx];
        let dAngle = s2.angle - s1.angle;
        if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
        if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
        const rx = Math.sin(idx * 13.5) * scatter;
        const ry = Math.cos(idx * 41.2) * scatter;
        const rSpin = Math.sin(idx * 5.5) * scatter * 0.1;
        const cx = s1.cx + (s2.cx - s1.cx) * t + rx;
        const cy = s1.cy + (s2.cy - s1.cy) * t + ry;
        const length = s1.length + (s2.length - s1.length) * t;
        const angle = s1.angle + dAngle * t + rSpin;
        if (length > 0) {
          ctx.beginPath();
          ctx.globalAlpha = 0.8;
          ctx.moveTo(cx - (Math.cos(angle) * length) / 2, cy - (Math.sin(angle) * length) / 2);
          ctx.lineTo(cx + (Math.cos(angle) * length) / 2, cy + (Math.sin(angle) * length) / 2);
          ctx.stroke();
        }
      });
      
      if (isNetworkInSequence && tRaw > 0.8) {
        ctx.globalAlpha = Math.min(1, (tRaw - 0.8) * 5);
        ctx.fillStyle = state.color;
        const nodePoints = [
          {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
          {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
          {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
        ];
        nodePoints.forEach(n => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      ctx.restore();
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `morph-frame-${activePreset + 1}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate PNG", err);
    } finally {
      setIsGeneratingPNG(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const targetWidth = 40;
        const targetHeight = Math.floor((img.height / img.width) * targetWidth * 0.5);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;

        const asciiRows: string[] = [];
        const chars = " .:-=+*#%@"; 
        const mapping: Record<string, string> = {
          ' ': ' ', '.': ':', ':': ':', '-': '-', '=': '=', '+': 'x', '*': 'X', '#': '#', '%': '%', '@': 'X'
        };

        for (let y = 0; y < targetHeight; y++) {
          let row = "";
          for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            
            const charIdx = Math.floor((brightness / 255) * (chars.length - 1));
            const rawChar = chars[charIdx];
            row += mapping[rawChar] || ' ';
          }
          asciiRows.push(row);
        }

        const newId = `img-${Date.now()}`;
        setUploadedImages(prev => [...prev, { id: newId, name: file.name, data: asciiRows }]);
        setShapeSequence(prev => [...prev, newId]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useAnimationFrame(() => {
    const p = progress.get();
    setCurrentProgress(p);
    
    const state = currentState;
    if (state.sequence.length === 0) return;
    if (state.sequence.length === 1) {
      setCurrentSegments(state.sequence[0]);
      return;
    }

    const index = Math.min(Math.floor(p), state.sequence.length - 2);
    const tRaw = p - index;
    
    // Implement pause logic: stay at 0 for 25%, move for 50%, stay at 1 for 25%
    let t;
    if (tRaw < 0.25) {
      t = 0;
    } else if (tRaw > 0.75) {
      t = 1;
    } else {
      const tMapped = (tRaw - 0.25) * 2; // Map 0.25..0.75 to 0..1
      // Ease in out quad for the movement part
      t = tMapped < 0.5 ? 2 * tMapped * tMapped : -1 + (4 - 2 * tMapped) * tMapped;
    }

    const source = state.sequence[index];
    const target = state.sequence[index + 1];
    
    // Scatter only during movement
    const scatterFactor = Math.sin(Math.max(0, Math.min(1, (tRaw - 0.2) * 1.6)) * Math.PI);
    const scatter = scatterFactor * chaos;

    const morphed = source.map((s1, idx) => {
      const s2 = target[idx];
      let dAngle = s2.angle - s1.angle;
      if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
      if (dAngle < -Math.PI) dAngle += 2 * Math.PI;

      const rx = Math.sin(idx * 13.5) * scatter;
      const ry = Math.cos(idx * 41.2) * scatter;
      const rSpin = Math.sin(idx * 5.5) * scatter * 0.1;

      return {
        cx: s1.cx + (s2.cx - s1.cx) * t + rx,
        cy: s1.cy + (s2.cy - s1.cy) * t + ry,
        length: s1.length + (s2.length - s1.length) * t,
        angle: s1.angle + dAngle * t + rSpin
      };
    });

    setCurrentSegments(morphed);
  });

  return (
    <div className="min-h-screen bg-[#111113] text-zinc-100 font-sans flex flex-col">
      <header className="border-b border-zinc-800/50 bg-[#111113]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <RefreshCw className="w-4 h-4 text-zinc-300" />
            </div>
            <h1 className="text-lg font-medium tracking-tight whitespace-nowrap">Morph System</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {[
                { id: 'classic', name: 'Classic' },
                { id: 'technical', name: 'Technical' },
                { id: 'complex-ascii', name: 'Complex ASCII' },
                { id: 'blueprint', name: 'Blueprint' },
                { id: 'glitch', name: 'Glitch' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setRenderStyle(style.id as any);
                    if (style.id === 'technical') {
                      setBgColor('#050505');
                      setColor('#FF3333');
                    } else if (style.id === 'complex-ascii') {
                      setBgColor('#08080a');
                      setColor('#00ffff');
                    } else if (style.id === 'blueprint') {
                      setBgColor('#0a1a3a');
                      setColor('#ffffff');
                    } else if (style.id === 'glitch') {
                      setBgColor('#000000');
                      setColor('#00ff00');
                    } else {
                      setBgColor('#111113');
                      setColor('#a3e635');
                    }
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    renderStyle === style.id 
                      ? "bg-zinc-800 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {style.name}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-zinc-800 mx-2 hidden md:block" />
            
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('single')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                  viewMode === 'single' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Single
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                  viewMode === 'gallery' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Gallery
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-800 mx-2 hidden md:block" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={copyCode}
                disabled={isCopying}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 disabled:opacity-50 relative"
                title="Copy SVG Code"
              >
                {isCopying ? (
                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={downloadSVG}
                disabled={isDownloadingSVG}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 disabled:opacity-50 relative"
                title="Download SVG File"
              >
                {isDownloadingSVG ? (
                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={downloadPNG}
                disabled={isGeneratingPNG}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 disabled:opacity-50 relative"
                title="Save Frame (PNG)"
              >
                {isGeneratingPNG ? (
                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={downloadGIF}
                disabled={isGeneratingGIF}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 disabled:opacity-50 relative"
                title="Save Animation (GIF)"
              >
                {isGeneratingGIF ? (
                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={downloadVideo}
                disabled={isGeneratingVideo}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700 disabled:opacity-50 relative"
                title="Save Animation (Video)"
              >
                {isGeneratingVideo ? (
                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 border-r border-zinc-800/50 bg-[#111113] p-6 space-y-8 overflow-y-auto">
          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Parameters</h2>
            
            {renderStyle === 'technical' && (
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Technical Text</label>
                <input 
                  type="text" 
                  value={technicalText}
                  onChange={(e) => setTechnicalText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Enter text..."
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Background</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { name: 'Dark', value: '#111113' },
                    { name: 'White', value: '#ffffff' },
                    { name: 'None', value: 'transparent' }
                  ].map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => setBgColor(bg.value)}
                      className={cn(
                        "flex-1 py-1.5 rounded-md text-[10px] font-medium border transition-all",
                        bgColor === bg.value 
                          ? "bg-zinc-800 border-zinc-600 text-white" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Speed</span>
                  <span className="text-zinc-200">{speed}s</span>
                </div>
                <input 
                  type="range" min="0.5" max="10" step="0.1" 
                  value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Complexity</span>
                  <span className="text-zinc-200">{complexity}</span>
                </div>
                <input 
                  type="range" min="50" max="1000" step="10" 
                  value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Chaos</span>
                  <span className="text-zinc-200">{chaos}</span>
                </div>
                <input 
                  type="range" min="0" max="50" step="1" 
                  value={chaos} onChange={(e) => setChaos(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shape Sequence</h2>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer text-[10px]">
                  <Upload className="w-3 h-3" />
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <button 
                  onClick={() => {
                    setShapeSequence(prev => [...prev, 'cube']);
                    setActivePreset(-1);
                  }}
                  disabled={shapeSequence.length >= 10}
                  className="flex items-center gap-2 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-50 text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  Add Library Shape
                </button>
                <button 
                  onClick={() => {
                    setShapeSequence(prev => [...prev, 'custom']);
                    setActivePreset(-1);
                  }}
                  className="flex items-center gap-2 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors text-[10px]"
                >
                  <LayoutGrid className="w-3 h-3" />
                  Add SVG
                </button>
                <button 
                  onClick={() => {
                    setShapeSequence(prev => [...prev, 'custom-ascii']);
                    setActivePreset(-1);
                  }}
                  className="flex items-center gap-2 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors text-[10px]"
                >
                  <LayoutGrid className="w-3 h-3" />
                  Add Metaphor
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {shapeSequence.map((id, idx) => (
                <div key={`${id}-${idx}`} className="flex items-center gap-2 group animate-in fade-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="text-[10px] font-mono text-zinc-600 w-4">{idx + 1}</div>
                  <select 
                    value={id}
                    onChange={(e) => {
                      const newSeq = [...shapeSequence];
                      newSeq[idx] = e.target.value;
                      setShapeSequence(newSeq);
                      setActivePreset(-1);
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md p-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="custom-ascii">Custom ASCII</option>
                    <option value="custom">Custom SVG</option>
                    {shapes.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        if (idx === 0) return;
                        const newSeq = [...shapeSequence];
                        [newSeq[idx-1], newSeq[idx]] = [newSeq[idx], newSeq[idx-1]];
                        setShapeSequence(newSeq);
                        setActivePreset(-1);
                      }}
                      className="p-1 hover:text-white text-zinc-600 disabled:opacity-0"
                      disabled={idx === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => {
                        if (idx === shapeSequence.length - 1) return;
                        const newSeq = [...shapeSequence];
                        [newSeq[idx], newSeq[idx+1]] = [newSeq[idx+1], newSeq[idx]];
                        setShapeSequence(newSeq);
                        setActivePreset(-1);
                      }}
                      className="p-1 hover:text-white text-zinc-600 disabled:opacity-0"
                      disabled={idx === shapeSequence.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => {
                        if (shapeSequence.length <= 1) return;
                        setShapeSequence(prev => prev.filter((_, i) => i !== idx));
                        setActivePreset(-1);
                      }}
                      className="p-1 hover:text-red-400 text-zinc-600 disabled:opacity-0"
                      disabled={shapeSequence.length <= 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {shapeSequence.includes('custom-ascii') && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] text-zinc-500 uppercase">Custom ASCII Art</label>
                <textarea 
                  value={customAscii}
                  onChange={(e) => setCustomAscii(e.target.value)}
                  placeholder="[ BASE ]..."
                  className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-md p-2 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>
            )}

            {shapeSequence.includes('custom') && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] text-zinc-500 uppercase">Custom SVG Path</label>
                <textarea 
                  value={customSvg}
                  onChange={(e) => setCustomSvg(e.target.value)}
                  placeholder="M 10 10 L 90 90..."
                  className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-md p-2 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">System Color</h2>
            <div className="flex flex-wrap gap-2">
              {['#a3e635', '#84cc16', '#c084fc', '#d8b4fe', '#38bdf8', '#fb7185', '#fbbf24'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    color === c ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Examples</h2>
            <div className="grid grid-cols-2 gap-2">
              {examples.map((preset, i) => (
                <div key={`${preset.name}-${i}`} className="relative">
                  <button
                    onClick={() => applyPreset(i, preset)}
                    className={cn(
                      "w-full px-3 py-2 rounded-md text-[10px] font-medium border transition-all text-left flex flex-col gap-1",
                      activePreset === i 
                        ? "bg-zinc-800 border-zinc-600 text-white" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    <span className="text-zinc-200 pr-6">{preset.name}</span>
                    <span className="text-[9px] opacity-50 uppercase">{preset.style}</span>
                  </button>
                  {i >= DEFAULT_EXAMPLES.length && (
                    <button
                      type="button"
                      aria-label={`Delete ${preset.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteExample(i);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700/70 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Viewport */}
        <main 
          className="flex-1 p-8 flex flex-col items-center justify-center relative transition-colors duration-500 overflow-hidden"
          style={{ backgroundColor: bgColor === 'transparent' ? '#0c0c0e' : bgColor }}
        >
          {viewMode === 'single' ? (
            <>
            <div className="w-full max-w-4xl aspect-video relative flex items-center justify-center">
              {/* Background layers based on style */}
              {renderStyle === 'technical' && (
                <>
                  {/* Starfield */}
                  <div className="absolute inset-0 opacity-60 pointer-events-none overflow-hidden">
                    {technicalStars.map((star, i) => (
                      <motion.div 
                        key={i}
                        className={cn("absolute bg-white rounded-full shadow-[0_0_3px_rgba(255,255,255,0.5)]", star.size)}
                        initial={{ 
                          left: star.left, 
                          top: star.top,
                          opacity: star.opacity 
                        }}
                        animate={{ 
                          x: [0, star.driftX, 0],
                          y: [0, star.driftY, 0],
                          opacity: [star.opacity, 1, star.opacity]
                        }}
                        transition={{
                          duration: star.duration * 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    ))}
                  </div>

                  {/* Technical Grid/Markers */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    {technicalGridMarkers.map((marker, i) => (
                      <div 
                        key={i} 
                        className="absolute flex flex-col gap-1"
                        style={{ left: marker.left, top: marker.top }}
                      >
                        <div className="w-2 h-2 border-t border-l border-white" />
                        <div className="font-mono text-[8px] text-white/50">{marker.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Grid */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  
                  {/* Decorative labels */}
                  <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-600 space-y-1">
                    <div>[ PROCESS_0x1A ]</div>
                    <div className="text-zinc-800">AUDIT_LOG: OK</div>
                  </div>
                  <div className="absolute top-4 right-4 font-mono text-[10px] text-red-900/50">
                    &lt; CHARGING &gt;
                  </div>
                  <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-600">
                    SIGNAL: STABLE
                  </div>
                </>
              )}

              {renderStyle === 'blueprint' && (
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              )}

              {renderStyle === 'glitch' && (
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-t from-green-500/20 to-transparent z-20" />
              )}

              {(renderStyle === 'technical' || renderStyle === 'glitch') && (
                <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]" 
                     style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
              )}

              {renderStyle === 'complex-ascii' && (
                <>
                  {/* Background Noise / Data Stream */}
                  <div className="absolute inset-0 opacity-[0.08] pointer-events-none font-mono text-[8px] overflow-hidden select-none leading-none">
                    {complexAsciiData.map((row, i) => (
                      <div key={i} className="whitespace-nowrap animate-pulse flex gap-4" style={{ animationDelay: row.delay, animationDuration: row.duration }}>
                        {row.streams.map((stream, j) => (
                          <span key={j} className={stream.color}>
                            {stream.content}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Scanlines layer 2 */}
                  <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,4px_100%]" />
                  {/* Vignette */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
                  {/* Random glitch blocks */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {complexAsciiGlitches.map((glitch, i) => (
                      <div 
                        key={i}
                        className="absolute bg-cyan-500/10 border-l border-cyan-500/30 animate-pulse"
                        style={{
                          top: glitch.top,
                          left: glitch.left,
                          width: glitch.width,
                          height: glitch.height,
                          animationDelay: glitch.delay
                        }}
                      />
                    ))}
                  </div>

                  {/* Metadata Overlay */}
                  <div className="absolute top-8 left-8 z-40 font-mono text-[10px] text-cyan-500/60 uppercase tracking-[0.3em] flex flex-col gap-1 pointer-events-none">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse" />
                      <span>{shapes.find(s => s.id === shapeSequence[0])?.name || 'UNKNOWN'}</span>
                    </div>
                    <div className="text-[8px] text-cyan-900 ml-4 max-w-[150px] leading-tight">
                      { (shapes.find(s => s.id === shapeSequence[0]) as any)?.desc || 'SYSTEM_IDLE' }
                    </div>
                  </div>
                </>
              )}

              <svg id="morph-svg" viewBox="0 0 100 100" className={cn(
                "w-full h-full overflow-visible relative z-10",
                renderStyle === 'technical' ? "drop-shadow-[0_0_20px_rgba(255,51,51,0.3)]" : 
                renderStyle === 'complex-ascii' ? "drop-shadow-[0_0_25px_rgba(0,255,255,0.2)]" :
                "drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              )}>
                <defs>
                  <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="50%" stopColor={color} stopOpacity="1" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="heavy-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.0" result="blur" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 8 -3" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="chromatic" x="-10%" y="-10%" width="120%" height="120%">
                    <feOffset in="SourceGraphic" dx="1" dy="0.5" result="red" />
                    <feOffset in="SourceGraphic" dx="-1" dy="-0.5" result="blue" />
                    <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red-only" />
                    <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue-only" />
                    <feMerge>
                      <feMergeNode in="red-only" />
                      <feMergeNode in="blue-only" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {renderStyle === 'technical' && (
                  <g opacity="0.1">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="0.05" strokeDasharray="1 2" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="0.05" strokeDasharray="4 4" />
                  </g>
                )}

                <g filter={
                  renderStyle === 'technical' ? "url(#heavy-glow)" : 
                  renderStyle === 'glitch' ? "url(#chromatic)" : 
                  renderStyle === 'complex-ascii' ? "url(#soft-blur)" :
                  "url(#glow)"
                }>
                  {(renderStyle === 'technical' || renderStyle === 'complex-ascii') && Array.from({ length: renderStyle === 'complex-ascii' ? 1 : 2 }).map((_, ghostIdx) => (
                    <g key={`ghost-${ghostIdx}`} opacity={renderStyle === 'complex-ascii' ? 0.05 : 0.08 - ghostIdx * 0.03} style={{ transform: `scale(${1 + (ghostIdx + 1) * 0.02})`, transformOrigin: 'center', willChange: 'transform' }}>
                      <path
                        d={segmentsToPath(currentSegments)}
                        stroke={color}
                        strokeWidth={renderStyle === 'complex-ascii' ? "0.2" : "0.4"}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </g>
                  ))}

                  <path
                    d={segmentsToPath(currentSegments)}
                    stroke={renderStyle === 'complex-ascii' ? "url(#line-grad)" : currentState.color}
                    strokeWidth={renderStyle === 'blueprint' ? "1" : isNetworkInSequence ? "0.4" : "0.7"}
                    strokeLinecap="round"
                    fill="none"
                    opacity={renderStyle === 'technical' ? 0.9 : renderStyle === 'complex-ascii' ? 1 : 0.7}
                  />
                  
                  {isNetworkInSequence && currentProgress > 0.8 && (
                    <g opacity={(currentProgress - 0.8) * 5}>
                      {[
                        {x: 20, y: 80}, {x: 30, y: 30}, {x: 50, y: 50}, 
                        {x: 70, y: 20}, {x: 80, y: 70}, {x: 40, y: 70},
                        {x: 60, y: 40}, {x: 90, y: 40}, {x: 10, y: 50}
                      ].map((n, i) => (
                        <circle key={`node-${i}`} cx={n.x} cy={n.y} r={1.2} fill={currentState.color} />
                      ))}
                    </g>
                  )}
                </g>

                {renderStyle === 'technical' && (
                  <g>
                    <text 
                      x="50" y="60" 
                      textAnchor="middle" 
                      className="font-mono text-[6px] animate-pulse tracking-[0.5em] font-bold"
                      style={{ opacity: 0.4, fill: color }}
                    >
                      [ {technicalText} ]
                    </text>
                    {/* Progress Indicator */}
                    <rect x="35" y="63" width="30" height="0.5" fill={color} opacity="0.1" />
                    <rect x="35" y="63" width={30 * (currentProgress % 1)} height="0.5" fill={color} opacity="0.4" />
                    <text x="50" y="66" textAnchor="middle" className="font-mono text-[3px]" style={{ fill: color, opacity: 0.3 }}>
                      PHASE: {Math.floor(currentProgress)} | STEP: {(currentProgress % 1).toFixed(2)}
                    </text>
                  </g>
                )}
              </svg>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewExampleName('');
                setSaveError('');
                setIsSaveModalOpen(true);
              }}
              className="mt-4 px-6 py-2 rounded-md text-[11px] font-medium border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white transition-all z-20 relative"
            >
              Add to Library
            </button>
            </>
          ) : (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {shapes.map((shape) => {
                  const segments = galleryPreviews[shape.id] || [];
                  return (
                    <div 
                      key={shape.id} 
                      className={cn(
                        "group relative border rounded-xl p-4 flex flex-col items-center gap-3 transition-all cursor-pointer overflow-hidden",
                        renderStyle === 'technical' ? "bg-red-950/5 border-red-900/20 hover:bg-red-950/10 hover:border-red-500/40" :
                        renderStyle === 'complex-ascii' ? "bg-cyan-950/5 border-cyan-900/20 hover:bg-cyan-950/10 hover:border-cyan-500/40" :
                        renderStyle === 'blueprint' ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30" :
                        "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700/50"
                      )}
                      onClick={() => {
                        setShapeSequence([shape.id]);
                        setViewMode('single');
                        setActivePreset(-1);
                      }}
                    >
                      {/* Decorative corners for technical styles */}
                      {(renderStyle === 'technical' || renderStyle === 'complex-ascii') && (
                        <>
                          <div className={cn("absolute top-0 left-0 w-2 h-2 border-t border-l", renderStyle === 'technical' ? "border-red-500/40" : "border-cyan-500/40")} />
                          <div className={cn("absolute top-0 right-0 w-2 h-2 border-t border-r", renderStyle === 'technical' ? "border-red-500/40" : "border-cyan-500/40")} />
                          <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-b border-l", renderStyle === 'technical' ? "border-red-500/40" : "border-cyan-500/40")} />
                          <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-b border-r", renderStyle === 'technical' ? "border-red-500/40" : "border-cyan-500/40")} />
                        </>
                      )}

                      <div className="w-full aspect-square relative">
                        <svg viewBox="0 0 100 100" className={cn(
                          "w-full h-full overflow-visible",
                          renderStyle === 'technical' ? "drop-shadow-[0_0_10px_rgba(255,51,51,0.2)]" : 
                          renderStyle === 'complex-ascii' ? "drop-shadow-[0_0_15px_rgba(0,255,255,0.1)]" :
                          "drop-shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                        )}>
                          <defs>
                            <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={color} stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          <g className={cn(
                            renderStyle === 'technical' ? "drop-shadow-[0_0_3px_rgba(255,51,51,0.5)]" : 
                            renderStyle === 'complex-ascii' ? "drop-shadow-[0_0_5px_rgba(0,255,255,0.4)]" :
                            "drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                          )}>
                            <path
                              d={segmentsToPath(segments)}
                              stroke={renderStyle === 'complex-ascii' ? `url(#grad-${shape.id})` : color}
                              strokeWidth={renderStyle === 'blueprint' ? "1.2" : "0.8"}
                              strokeLinecap="round"
                              fill="none"
                              opacity="0.8"
                            />
                          </g>
                        </svg>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider text-center group-hover:text-zinc-300 transition-colors">
                          {shape.name}
                        </div>
                        {renderStyle === 'complex-ascii' && (
                          <>
                            <div className="text-[8px] font-mono text-cyan-900 uppercase tracking-[0.2em]">
                              ID: {shape.id.split('-')[1] || '0'}
                            </div>
                            {(shape as any).desc && (
                              <div className="text-[7px] font-mono text-cyan-500/40 uppercase tracking-tight text-center max-w-[80px] leading-tight mt-1">
                                {(shape as any).desc}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-zinc-800 p-1 rounded-md">
                          <Plus className="w-3 h-3 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 backdrop-blur-md rounded-full border text-[10px] font-mono uppercase tracking-[0.2em] transition-all",
            renderStyle === 'technical' ? "bg-red-950/20 border-red-900/30 text-red-500/70" : "bg-zinc-900/50 border-zinc-800/50 text-zinc-500"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", renderStyle === 'technical' ? "bg-red-500" : "bg-emerald-500")} />
              <span>{renderStyle === 'technical' ? 'Core Active' : 'Live System'}</span>
            </div>
            <div className={cn("w-px h-3", renderStyle === 'technical' ? "bg-red-900/30" : "bg-zinc-800")} />
            <span>{complexity} Segments</span>
            <div className={cn("w-px h-3", renderStyle === 'technical' ? "bg-red-900/30" : "bg-zinc-800")} />
            <span>{(currentProgress * 100).toFixed(0)}% Morph</span>
          </div>
        </main>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-medium mb-4 text-sm">Save to Library</h3>
            <input
              type="text"
              value={newExampleName}
              onChange={(e) => setNewExampleName(e.target.value)}
              placeholder="Enter animation name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600 mb-2"
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newExampleName.trim()) {
                  await handleSaveExample();
                }
              }}
            />
            {saveError && <div className="text-red-400 text-xs mb-4">{saveError}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => await handleSaveExample()}
                disabled={!newExampleName.trim()}
                className="px-4 py-2 rounded-md text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleSaveExample() {
    if (!newExampleName.trim()) return;
    
    const newExample: ExamplePreset = {
      name: newExampleName.trim(),
      shapes: shapeSequence,
      style: renderStyle,
      color: color,
      bgColor: bgColor
    };
    
    try {
      const customExamples = [...readCustomExamples(), newExample];
      writeCustomExamples(customExamples);

      setExamples(mergeExamples(customExamples));
      setActivePreset(DEFAULT_EXAMPLES.length + customExamples.length - 1);
      setSaveError('');
      setNewExampleName('');
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error(error);
      setSaveError("Error saving example locally");
    }
  }

  function applyPreset(index: number, preset: ExamplePreset) {
    setActivePreset(index);
    setRenderStyle(preset.style as any);
    setShapeSequence(preset.shapes);
    setColor(preset.color);
    setBgColor(preset.bgColor ?? getDefaultBackgroundForStyle(preset.style));
  }

  async function handleDeleteExample(index: number) {
    if (index < DEFAULT_EXAMPLES.length) return;

    try {
      const customIndex = index - DEFAULT_EXAMPLES.length;
      const customExamples = readCustomExamples();
      const nextCustomExamples = customExamples.filter((_, itemIndex) => itemIndex !== customIndex);
      const nextExamples = mergeExamples(nextCustomExamples);

      writeCustomExamples(nextCustomExamples);
      setExamples(nextExamples);

      if (nextExamples.length === 0) {
        setActivePreset(-1);
        return;
      }

      if (activePreset === index) {
        const fallbackIndex = Math.min(index, nextExamples.length - 1);
        applyPreset(fallbackIndex, nextExamples[fallbackIndex]);
        return;
      }

      if (activePreset > index) {
        setActivePreset(activePreset - 1);
      }
    } catch (error) {
      console.error(error);
      setSaveError("Error deleting example locally");
    }
  }
}
