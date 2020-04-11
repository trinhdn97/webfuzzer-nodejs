export const escapeString = (str) => {
    return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export const unescapeString = (str) => {
    return str.replace(/\\\\/g, "\\").replace(/\\"/g, '"');
}

export const escapeTarget = (str) => {
    return str.replace(/\\xa7/g, "\\\\xa7");
}

export const unescapeTarget = (str) => {
    return str.replace(/\\\\xa7/g, "\\xa7");
}

export const convertQuestionMark = (str) => {
    return str.replace(/�/g, '\\xa7');
}

export const cleanUrl = (str) => {
    return str.replace(/�/g, '').replace(/\\\\xa7/g, '').replace(/\\xa7/g, '');
}
