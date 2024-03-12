import * as aladin from './src/store/aladin/crawler';
import * as yes24 from './src/store/yes24/crawler';

class KOBCFunction extends Function{
    store:any;
}

const kobc = new KOBCFunction();
kobc.store = {
    aladin,
    yes24
}

export default kobc;