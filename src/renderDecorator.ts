import type { StoryFn, StoryContext } from '@storybook/addons';
import type { Template } from '@chialab/dna';
import { DOM, render } from '@chialab/dna';

function getRenderRoot(id: string) {
    const root = document.getElementById('root');
    if (root.firstChild instanceof HTMLElement && root.firstChild.id == id) {
        return root.firstChild;
    }
    const div = DOM.createElement('div');
    div.id = id;
    return div;
}

export const renderDecorator = (storyFn: StoryFn, context: StoryContext) => {
    const vnode = storyFn() as Template;
    const root = getRenderRoot(context.id);
    render(vnode, root);
    return root;
};
