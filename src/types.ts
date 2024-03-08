export interface Book{
    title: {
        [store:string]: string;
    };
    ISBN: string;
    author?: string[];
    authorship?:string[];
    translator?: string[];
    illustrator?:string[];
    price?:number;
    prices?: {
        [store:string]: number;
    }
    cover?:string;
    publisher?:string;
    type:'book'|'eBook'
}