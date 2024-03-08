import { ListSearchOption, SearchData } from "./types"
import axios from "axios";
import {load} from 'cheerio';
import { Book } from "../../types";

const defaultOption:ListSearchOption = {
    searchTarget: 'All',
    page: null
}

/**
 * @param listSearchOption 
 * @returns Array of itemId
 */
export async function getList(listSearchOption:ListSearchOption):Promise<number[]>{
    let option = {
        ...defaultOption, 
        ...listSearchOption
    }

    let data = optionToData(option);

    if(option.page){
        data.page = option.page;

        let response = await axios({
            method:'POST',
            url: "https://www.aladin.co.kr/search/wsearchresult.aspx",
            headers:{
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            },
            data: stringifyData(data)
        });

        return parseListResponse(response.data).itemIds;
    }
    else{
        let itemIds:number[] = [];

        let i = 1;
        while(true){
            let response = await axios({
                method:'POST',
                url: "https://www.aladin.co.kr/search/wsearchresult.aspx",
                headers:{
                    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                },
                data: stringifyData({...data, ...{page:i}})
            });

            let parsedData = parseListResponse(response.data);
            itemIds.push(...parsedData.itemIds);

            if(parsedData.isLast){
                break;
            }
            i++;
        }

        return itemIds;
    }
}

/**
 * @param itemId 
 */
export async function getBook(itemId:number):Promise<Book>{
    let url = new URL("https://www.aladin.co.kr/shop/wproduct.aspx");
    url.searchParams.append('ItemId', itemId.toString());

    let response = await axios({
        method: 'GET',
        url: url.href,
        headers:{
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
    })

    return parseBookResponse(response.data);
}

/**
 * https://www.aladin.co.kr/search/wsearchresult.aspx로부터의 응답을 파싱하여 itemId들을 반환
 * @param responseData 
 * @returns 
 */
function parseListResponse(responseData:string){
    let $ = load(responseData);

    let isLast = $('.numbox_last').length === 0;

    return {
        isLast,
        itemIds: $('.ss_book_box').map((i, el) => {
            return el.attributes.find(e => e.name === "itemid")?.value || null;
        }).toArray().filter(e => e !== null).map(Number)
    }
}

/**
 * https://www.aladin.co.kr/shop/wproduct.aspx로부터의 응답을 파싱하여 Book을 반환
 */
function parseBookResponse(responseData:string):Book{
    let $ = load(responseData);
    
    const book:Book = {
        title: {
            aladin:$('.Ere_bo_title').text().trim()
        },
        ISBN: $('.conts_info_list1').find('li').last().text().trim().replace(/ISBN : ([0-9]*)/, '$1') || $('.conts_info_list2').first().find('li').last().text().trim().replace(/ISBN : ([0-9]*)/, '$1'),
        type:"book"
    }

    //지은이, 옮긴이, 그림, 출판사
    if($('.Ere_sub2_title').length !== 0){
        let ereSub2Titles = (($('li.Ere_sub2_title').html() as string).split('<span class="Ere_PR10"></span>').map((e:string) => {
            let element = load(e);
            if(element('div').length > 0){
                return null;
            }
            if(element('a').attr('href') === "#"){
                return null;
            }
            return load(e).text().replace(/(.*?),$/, '$1');
        }).filter(e => e !== null) as string[]).filter((e) => !/[0-9]*-[0-9]*-[0-9]*$/.test(e) && !/원제 : .*$/.test(e));

        ereSub2Titles.forEach(e => {
            let name = e.replace(/(.*?)\(.*\)$/, "$1").trim();
            let isPublisher = !/\(.*\)/.test(e);

            if(isPublisher){
                book.publisher = e;
                return
            }

            let type:string|undefined = (e.match(/\(.*\)/) as unknown as string)[0]?.replace(/\((.*?)\)/, '$1');
            switch(type){
                case('지은이'):{
                    if(!book.author){
                        book.author = [];
                    }

                    book.author.push(name);

                    break;
                }
                case('옮긴이'):{
                    if(!book.translator){
                        book.translator = [];
                    }

                    book.translator.push(name);

                    break;
                }
                case('그림'):{
                    if(!book.illustrator){
                        book.illustrator = [];
                    }

                    book.illustrator.push(name);

                    break;
                }
                case('원작'):{
                    if(!book.authorship){
                        book.authorship = [];
                    }

                    book.authorship.push(name)
                }
            }
        })
    }

    //ebook?
    if(/^\[eBook\]/.test(book.title.aladin)){
        book.title.aladin = book.title.aladin.replace(/^\[eBook\]/, '').trim();
        book.type = 'eBook';
    }

    //가격
    book.price = Number($($('.info').find('li .Ritem')[0]).text().trim().replace(/원$/, '').replace(/,/, ''));
    book.prices = {
        aladin: Number($('.info').find('.Ere_fs24').text().trim().replace(/,/, ''))
    }

    return book;
}


/**
 * https://www.aladin.co.kr/search/wsearchresult.aspx에 요청을 보내기위한 data 문자열을 만듦
 * @param data 
 * @returns 
 */
function stringifyData(data:SearchData){
    let p = new URLSearchParams();
    let keys = Object.keys(data) as Array<keyof typeof data>;
    keys.forEach(key => {
        p.append(key, `${data[key]}`)
    });
    return p.toString();
}

/**
 * ListSearchOption을 SearchData로 바꿔줌
 * @param option 
 * @returns 
 */
function optionToData(option:ListSearchOption){
    let data:SearchData = {
        SearchTarget: 'All',
        KeyWord: '',
        KeyTitle: '',
        KeyAuthor: '',
        KeyPublisher: '',
        CategorySearch: '0@0',
        OutStock: 0,
        SortOrder: 11,
        CustReviewCount: 0,
        CustReviewRank: 0,
        DetailSearch: 1,
        ViewRowCount: 50
    };
    if(option.searchTarget){
        data.SearchTarget = option.searchTarget;
    }
    if(option.keyWord){
        data.KeyWord = option.keyWord;
    }
    if(option.keyTitle){
        data.KeyTitle = option.keyTitle;
    }
    if(option.keyAuthor){
        data.KeyAuthor = option.keyAuthor;
    }
    if(option.keyPublisher){
        data.KeyPublisher = option.keyPublisher
    }
    if(option.categories){
        data.CategorySearch = option.categories.join(',') + "0@0";
    }
    if(option.outStock){
        data.OutStock = option.outStock;
    }
    if(option.sortOrder){
        data.SortOrder = option.sortOrder
    }
    if(option.custReviewCount){
        data.CustReviewCount = option.custReviewCount
    }
    if(option.custReviewRank){
        data.CustReviewRank = option.custReviewRank
    }

    return data;
}

