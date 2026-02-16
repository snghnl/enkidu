// Wiki-link types
export interface WikiLink {
  raw: string; // [[note-name|Display Text]]
  target: string; // note-name
  displayText?: string; // Display Text (optional)
  startIndex: number; // Position in content
  endIndex: number;
  line?: number; // Line number in file
}

export interface ResolvedLink {
  link: WikiLink;
  resolvedPath?: string; // Absolute path if found
  exists: boolean;
  suggestions?: string[]; // Similar note names if not found
}

export interface LinkIndexEntry {
  slug: string;
  filePath: string;
  outgoingLinks: WikiLink[]; // Links from this note
  incomingLinks: LinkReference[]; // Links to this note (backlinks)
}

export interface LinkReference {
  sourceSlug: string;
  sourcePath: string;
  link: WikiLink;
}

export interface BrokenLink {
  sourceSlug: string;
  sourcePath: string;
  link: WikiLink;
  suggestions?: string[];
}

// Link graph for visualization
export interface LinkGraph {
  nodes: LinkNode[];
  edges: LinkEdge[];
}

export interface LinkNode {
  id: string; // slug
  label: string; // title or slug
  path: string; // file path
}

export interface LinkEdge {
  source: string; // source slug
  target: string; // target slug
  type: "wiki";
}
