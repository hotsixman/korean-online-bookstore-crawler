import axios from "axios";
import {load} from 'cheerio';
import type { Yes24ListSearchOption } from "./types";
import { Book } from "../../types";

export async function getList(option:Yes24ListSearchOption):Promise<number[]>{
    if(option.page){
        let response = await axios(({
            method:'get',
            url: getURL(option),
            headers:{
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        }));
    
        return parseListResponse(response.data).itemIds
    }
    else{
        let itemIds:number[] = [];

        let page = 1;
        while(true){
            let response = await axios({
                method:'get',
                url: getURL({...option, ...{page}}),
                headers:{
                    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            })

            let parsed = parseListResponse(response.data);
            itemIds.push(...parsed.itemIds);
            if(parsed.isLast){
                break;
            }
            page++;
        }

        return itemIds;
    }
}

function getURL(option:Yes24ListSearchOption){
    let url = new URL("https://www.yes24.com/Product/Search");
    let params = url.searchParams;

    params.append('domain', option.domain.toUpperCase());
    params.append('query', option.query);
    params.append('size', '48');
    if(typeof option.page === "number"){
        params.append('page', option.page.toString());
    }
    if(option.searchTarget){
        params.append('_searchTarget', option.searchTarget.map(e => e.toUpperCase()).join(','));
    }

    return url.href;
}

function parseListResponse(response:string){
    let $ = load(response);

    let pagen = $('.yesUI_pagen').last()
    let isLast = pagen.children('strong').text().trim() === (pagen.children().last().text().trim() || pagen.children().last().attr('title')?.trim())
    
    return {
        isLast,
        itemIds: $('#yesSchList > li').map((i, e) => {
            return Number($(e).prop('data-goods-no'));
        }).toArray()
    };
}

export async function getBook(itemId:number){
    let url = `https://www.yes24.com/Product/Goods/${itemId}`;

    let response = await axios({
        method:'get',
        url,
        headers:{
            "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    })

    return parseBookResponse(response.data);
}

function parseBookResponse(response:string){
    let $ = load(response);

    const book:Book = {
        title: {
            yes24: $('.gd_name').first().text().trim()
        },
        ISBN: $($('tbody.b_size').first().find('tr').toArray().find(tr => $(tr).find('th').text() === "ISBN13")).find('td').text()?.trim() || '',
        type:"book"
    }

    //ebook?
    if($('.gd_titArea').find('em').text() === "eBook"){
        book.type = "eBook"
    }

    return book;
}