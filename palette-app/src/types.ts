export type BoardItemType = "sticky" | "image";

export type BoardItem = {
  id: string;
  type: BoardItemType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  content?: string;        // For sticky notes
  imageSrc?: string;       // For images (DataURL)
  createdAt: number;
  updatedAt: number;
};
