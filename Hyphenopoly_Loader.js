/**
 * @license MIT
 * Hyphenopoly_Loader 6.0.0 - client side hyphenation
 * ©2024  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */
/* globals Hyphenopoly:readonly */
window.Hyphenopoly = {};

((w, d, H, o) => {
    "use strict";

    /**
     * Shortcut for new Map
     * @param {any} init - initialiser for new Map
     * @returns {Map} - empty map
     */
    const mp = (init) => {
        return new Map(init);
    };

    const scriptName = "Hyphenopoly_Loader.js";
    const thisScript = d.currentScript.src;
    const store = sessionStorage;
    let mainScriptLoaded = false;

    /**
     * The main function runs the feature test and loads Hyphenopoly if
     * necessary.
     */
    const main = (() => {
        const shortcuts = {
            "ac": "appendChild",
            "ce": "createElement",
            "ct": "createTextNode"
        };

        /**
         * Create deferred Promise
         *
         * From http://lea.verou.me/2016/12/resolve-promises-externally-with-
         * this-one-weird-trick/
         * @returns {Promise} - deferred promise
         */
        const defProm = () => {
            let res = null;
            let rej = null;
            const promise = new Promise((resolve, reject) => {
                res = resolve;
                rej = reject;
            });
            promise.resolve = res;
            promise.reject = rej;
            return promise;
        };

        H.ac = new AbortController();
        const fetchOptions = {
            "credentials": H.s.CORScredentials,
            "signal": H.ac.signal
        };

        let stylesNode = null;

        /**
         * Define function H.hide.
         * This function hides (state = 1) or unhides (state = 0)
         * the whole document (mode == 0) or
         * each selected element (mode == 1) or
         * text of each selected element (mode == 2) or
         * nothing (mode == -1)
         * @param {number} state - State
         * @param {number} mode  - Mode
         */
        H.hide = (state, mode) => {
            if (state) {
                const vis = (mode === 2)
                ? "{color:transparent!important}"
                : "{visibility:hidden!important}";
                const myStyle = (mode === 0)
                    ? "html" + vis
                    : (mode !== -1)
                        ? o.keys(H.s.selectors).join(vis) + vis
                        : "";
                stylesNode = d[shortcuts.ce]("style");
                stylesNode[shortcuts.ac](d[shortcuts.ct](myStyle));
                d.head[shortcuts.ac](stylesNode);
            } else if (stylesNode) {
                stylesNode.remove();
            }
        };

        const tester = (() => {
            let fakeBody = null;
            return {

                /**
                 * Append fakeBody with tests to document
                 * @returns {object|null} The body element or null, if no tests
                 */
                "ap": () => {
                    if (fakeBody) {
                        d.documentElement[shortcuts.ac](fakeBody);
                        return fakeBody;
                    }
                    return null;
                },

                /**
                 * Remove fakeBody
                 * @returns {undefined}
                 */
                "cl": () => {
                    if (fakeBody) {
                        fakeBody.remove();
                    }
                },

                /**
                 * Create and append div with CSS-hyphenated word
                 * @param {string} lang Language
                 * @returns {undefined}
                 */
                "cr": (lang) => {
                    if (H.cf.langs.has(lang)) {
                        return;
                    }
                    fakeBody ||= d[shortcuts.ce]("body");
                    const testDiv = d[shortcuts.ce]("div");
                    const ha = "hyphens:auto";
                    testDiv.lang = lang;
                    testDiv.style.cssText = `visibility:hidden;-webkit-${ha};-ms-${ha};${ha};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;
                    testDiv[shortcuts.ac](
                        d[shortcuts.ct](H.lrq.get(lang).wo.toLowerCase())
                    );
                    fakeBody[shortcuts.ac](testDiv);
                }
            };
        })();

        /**
         * Checks if hyphens (ev.prefixed) is set to auto for the element.
         * @param {object} elmStyle - the element
         * @returns {boolean} result of the check
         */
        const checkCSSHyphensSupport = (elmStyle) => {
            const h = elmStyle.hyphens ||
                elmStyle.webkitHyphens ||
                elmStyle.msHyphens;
            return (h === "auto");
        };

        H.res = {
            "he": mp()
        };

        /**
         * Load hyphenEngines to H.res.he
         *
         * Make sure each .wasm is loaded exactly once, even for fallbacks
         * Store a list of languages to by hyphenated with each .wasm
         * @param {string} lang The language
         * @returns {undefined}
         */
        const loadhyphenEngine = (lang) => {
            const fn = H.lrq.get(lang).fn;
            H.cf.pf = true;
            H.cf.langs.set(lang, "H9Y");
            if (H.res.he.has(fn)) {
                H.res.he.get(fn).l.push(lang);
            } else {
                H.res.he.set(
                    fn,
                    {
                        "l": [lang],
                        "w": w.fetch(H.paths.patterndir + fn + ".wasm", fetchOptions)
                    }
                );
            }
        };
        H.lrq.forEach((value, lang) => {
            if (value.wo === "FORCEHYPHENOPOLY" || H.cf.langs.get(lang) === "H9Y") {
                loadhyphenEngine(lang);
            } else {
                tester.cr(lang);
            }
        });
        const testContainer = tester.ap();
        if (testContainer) {
            testContainer.childNodes.forEach((n) => {
                if (checkCSSHyphensSupport(n.style) && n.offsetHeight > 12) {
                    H.cf.langs.set(n.lang, "CSS");
                } else {
                    loadhyphenEngine(n.lang);
                }
            });
            tester.cl();
        }
        const hev = H.hev;
        if (H.cf.pf) {
            H.res.DOM = new Promise((res) => {
                if (d.readyState === "loading") {
                    d.addEventListener(
                        "DOMContentLoaded",
                        res,
                        {
                            "once": true,
                            "passive": true
                        }
                    );
                } else {
                    res();
                }
            });
            H.hide(1, H.s.hide);
            H.timeOutHandler = w.setTimeout(() => {
                H.hide(0, null);
                // eslint-disable-next-line no-bitwise
                if (H.s.timeout & 1) {
                    H.ac.abort();
                }
                // eslint-disable-next-line no-console
                console.info(scriptName + " timed out.");
            }, H.s.timeout);
            if (mainScriptLoaded) {
                H.main();
            } else {
                // Load main script
                fetch(H.paths.maindir + "Hyphenopoly.js", fetchOptions).
                    then((response) => {
                        if (response.ok) {
                            response.blob().then((blb) => {
                                const script = d[shortcuts.ce]("script");
                                script.src = URL.createObjectURL(blb);
                                d.head[shortcuts.ac](script);
                                mainScriptLoaded = true;
                                URL.revokeObjectURL(script.src);
                            });
                        }
                    });
            }
            H.hy6ors = mp();
            H.cf.langs.forEach((langDef, lang) => {
                if (langDef === "H9Y") {
                    H.hy6ors.set(lang, defProm());
                }
            });
            H.hy6ors.set("HTML", defProm());
            H.hyphenators = new Proxy(H.hy6ors, {

                /**
                 * Proxy getter
                 * @param {Map} target - the hy6ors map
                 * @param {string} key - the language
                 * @returns {Promise} - Promise for a hyphenator
                 */
                "get": (target, key) => {
                    return target.get(key);
                },

                /**
                 * Proxy setter, inhibits setting of hyphenators
                 * @returns {boolean} - allways true
                 */
                "set": () => {
                    // Inhibit setting of hyphenators
                    return true;
                }
            });
            (() => {
                if (hev && hev.polyfill) {
                    hev.polyfill();
                }
            })();
        } else {
            (() => {
                if (hev && hev.tearDown) {
                    hev.tearDown();
                }
                w.Hyphenopoly = null;
            })();
        }
        (() => {
            if (H.cft) {
                store.setItem(scriptName, JSON.stringify(
                    {
                        "langs": [...H.cf.langs.entries()],
                        "pf": H.cf.pf
                    }
                ));
            }
        })();
    });

    /**
     * API exposed config
     * @param {object} c - the user supplied configuration
     */
    H.config = (c) => {
        /**
         * Sets default properties for an Object
         * @param {object} obj - The object to set defaults to
         * @param {object} defaults - The defaults to set
         * @returns {object} the settings in obj complemented with defaults
         */
        const setDefaults = (obj, defaults) => {
            if (obj) {
                o.entries(defaults).forEach(([k, v]) => {
                    // eslint-disable-next-line security/detect-object-injection
                    obj[k] ||= v;
                });
                return obj;
            }
            return defaults;
        };

        H.cft = Boolean(c.cacheFeatureTests);
        if (H.cft && store.getItem(scriptName)) {
            H.cf = JSON.parse(store.getItem(scriptName));
            H.cf.langs = mp(H.cf.langs);
        } else {
            H.cf = {
                "langs": mp(),
                "pf": false
            };
        }

        const maindir = thisScript.slice(0, (thisScript.lastIndexOf("/") + 1));
        const patterndir = maindir + "patterns/";
        H.paths = setDefaults(c.paths, {
            maindir,
            patterndir
        });
        H.s = setDefaults(c.setup, {
            "CORScredentials": "include",
            "hide": "all",
            "selectors": {".hyphenate": {}},
            "timeout": 1000
        });
        // Change mode string to mode int
        H.s.hide = ["all", "element", "text"].indexOf(H.s.hide);
        if (c.handleEvent) {
            H.hev = c.handleEvent;
        }

        const fallbacks = mp(o.entries(c.fallbacks || {}));
        H.lrq = mp();
        o.entries(c.require).forEach(([lang, wo]) => {
            H.lrq.set(lang.toLowerCase(), {
                "fn": fallbacks.get(lang) || lang,
                wo
            });
        });

        main();
    };
})(window, document, Hyphenopoly, Object);
