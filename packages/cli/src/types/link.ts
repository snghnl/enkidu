export interface Link {
  source: string;      // Source note slug
  target: string;      // Target note slug
  displayText?: string; // Optional display text
  linkType: 'wiki' | 'markdown';
}

export interface LinkIndex {
  [noteSlug: string]: {
    outgoing: Link[];  // Links from this note
    incoming: Link[];  // Links to this note (backlinks)
  };
}

export interface BrokenLink {
  source: string;
  target: string;
  line?: number;
}
