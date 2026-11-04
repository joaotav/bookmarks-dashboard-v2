/**
 * The parts of a bookmark tree node this extension reads. Structural, so it accepts nodes
 * from both browsers: Chrome sets `folderType` and `syncing`, Firefox sets `type`.
 */
export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  /** Firefox only. */
  type?: 'bookmark' | 'folder' | 'separator';
  /** Chrome 134+ only, on the browser's permanent folders. */
  folderType?: string;
  /** Chrome 134+ only. */
  syncing?: boolean;
  children?: BookmarkNode[];
}

export const isSeparator = (node: BookmarkNode) => node.type === 'separator';
export const isFolder = (node: BookmarkNode) => node.url === undefined && !isSeparator(node);
export const isLink = (node: BookmarkNode): node is BookmarkNode & { url: string } =>
  node.url !== undefined && !isSeparator(node);
