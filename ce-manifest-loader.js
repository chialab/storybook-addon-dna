const typescript = require('typescript');

module.exports = async function(source, map, meta) {
    const callback = this.async();
    const { create } = await import('@custom-elements-manifest/analyzer/src/create.js');
    const { default: dnaPlugins } = await import('@chialab/dna/analyzer');

    const modules = [
        typescript.createSourceFile(this.resourcePath, source, typescript.ScriptTarget.ES2015, true),
    ];

    const customElementsManifest = create({
        modules,
        plugins: [
            ...dnaPlugins(),
        ],
    });

    if (!customElementsManifest.modules ||
        customElementsManifest.modules.length === 0) {
        return callback(null, source, map, meta);
    }

    const result = `import * as __STORYBOOK_WEB_COMPONENTS__ from '@storybook/web-components';\n${source}

    (function() {
        const { getCustomElements, setCustomElementsManifest } = __STORYBOOK_WEB_COMPONENTS__;
        if (!setCustomElementsManifest) {
            console.debug('Custom Element Manifest is not supported by this version of Storybook.');
            return;
        }

        const CUSTOM_ELEMENT_JSON = ${JSON.stringify(customElementsManifest)};
        const CUSTOM_ELEMENTS_JSON = getCustomElements() || {};
        setCustomElementsManifest({
            ...CUSTOM_ELEMENTS_JSON,
            ...CUSTOM_ELEMENT_JSON,
            modules: [
                ...(CUSTOM_ELEMENTS_JSON.modules || []),
                ...(CUSTOM_ELEMENT_JSON.modules || []),
            ],
        });
    }())`;

    callback(null, result, map, meta);
};
