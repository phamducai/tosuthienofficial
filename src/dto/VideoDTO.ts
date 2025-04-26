export interface VideoColection{
    id:string;
    name:string,
    description?:string
}
export interface VideoColectionDetail{
    id:string;
    videos:VideoDTO[]
}
export interface VideoDTO{
    videoId:string,
    title:string,
    description?:string
}