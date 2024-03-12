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
    //publisher
    if($('span.gd_pub').length > 0){
        book.publisher = $('span.gd_pub').text().trim();
    }
    //author, authorship, illustrator, translator
    $('.gd_auth').text().trim().split('/').forEach(e => {
        if(/원저$/.test(e)){
            if(!book.authorship) book.authorship = [];
            e.replace(/(.*?)원저$/, "$1").trim().split(',').forEach(el => {
                book.authorship?.push(el.trim())
            })
        }
        else if(/저$/.test(e)){
            if(!book.author) book.author = [];
            e.replace(/(.*?)저$/, '$1').trim().split(',').forEach(el => {
                book.author?.push(el.trim());
            })
        }
        else if(/글그림$/.test(e)){
            if(!book.author) book.author = [];
            if(!book.illustrator) book.illustrator = [];
            e.replace(/(.*?)글그림$/, "$1").trim().split(',').forEach(el => {
                book.author?.push(el.trim());
                book.illustrator?.push(el.trim());
            })
        }
        else if(/그림$/.test(e)){
            if(!book.illustrator) book.illustrator = [];
            e.replace(/(.*?)그림$/, "$1").trim().split(',').forEach(el => {
                book.illustrator?.push(el.trim());
            })
        }
        else if(/역$/.test(e)){
            if(!book.translator) book.translator = [];
            e.replace(/(.*?)역$/, "$1").trim().split(',').forEach(el => {
                book.translator?.push(el.trim());
            })
        }
    })
    //price
    $('.gd_infoTb').first().find('tr').each((i, e) => {
        if($(e).find('th').text().trim() === "정가"){
            book.price = Number($(e).find('td').find('span').text().replace(/,/g, '').replace('원', ''));
        }
        if($(e).find('th').text().trim() === "판매가"){
            if(!book.prices)book.prices = {};
            book.prices['yes24'] = Number($(e).find('td').find('span').text().replace(/,/g, '').replace('원', ''));
        }
    })

    return book;
}