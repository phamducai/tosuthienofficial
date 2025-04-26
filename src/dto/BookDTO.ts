export interface SimplifiedBookDTO {
  id: string;
  title: string;
  description: string;
  firstChapterId: string ;
  isDownload?: boolean;
  path?: string;
  pageCurrent?:number,
  pageTotal?:number
}
