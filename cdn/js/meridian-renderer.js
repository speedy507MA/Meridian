
/*
 * Meridian Ocean
 * Procedural animated liquid background
 *
 * Usage:
 *   const ocean = MeridianOcean.create("#meridian-ocean");
 *   ocean.setTheme("dark");
 *   ocean.setTheme("light");
 */

const MeridianOcean = (() => {

    // ==========================================
    // 1. DEFAULT CONFIGURATION
    // ==========================================

    const defaultConfig = {
        blobCount: 10,
        speed: 0.00012,
        amplitude: 0.17,
        opacity: 0.55,
        transitionSpeed: 0.0015,
        maxPixelRatio: 2
    };

    const defaultPalettes = {
        light: {
            background: [
                "#E5F8F2",
                "#C7EDEB",
                "#D9F1FA"
            ],

            colors: [
                "#D9F4EE",
                "#A8E5DD",
                "#75D4D0",
                "#A4DFF0",
                "#D5F0FA"
            ]
        },

        dark: {
            background: [
                "#071923",
                "#102D3A",
                "#153D4B"
            ],

            colors: [
                "#102D3A",
                "#164653",
                "#236D78",
                "#397F91",
                "#245B72"
            ]
        }
    };


    // ==========================================
    // 2. COLOR UTILITIES
    // ==========================================

    function hexToRgb(hex) {
        let value = hex.replace("#", "");

        if (value.length === 3) {
            value = value.split("")
                .map(c => c + c)
                .join("");
        }

        if (!/^[0-9a-fA-F]{6}$/.test(value)) {
            throw new Error("Invalid hex color: " + hex);
        }

        return {
            r: parseInt(value.substring(0, 2), 16) / 255,
            g: parseInt(value.substring(2, 4), 16) / 255,
            b: parseInt(value.substring(4, 6), 16) / 255
        };
    }

    function linearize(value) {
        return value <= 0.04045
            ? value / 12.92
            : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    function delinearize(value) {
        value = Math.max(0, Math.min(1, value));

        return value <= 0.0031308
            ? value * 12.92
            : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    }

    // Convert sRGB to OKLab.
    function rgbToOklab(hex) {
        const rgb = hexToRgb(hex);

        const r = linearize(rgb.r);
        const g = linearize(rgb.g);
        const b = linearize(rgb.b);

        const l = Math.cbrt(
            0.4122214708 * r +
            0.5363325363 * g +
            0.0514459929 * b
        );

        const m = Math.cbrt(
            0.2119034982 * r +
            0.6806995451 * g +
            0.1073969566 * b
        );

        const s = Math.cbrt(
            0.0883024619 * r +
            0.2817188376 * g +
            0.6299787005 * b
        );

        return {
            L: 0.2104542553 * l +
                0.7936177850 * m -
                0.0040720468 * s,

            a: 1.9779984951 * l -
                2.4285922050 * m +
                0.4505937099 * s,

            b: 0.0259040371 * l +
                0.7827717662 * m -
                0.8086757660 * s
        };
    }

    // Convert OKLab back to sRGB hex.
    function oklabToHex(lab) {
        const l = Math.pow(
            lab.L + 0.3963377774 * lab.a +
            0.2158037573 * lab.b, 3
        );

        const m = Math.pow(
            lab.L - 0.1055613458 * lab.a -
            0.0638541728 * lab.b, 3
        );

        const s = Math.pow(
            lab.L - 0.0894841775 * lab.a -
            1.2914855480 * lab.b, 3
        );

        const r = 4.0767416621 * l -
            3.3077115913 * m +
            0.2309699292 * s;

        const g = -1.2684380046 * l +
            2.6097574011 * m -
            0.3413193965 * s;

        const b = -0.0041960863 * l -
            0.7034186147 * m +
            1.7076147010 * s;

        const values = [
            delinearize(r),
            delinearize(g),
            delinearize(b)
        ];

        return "#" + values.map(v =>
            Math.round(v * 255)
                .toString(16)
                .padStart(2, "0")
        ).join("");
    }

    function interpolateColor(start, end, amount) {
        const a = rgbToOklab(start);
        const b = rgbToOklab(end);

        return oklabToHex({
            L: a.L + (b.L - a.L) * amount,
            a: a.a + (b.a - a.a) * amount,
            b: a.b + (b.b - a.b) * amount
        });
    }


    // ==========================================
    // 3. INSTANCE CREATION
    // ==========================================

    function create(canvasSelector, options = {}) {

        const canvas = typeof canvasSelector === "string"
            ? document.querySelector(canvasSelector)
            : canvasSelector;

        if (!canvas || !canvas.getContext) {
            throw new Error(
                "MeridianOcean: Canvas element not found."
            );
        }

        const ctx = canvas.getContext("2d", {
            alpha: false
        });

        const config = {
            ...defaultConfig,
            ...options
        };

        const palettes = {
            light: structuredClone(defaultPalettes.light),
            dark: structuredClone(defaultPalettes.dark)
        };

        let width = 0;
        let height = 0;

        let elapsed = 0;
        let lastTime = 0;

        let animationFrame = null;
        let destroyed = false;

        let currentTheme = 0;
        let targetTheme = 0;

        let visible = !document.hidden;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


        // ======================================
        // 4. BLOB GENERATION
        // ======================================

        function random(min, max) {
            return Math.random() * (max - min) + min;
        }

        const blobs = Array.from(
            { length: config.blobCount },
            (_, i) => ({
                x: random(-0.2, 1.2),
                y: random(-0.2, 1.2),

                radiusX: random(0.35, 0.75),
                radiusY: random(0.2, 0.55),

                phase: random(0, Math.PI * 2),
                speed: random(0.5, 1.2),

                rotation: random(0, Math.PI * 2),

                opacity: random(0.35, 0.75),

                colorIndex: i
            })
        );


        // ======================================
        // 5. PALETTE INTERPOLATION
        // ======================================

        function getCurrentPalette() {
            const amount = currentTheme;

            const light = palettes.light;
            const dark = palettes.dark;

            return {
                background: light.background.map(
                    (color, i) =>
                        interpolateColor(
                            color,
                            dark.background[i],
                            amount
                        )
                ),

                colors: light.colors.map(
                    (color, i) =>
                        interpolateColor(
                            color,
                            dark.colors[i],
                            amount
                        )
                )
            };
        }


        // ======================================
        // 6. THEME ANIMATION
        // ======================================

        function updateTheme(delta) {
            const difference = targetTheme - currentTheme;

            if (Math.abs(difference) < 0.001) {
                currentTheme = targetTheme;
                return;
            }

            const progress =
                1 - Math.exp(
                    -config.transitionSpeed * delta
                );

            currentTheme += difference * progress;
        }


        // ======================================
        // 7. CANVAS RESIZING
        // ======================================

        function resize() {
            if (destroyed) return;

            const rect = canvas.getBoundingClientRect();

            width = rect.width;
            height = rect.height;

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                config.maxPixelRatio
            );

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            ctx.setTransform(
                dpr, 0,
                0, dpr,
                0, 0
            );

            render(elapsed);
        }


        // ======================================
        // 8. BACKGROUND RENDERING
        // ======================================

        function drawBackground(palette) {
            const gradient = ctx.createLinearGradient(
                0, 0,
                width, height
            );

            gradient.addColorStop(
                0,
                palette.background[0]
            );

            gradient.addColorStop(
                0.5,
                palette.background[1]
            );

            gradient.addColorStop(
                1,
                palette.background[2]
            );

            ctx.fillStyle = gradient;

            ctx.fillRect(
                0, 0,
                width, height
            );
        }


        // ======================================
        // 9. LIQUID SHAPE GENERATION
        // ======================================

        function drawBlob(blob, time, color) {

            const t =
                time * config.speed * blob.speed;

            const cx =
                blob.x * width +
                Math.sin(t + blob.phase) *
                width * 0.09;

            const cy =
                blob.y * height +
                Math.cos(t * 0.8 + blob.phase) *
                height * 0.08;

            const rx = blob.radiusX * width;
            const ry = blob.radiusY * height;

            const rotation =
                blob.rotation +
                Math.sin(t * 0.7 + blob.phase) * 0.15;

            const points = [];
            const segments = 100;

            for (let i = 0; i < segments; i++) {

                const angle =
                    (i / segments) * Math.PI * 2;

                const distortion =
                    1 +
                    config.amplitude * (
                        0.45 * Math.sin(
                            angle * 3 + t + blob.phase
                        ) +

                        0.30 * Math.sin(
                            angle * 2 - t * 0.8
                        ) +

                        0.25 * Math.cos(
                            angle * 4 + t * 0.6
                        )
                    );

                const x =
                    Math.cos(angle) * rx * distortion;

                const y =
                    Math.sin(angle) * ry * distortion;

                const rotatedX =
                    x * Math.cos(rotation) -
                    y * Math.sin(rotation);

                const rotatedY =
                    x * Math.sin(rotation) +
                    y * Math.cos(rotation);

                points.push({
                    x: cx + rotatedX,
                    y: cy + rotatedY
                });
            }


            // Create a smooth closed path.

            ctx.beginPath();

            const firstMid = {
                x: (points[0].x + points[1].x) / 2,
                y: (points[0].y + points[1].y) / 2
            };

            ctx.moveTo(firstMid.x, firstMid.y);

            for (let i = 1; i < points.length; i++) {

                const current = points[i];

                const next =
                    points[(i + 1) % points.length];

                const mid = {
                    x: (current.x + next.x) / 2,
                    y: (current.y + next.y) / 2
                };

                ctx.quadraticCurveTo(
                    current.x,
                    current.y,
                    mid.x,
                    mid.y
                );
            }

            ctx.closePath();


            // Apply a soft color gradient.

            const gradient = ctx.createLinearGradient(
                cx - rx,
                cy - ry,
                cx + rx,
                cy + ry
            );

            gradient.addColorStop(0, color);
            gradient.addColorStop(1, "#FFFFFF");

            ctx.globalAlpha =
                blob.opacity * config.opacity;

            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.globalAlpha = 1;
        }


        // ======================================
        // 10. MAIN RENDERER
        // ======================================

        function render(time) {

            if (destroyed || width === 0 || height === 0) {
                return;
            }

            const palette = getCurrentPalette();

            ctx.clearRect(
                0, 0,
                width, height
            );

            drawBackground(palette);

            blobs.forEach((blob, i) => {

                const color =
                    palette.colors[
                    blob.colorIndex % palette.colors.length
                    ];

                drawBlob(
                    blob,
                    time + i * 5000,
                    color
                );
            });
        }


        // ======================================
        // 11. ANIMATION LOOP
        // ======================================

        function animate(timestamp) {

            if (destroyed || !visible) return;

            if (!lastTime) {
                lastTime = timestamp;
            }

            const delta = Math.min(
                timestamp - lastTime,
                50
            );

            lastTime = timestamp;

            updateTheme(delta);

            // Keep the liquid stationary when reduced motion
            // is enabled, but still allow theme transitions.

            if (!reducedMotion.matches) {
                elapsed += delta;
            }

            render(elapsed);

            const themeTransitioning =
                Math.abs(targetTheme - currentTheme) > 0.001;

            if (
                !reducedMotion.matches ||
                themeTransitioning
            ) {
                animationFrame =
                    requestAnimationFrame(animate);
            } else {
                animationFrame = null;
            }
        }


        function start() {

            if (destroyed || !visible) return;

            cancelAnimationFrame(animationFrame);

            lastTime = 0;

            if (reducedMotion.matches) {
                render(elapsed);

                if (Math.abs(targetTheme - currentTheme) > 0.001) {
                    animationFrame =
                        requestAnimationFrame(animate);
                }

                return;
            }

            animationFrame =
                requestAnimationFrame(animate);
        }


        // ======================================
        // 12. THEME CONTROL
        // ======================================

        function setTheme(theme) {

            if (theme !== "light" && theme !== "dark") {
                throw new Error(
                    'Theme must be "light" or "dark".'
                );
            }

            targetTheme = theme === "dark" ? 1 : 0;

            document.documentElement.dataset.theme = theme;

            start();
        }


        // ======================================
        // 13. CUSTOMIZATION API
        // ======================================

        function setSpeed(value) {
            config.speed = Math.max(0, value);
        }

        function setColors(colors, theme = "light") {

            if (!["light", "dark"].includes(theme)) {
                throw new Error("Invalid theme.");
            }

            if (!Array.isArray(colors) || colors.length !== 5) {
                throw new Error(
                    "Provide exactly five colors."
                );
            }

            // Validate every color before updating.
            colors.forEach(hexToRgb);

            palettes[theme].colors = [...colors];

            render(elapsed);
        }

        function setBackground(colors, theme = "light") {

            if (!["light", "dark"].includes(theme)) {
                throw new Error("Invalid theme.");
            }

            if (!Array.isArray(colors) || colors.length !== 3) {
                throw new Error(
                    "Provide exactly three background colors."
                );
            }

            colors.forEach(hexToRgb);

            palettes[theme].background = [...colors];

            render(elapsed);
        }

        function configure(settings = {}) {

            if (settings.speed !== undefined) {
                config.speed = Math.max(0, settings.speed);
            }

            if (settings.amplitude !== undefined) {
                config.amplitude = Math.max(
                    0,
                    settings.amplitude
                );
            }

            if (settings.opacity !== undefined) {
                config.opacity = Math.max(
                    0,
                    Math.min(1, settings.opacity)
                );
            }

            if (settings.transitionSpeed !== undefined) {
                config.transitionSpeed = Math.max(
                    0.00001,
                    settings.transitionSpeed
                );
            }

            render(elapsed);
        }


        // ======================================
        // 14. BROWSER LIFECYCLE
        // ======================================

        const observer = new ResizeObserver(resize);

        observer.observe(canvas.parentElement || canvas);

        function handleVisibility() {

            visible = !document.hidden;

            if (visible) {
                start();
            } else {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
                lastTime = 0;
            }
        }

        function handleMotionPreference() {
            start();
        }

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        reducedMotion.addEventListener(
            "change",
            handleMotionPreference
        );


        // ======================================
        // 15. INITIALIZATION
        // ======================================

        const initialTheme =
            document.documentElement.dataset.theme ||
            (window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches ? "dark" : "light");

        currentTheme =
            initialTheme === "dark" ? 1 : 0;

        targetTheme = currentTheme;

        resize();
        start();


        // ======================================
        // 16. PUBLIC API
        // ======================================

        function destroy() {

            if (destroyed) return;

            destroyed = true;

            cancelAnimationFrame(animationFrame);

            observer.disconnect();

            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );

            reducedMotion.removeEventListener(
                "change",
                handleMotionPreference
            );

            ctx.clearRect(
                0, 0,
                width, height
            );
        }

        return {
            setTheme,
            setSpeed,
            setColors,
            setBackground,
            configure,
            render,
            destroy,

            get theme() {
                return targetTheme === 1 ? "dark" : "light";
            },

            get config() {
                return { ...config };
            }
        };
    }

    return { create };

})();

const ocean = MeridianOcean.create("#meridian-ocean");
window.ocean = ocean;

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (event.matches) {
        ocean.setTheme('dark');
    } else {
        ocean.setTheme('light');
    }
})