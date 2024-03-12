interface Yes24ListSearchOptionBase{
    domain: "Book"|"Foreign"|"EBook";
    query: string;
    page?: number;
    searchTarget?: SearchTarget[];
}

export type Yes24ListSearchOption = Yes24ListSearchOptionBase;

type SearchTarget = 'title'|'author'|'company';