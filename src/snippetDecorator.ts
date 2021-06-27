import type { StoryContext, StoryFn } from '@storybook/addons';
import type { Template } from '@chialab/dna';
import { window } from '@chialab/dna';
import { addons } from '@storybook/addons';
import prettier from 'prettier';
import prettierHtml from 'prettier/parser-html';

function isObject(value: any) {
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

function isArray(value: any) {
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

function vnodeToNode(vnode: Template): string {
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

    const tag = (vnode as any).tag || (vnode as any).Component?.prototype.is;
    const properties = (vnode as any).properties || {};
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

    return `<${tag} ${attrs}>${((vnode as any).children || []).map(vnodeToNode).join('')}</${tag}>`;
}

export const snippetDecorator = (storyFn: StoryFn, context: StoryContext) => {
    const vnode = storyFn() as Template;
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
        const { SNIPPET_RENDERED } = require('@storybook/addon-docs/dist/esm/shared.js');
        addons.getChannel().emit(SNIPPET_RENDERED, context.id, code);
    } catch {
        //
    }
};
