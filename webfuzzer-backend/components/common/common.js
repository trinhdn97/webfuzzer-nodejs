import { defaultFuzzConfig } from '../../server';

export const isEmptyObject = (obj) => {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

export const getBanner = () => {
    let banner = `Select which vulnerabilities you want to fuzz (seperated by comma, ex. 0,1,2):\n`;
    Object.keys(defaultFuzzConfig).forEach((key) => {
        banner += key + ': ' + defaultFuzzConfig[key].label + '\n';
    });
    return banner + 'Nhap vao day ne con trai: ';
}

export const terminalLog = () => {

}