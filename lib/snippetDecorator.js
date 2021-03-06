import { window } from '@chialab/dna';
import { addons } from '@storybook/addons';
import prettier from 'prettier/standalone';
import prettierHtml from 'prettier/parser-html';

/**
 * @param {*} value 
 * @return {boolean}
 */
function isObject(value) {
    if (typeof value === 'object') {
        return true;
    }
    if (typeof value !== 'string') {
        return false;
    }
    value = value.trim();
    if (value[0] !== '{' && value[0] !== '[') {
        return false;
    }
    try {
        return typeof JSON.parse(value) === 'object';
    } catch {
        return false;
    }
}

/**
 * @param {*} value 
 * @return {boolean}
 */
function isArray(value) {
    if (Array.isArray(value)) {
        return true;
    }
    if (typeof value !== 'string') {
        return false;
    }
    value = value.trim();
    if (value[0] !== '[') {
        return false;
    }
    try {
        return Array.isArray(JSON.parse(value));
    } catch {
        return false;
    }
}

const voidElements = [
    'area',
    'base',
    'basefont',
    'bgsound',
    'br',
    'col',
    'command',
    'embed',
    'frame',
    'hr',
    'image',
    'img',
    'input',
    'isindex',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'nextid',
    'param',
    'source',
    'track',
    'wbr'
];

/**
 * @param {import('@chialab/dna').Template} vnode 
 * @return {string} 
 */
function vnodeToNode(vnode) {
    if (typeof vnode !== 'object') {
        return vnode.toString();
    }
    if (Array.isArray(vnode)) {
        return vnode.map(vnodeToNode).join('');
    }
    if (vnode instanceof window.Element) {
        return vnode.outerHTML;
    }
    if (vnode instanceof window.Node) {
        return vnode.textContent;
    }

    const hyperObject = /** @type {any} */ (vnode);
    const tag = hyperObject.tag || (hyperObject.Component && hyperObject.Component.prototype.is);
    const properties = hyperObject.properties || {};
    const attrs = Object.keys(properties).map((prop) => {
        let value = properties[prop];
        if (isObject(value)) {
            value = '{...}';
        }
        if (isArray(value)) {
            value = '[...]';
        }
        return `${prop}="${value}"`;
    }).join(' ');

    if (voidElements.indexOf(tag) !== -1) {
        return `<${tag} ${attrs} />`;
    }

    return `<${tag} ${attrs}>${(hyperObject.children || []).map(vnodeToNode).join('')}</${tag}>`;
}

/**
 * @param {import('@storybook/addons').StoryFn} storyFn 
 * @param {import('@storybook/addons').StoryContext} context 
 */
export function snippetDecorator(storyFn, context) {
    const vnode = /** @type {import('@chialab/dna').Template} */ (storyFn());
    const source = vnodeToNode(vnode);
    const code = prettier.format(source, {
        parser: 'html',
        printWidth: Infinity,
        plugins: [prettierHtml],
        // Because the parsed vnode missing spaces right before/after the surround tag,
        // we always get weird wrapped code without this option.
        htmlWhitespaceSensitivity: 'ignore',
    });

    context.parameters.storySource.source = code;

    try {
        /* @ts-ignore */
        const { SNIPPET_RENDERED } = require('@storybook/addon-docs/dist/cjs/shared');
        addons.getChannel().emit(SNIPPET_RENDERED, context.id, code);
    } catch {
        //
    }

    return vnode;
};
