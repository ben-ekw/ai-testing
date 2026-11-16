import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            // Plain classic scripts loaded by <script> tags, not modules.
            sourceType: "script",
            globals: {
                ...globals.browser,
            },
        },
    },
];
