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

function upgradeRoot() {
    const root = document.getElementById('root');
    root.appendChild = function(child) { return DOM.appendChild(this, child) };
    root.removeChild = function(child) { return DOM.removeChild(this, child) };
    root.insertBefore = function(child, ref) { return DOM.insertBefore(this, child, ref) };
}

/**
 * @param {import('@storybook/addons').StoryFn} storyFn 
 * @param {import('@storybook/addons').StoryContext} context 
 */
export function renderDecorator(storyFn, context) {
    upgradeRoot();
    const vnode = /** @type {import('@chialab/dna').Template} */ (storyFn());
    const root = getRenderRoot(context.id);
    render(vnode, root);
    return root;
};
