# yes24

## 사용법

### getList
```ts
async function getList(listSearchOption:ListSearchOption):number[]
```

이 함수는 검색 옵션을 파라미터로 받아, 알라딘 내부에서 쓰이는 itemId의 배열을 반환합니다.

#### 검색 옵션 타입
```ts
interface Yes24ListSearchOptionBase{
    domain: "Book"|"Foreign"|"EBook";
    query: string;
    page?: number;
    searchTarget?: SearchTarget[];
}

type SearchTarget = 'title'|'author'|'company';
```

`searchTarget`은 여러개를 선택할 수 있습니다.

### getBook
```ts
async function getBook(itemId:number):Book
```

이 함수는 yes24 내부에서 쓰이는 itemId를 파라미터로 받아, 해당 책에 대한 정보(Book)를 반환합니다.

중고 서적에 관한 정보는 포함되어있지 않으며, 중고 서적의 가격에 대한 정보를 반환하는 함수는 추가 예정입니다.

## 추가 예정 기능

### getUsedBook

해당 서적의 중고 가격을 반환하는 함수입니다.