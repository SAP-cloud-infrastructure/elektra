export declare class AnsiUp {
    ansi_colors: {
        rgb: number[];
        class_name: string;
    }[][];
    /**
     * 256 Colors Palette
     * CSS RGB strings - ex. "255, 255, 255"
     */
    private palette_256;
    private fg;
    private bg;
    private bright;
    private _useClasses;
    private _escapeForHtml;
    private _sgr_regex;
    private _buffer;
    constructor();
    useClasses: boolean;
    escapeForHtml: boolean;
    private setup_256_palette();
    private doEscape(txt);
    private old_linkify(txt);
    private detect_incomplete_ansi(txt);
    private detect_incomplete_link(txt);
    ansi_to_html(txt: string): string;
    ansi_to_text(txt: string): string;
    private wrap_text(txt);
    private process_ansi(block);
    private rgx(tmplObj, ...subst);
}
