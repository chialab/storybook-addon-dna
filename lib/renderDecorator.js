import { window, DOM, render } from '@chialab/dna';

/**
 * @param {string} id 
 * @return {HTMLDivElement}
 */
function getRenderRoot(id) {
    const root = document.getElementById('root');
    if (root.firstChild instanceof window.HTMLDivElement && root.firstChild.id == id) {
        return root.firstChild;
    }
    const div = DOM.createElement('div');
    div.id = id;
    return div;
}

/**
 * @param {import('@storybook/addons').StoryFn} storyFn 
 * @param {import('@storybook/addons').StoryContext} context 
 */
export function renderDecorator(storyFn, context) {
    const vnode = /** @type {import('@chialab/dna').Template} */ (storyFn());
    const root = getRenderRoot(context.id);
    render(vnode, root);
    return root;
};
