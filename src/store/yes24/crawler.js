"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBook = exports.getList = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
function getList(option) {
    return __awaiter(this, void 0, void 0, function* () {
        if (option.page) {
            let response = yield (0, axios_1.default)(({
                method: 'get',
                url: getURL(option),
                headers: {
                    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            }));
            return parseListResponse(response.data).itemIds;
        }
        else {
            let itemIds = [];
            let page = 1;
            while (true) {
                let response = yield (0, axios_1.default)({
                    method: 'get',
                    url: getURL(Object.assign(Object.assign({}, option), { page })),
                    headers: {
                        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                    }
                });
                let parsed = parseListResponse(response.data);
                itemIds.push(...parsed.itemIds);
                if (parsed.isLast) {
                    break;
                }
                page++;
            }
            return itemIds;
        }
    });
}
exports.getList = getList;
function getURL(option) {
    let url = new URL("https://www.yes24.com/Product/Search");
    let params = url.searchParams;
    params.append('domain', option.domain.toUpperCase());
    params.append('query', option.query);
    params.append('size', '48');
    if (typeof option.page === "number") {
        params.append('page', option.page.toString());
    }
    if (option.searchTarget) {
        params.append('_searchTarget', option.searchTarget.map(e => e.toUpperCase()).join(','));
    }
    return url.href;
}
function parseListResponse(response) {
    var _a;
    let $ = (0, cheerio_1.load)(response);
    let pagen = $('.yesUI_pagen').last();
    let isLast = pagen.children('strong').text().trim() === (pagen.children().last().text().trim() || ((_a = pagen.children().last().attr('title')) === null || _a === void 0 ? void 0 : _a.trim()));
    return {
        isLast,
        itemIds: $('#yesSchList > li').map((i, e) => {
            return Number($(e).prop('data-goods-no'));
        }).toArray()
    };
}
function getBook(itemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://www.yes24.com/Product/Goods/${itemId}`;
        let response = yield (0, axios_1.default)({
            method: 'get',
            url,
            headers: {
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        return parseBookResponse(response.data);
    });
}
exports.getBook = getBook;
function parseBookResponse(response) {
    var _a;
    let $ = (0, cheerio_1.load)(response);
    const book = {
        title: {
            yes24: $('.gd_name').first().text().trim()
        },
        ISBN: ((_a = $($('tbody.b_size').first().find('tr').toArray().find(tr => $(tr).find('th').text() === "ISBN13")).find('td').text()) === null || _a === void 0 ? void 0 : _a.trim()) || '',
        type: "book"
    };
    //ebook?
    if ($('.gd_titArea').find('em').text() === "eBook") {
        book.type = "eBook";
    }
    //publisher
    if ($('span.gd_pub').length > 0) {
        book.publisher = $('span.gd_pub').text().trim();
    }
    //author, authorship, illustrator, translator
    $('.gd_auth').text().trim().split('/').forEach(e => {
        if (/원저$/.test(e)) {
            if (!book.authorship)
                book.authorship = [];
            e.replace(/(.*?)원저$/, "$1").trim().split(',').forEach(el => {
                var _a;
                (_a = book.authorship) === null || _a === void 0 ? void 0 : _a.push(el.trim());
            });
        }
        else if (/저$/.test(e)) {
            if (!book.author)
                book.author = [];
            e.replace(/(.*?)저$/, '$1').trim().split(',').forEach(el => {
                var _a;
                (_a = book.author) === null || _a === void 0 ? void 0 : _a.push(el.trim());
            });
        }
        else if (/글그림$/.test(e)) {
            if (!book.author)
                book.author = [];
            if (!book.illustrator)
                book.illustrator = [];
            e.replace(/(.*?)글그림$/, "$1").trim().split(',').forEach(el => {
                var _a, _b;
                (_a = book.author) === null || _a === void 0 ? void 0 : _a.push(el.trim());
                (_b = book.illustrator) === null || _b === void 0 ? void 0 : _b.push(el.trim());
            });
        }
        else if (/그림$/.test(e)) {
            if (!book.illustrator)
                book.illustrator = [];
            e.replace(/(.*?)그림$/, "$1").trim().split(',').forEach(el => {
                var _a;
                (_a = book.illustrator) === null || _a === void 0 ? void 0 : _a.push(el.trim());
            });
        }
        else if (/역$/.test(e)) {
            if (!book.translator)
                book.translator = [];
            e.replace(/(.*?)역$/, "$1").trim().split(',').forEach(el => {
                var _a;
                (_a = book.translator) === null || _a === void 0 ? void 0 : _a.push(el.trim());
            });
        }
    });
    //price
    $('.gd_infoTb').first().find('tr').each((i, e) => {
        if ($(e).find('th').text().trim() === "정가") {
            book.price = Number($(e).find('td').find('span').text().replace(/,/g, '').replace('원', ''));
        }
        if ($(e).find('th').text().trim() === "판매가") {
            if (!book.prices)
                book.prices = {};
            book.prices['yes24'] = Number($(e).find('td').find('span').text().replace(/,/g, '').replace('원', ''));
        }
    });
    return book;
}
