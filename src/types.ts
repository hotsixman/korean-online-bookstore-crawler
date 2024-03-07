export interface Book{
    title: string;
    ISBN: string;
    author?: string[];
    price?:number;
    cover?:string;
    publisher?:string;
}