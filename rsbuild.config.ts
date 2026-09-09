import { defineConfig, type RsbuildPluginAPI } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser';
import fs from 'fs/promises';
import JScrewIt from 'jscrewit';
import path from 'path';

const convertString2Unicode = (s: string): string => {
    return s
        .split('')
        .map((char) => {
            const hexVal = char.charCodeAt(0).toString(16);
            return '\\u' + ('000' + hexVal).slice(-4);
        })
        .join('');
};

const processFile = async (filePath: string): Promise<void> => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const isHtmlFile = path.extname(filePath).toLowerCase() === '.html';
        const TMPL = `document.write('__UNI__')`;
        const jsString = isHtmlFile
            ? TMPL.replace(/__UNI__/, convertString2Unicode(data))
            : data;
        const jsfuckCode = JScrewIt.encode(jsString);

        const finalContent = isHtmlFile
            ? `<script type="text/javascript">${jsfuckCode}</script>`
            : jsfuckCode;

        await fs.writeFile(filePath, finalContent);
        console.log(`✅ Encoded: ${filePath}`);
    } catch (error) {
        console.error(`❌ Failed to process ${filePath}:`, error);
        throw error;
    }
};

const walkDir = async (dir: string): Promise<void> => {
    try {
        const files = await fs.readdir(dir);
        const processPromises: Promise<void>[] = [];

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                console.log(`📁 Entering directory: ${filePath}`);
                processPromises.push(walkDir(filePath));
            } else if (/\.(js|html)$/i.test(file)) {
                processPromises.push(processFile(filePath));
            }
        }

        await Promise.all(processPromises);
    } catch (error) {
        console.error(`❌ Error processing directory ${dir}:`, error);
        throw error;
    }
};

const pluginJSFuckEncoder = () => ({
    name: 'jsfuck-encoder',
    setup(api: RsbuildPluginAPI) {
        api.onAfterBuild(async () => {
            try {
                console.log('🚀 Starting JSFuck encoding process...');
                const distPath = path.resolve('dist');

                try {
                    await fs.access(distPath);
                } catch {
                    console.error('❌ Error: dist directory not found');
                    return;
                }

                await walkDir(distPath);
                console.log('✨ Successfully encoded all JS and HTML files in dist directory');
            } catch (err) {
                console.error('❌ Fatal error during encoding:', err);
                throw err;
            }
        });
    },
});

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginHtmlMinifierTerser({
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeTagWhitespace: true,
            sortAttributes: true,
            sortClassName: true,
            html5: true,
        }),
        pluginJSFuckEncoder(),
    ],
    html: {
        favicon: undefined,
        title: 'Home page',
        meta: {
            viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        },
    },
    performance: {
        buildCache: true,
        printFileSize: true,
        removeConsole: true,
        removeMomentLocale: true,
    },
    tools: {
        postcss: {
            postcssOptions: {
                plugins: [tailwindcss],
            },
        },
    },
});
