"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRut = exports.validateRutList = exports.validateRut = exports.calculateRutVerifier = exports.formatRut = exports.RutFormat = exports.deconstructRut = exports.getRutVerifier = exports.getRutDigits = exports.cleanRut = exports.isSuspiciousRut = exports.isRutLike = void 0;
const rutLikePattern = () => /^(\d{0,2})\.?(\d{3})\.?(\d{3})-?(\d|k)$/gi;
const suspiciousRutPattern = () => /^(\d)\1?\.?(\1{3})\.?(\1{3})-?(\d|k)?$/gi;
const isRutLike = (rut) => rutLikePattern().test(rut);
exports.isRutLike = isRutLike;
const isSuspiciousRut = (rut) => suspiciousRutPattern().test(rut);
exports.isSuspiciousRut = isSuspiciousRut;
const cleanRut = (rut) => ((0, exports.isRutLike)(rut) ? rut.replace(/[^0-9k]/gi, '') : '');
exports.cleanRut = cleanRut;
const getRutDigits = (rut) => (0, exports.cleanRut)(rut).slice(0, -1);
exports.getRutDigits = getRutDigits;
const getRutVerifier = (rut) => (0, exports.cleanRut)(rut).slice(-1);
exports.getRutVerifier = getRutVerifier;
const deconstructRut = (rut) => ({
    digits: (0, exports.getRutDigits)(rut),
    verifier: (0, exports.getRutVerifier)(rut),
});
exports.deconstructRut = deconstructRut;
var RutFormat;
(function (RutFormat) {
    RutFormat[RutFormat["DOTS"] = 0] = "DOTS";
    RutFormat[RutFormat["DASH"] = 1] = "DASH";
    RutFormat[RutFormat["DOTS_DASH"] = 2] = "DOTS_DASH";
})(RutFormat = exports.RutFormat || (exports.RutFormat = {}));
const formatRut = (rut, format = RutFormat.DASH) => {
    if (rut === null || rut === undefined)
        return '';
    if (typeof rut !== 'string')
        throw new TypeError('RUT needs to be a string or undefined');
    if (!(0, exports.isRutLike)(rut))
        return rut;
    switch (format) {
        case RutFormat.DOTS:
            return rut.replace(rutLikePattern(), (...m) => `${m[1] ? `${m[1]}.` : ''}${m[2]}.${m[3]}${m[4]}`);
        case RutFormat.DASH:
            return rut.replace(rutLikePattern(), '$1$2$3-$4');
        case RutFormat.DOTS_DASH:
            return rut.replace(rutLikePattern(), (...m) => `${m[1] ? `${m[1]}.` : ''}${m[2]}.${m[3]}-${m[4]}`);
        default:
            return rut.replace(rutLikePattern(), '$1$2$3$4');
    }
};
exports.formatRut = formatRut;
const calculateRutVerifier = (digits) => {
    let sum = 0;
    let mul = 2;
    let i = digits.length;
    while (i--) {
        sum = sum + parseInt(digits.charAt(i)) * mul;
        if (mul % 7 === 0) {
            mul = 2;
        }
        else {
            mul++;
        }
    }
    const res = sum % 11;
    if (res === 0) {
        return '0';
    }
    else if (res === 1) {
        return 'k';
    }
    return `${11 - res}`;
};
exports.calculateRutVerifier = calculateRutVerifier;
const validateRut = (rut, noSuspicious = true) => {
    if (!(0, exports.isRutLike)(rut))
        return false;
    if (noSuspicious && (0, exports.isSuspiciousRut)(rut))
        return false;
    return (0, exports.getRutVerifier)(rut).toLowerCase() === (0, exports.calculateRutVerifier)((0, exports.getRutDigits)(rut));
};
exports.validateRut = validateRut;
const validateRutList = (ruts, noSuspicious = true) => {
    const res = new Map();
    for (const rut of ruts) {
        res.set(rut, (0, exports.validateRut)(rut, noSuspicious));
    }
    return res;
};
exports.validateRutList = validateRutList;
const generateRut = () => {
    const digits = Math.floor(10000003 + Math.random() * 90000000).toString();
    const verifier = (0, exports.calculateRutVerifier)(digits);
    return (0, exports.formatRut)(digits + verifier);
};
exports.generateRut = generateRut;
//# sourceMappingURL=main.js.map