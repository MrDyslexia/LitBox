export declare const isRutLike: (rut: string) => boolean;
export declare const isSuspiciousRut: (rut: string) => boolean;
export declare const cleanRut: (rut: string) => string;
export declare const getRutDigits: (rut: string) => string;
export declare const getRutVerifier: (rut: string) => string;
declare type DeconstructedRut = {
    digits: string;
    verifier: string;
};
export declare const deconstructRut: (rut: string) => DeconstructedRut;
export declare enum RutFormat {
    DOTS = 0,
    DASH = 1,
    DOTS_DASH = 2
}
export declare const formatRut: (rut?: string, format?: RutFormat) => string;
export declare const calculateRutVerifier: (digits: string) => string;
export declare const validateRut: (rut?: string, noSuspicious?: boolean) => boolean;
declare type RutListResult = Map<string, boolean>;
export declare const validateRutList: (ruts: Iterable<string>, noSuspicious?: boolean) => RutListResult;
export declare const generateRut: () => string;
export {};
