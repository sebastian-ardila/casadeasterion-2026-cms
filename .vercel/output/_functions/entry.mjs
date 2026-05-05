import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BQdAZvxw.mjs';
import { manifest } from './manifest_BxK-PPao.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/upload.astro.mjs');
const _page2 = () => import('./pages/auth/callback.astro.mjs');
const _page3 = () => import('./pages/authors/new.astro.mjs');
const _page4 = () => import('./pages/authors/_id_.astro.mjs');
const _page5 = () => import('./pages/authors.astro.mjs');
const _page6 = () => import('./pages/books/new.astro.mjs');
const _page7 = () => import('./pages/books/_id_.astro.mjs');
const _page8 = () => import('./pages/books.astro.mjs');
const _page9 = () => import('./pages/categories.astro.mjs');
const _page10 = () => import('./pages/login.astro.mjs');
const _page11 = () => import('./pages/logout.astro.mjs');
const _page12 = () => import('./pages/posts/new.astro.mjs');
const _page13 = () => import('./pages/posts/_id_.astro.mjs');
const _page14 = () => import('./pages/posts.astro.mjs');
const _page15 = () => import('./pages/site.astro.mjs');
const _page16 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.18.1_@types+node@25.6.0_@vercel+functions@3.5.0_jiti@2.6.1_lightningcss@1.32.0__8828e99c36da35dd27a8582a83d72f7b/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/upload.ts", _page1],
    ["src/pages/auth/callback.ts", _page2],
    ["src/pages/authors/new.astro", _page3],
    ["src/pages/authors/[id].astro", _page4],
    ["src/pages/authors/index.astro", _page5],
    ["src/pages/books/new.astro", _page6],
    ["src/pages/books/[id].astro", _page7],
    ["src/pages/books/index.astro", _page8],
    ["src/pages/categories/index.astro", _page9],
    ["src/pages/login.astro", _page10],
    ["src/pages/logout.ts", _page11],
    ["src/pages/posts/new.astro", _page12],
    ["src/pages/posts/[id].astro", _page13],
    ["src/pages/posts/index.astro", _page14],
    ["src/pages/site.astro", _page15],
    ["src/pages/index.astro", _page16]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "1151f509-c814-42a7-bcbd-050a8d489e0f",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
