export interface ListSearchOption {
    searchTarget: 'Book' | 'Foreign' | 'EBook';//
    keyWord?:string;
    keyTitle?:string;
    keyAuthor?:string;
    keyPublisher?:string;
    categories?:number[];
    outStock?: 0 | 1 | 2;//전체 | 품절/절판 제외 | 절판 제외
    sortOrder?: 11 | 2 | 5 | 1 | 3 | 4 | 9; //정확도순 | 판매량순 | 출시일순 | 상품명순 | 평점순 | 리뷰순 | 저가격순
    custReviewCount?: 5 | 10 | 50 | 100 | 0;//0개는 전체
    custReviewRank?: 4 | 6 | 8 | 10 | 0;//2개 3개 4개 5개 전체
    page?: number|null
}

export interface SearchData {
    SearchTarget: 'Book' | 'Foreign' | 'EBook';//
    KeyWord:string;
    KeyTitle:string;
    KeyAuthor:string;
    KeyPublisher:string;
    CategorySearch:string;
    OutStock: 0 | 1 | 2;//전체 | 품절/절판 제외 | 절판 제외
    SortOrder: 11 | 2 | 5 | 1 | 3 | 4 | 9; //정확도순 | 판매량순 | 출시일순 | 상품명순 | 평점순 | 리뷰순 | 저가격순
    CustReviewCount: 5 | 10 | 50 | 100 | 0;//0개는 전체
    CustReviewRank: 4 | 6 | 8 | 10 | 0;//2개 3개 4개 5개 전체
    DetailSearch:1;
    ViewRowCount:50;
    page?: number
}

export interface Category{
    [parent:string]: {
        [category:string]: number;
    }
}