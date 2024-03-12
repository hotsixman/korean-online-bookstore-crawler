import * as aladin from './src/store/aladin/crawler';
import * as yes24 from './src/store/yes24/crawler';

class KOBCFunction extends Function{
    store = {
        aladin,
        yes24
    };
}

const kobc = new KOBCFunction();

export default kobc;