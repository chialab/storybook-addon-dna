/**
 * @see https://github.com/storybookjs/storybook/pull/15138
 */
const typescript = require('typescript');

const convertCustomElementsManifest = function(manifest) {
    if (!manifest.modules) {
        return;
    }

    manifest.modules.forEach((entry) => {
        if (!entry.exports) {
            return;
        }

        manifest.tags = manifest.tags || [];
        manifest.tags.push(...entry.exports
            .filter((exp) => exp.kind === 'custom-element-definition')
            .map((exp) => {
                const declaration = entry.declarations.find(({ kind, name }) => kind === 'class' && name === exp.declaration.name);
                return {
                    ...declaration,
                    properties: (declaration.members || [])
                        .filter((member) => !member.privacy && member.kind !== 'method')
                        .map((member) => {
                            if (member.type) {
                                member.type = member.type.text;
                            }
                            return member;
                        }),
                    methods: (declaration.members || [])
                        .filter((member) => !member.privacy && member.kind !== 'field'),
                    attributes: (declaration.attributes || [])
                        .map((member) => {
                            if (member.type) {
                                member.type = member.type.text;
                            }
                            return member;
                        }),
                    ...exp,
                };
            })
        );
    });
};

module.exports = async function(source, map, meta) {
    const callback = this.async();
    const { create } = await import('@custom-elements-manifest/analyzer/src/create.js');
    const { litPlugin } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js');
    const modules = [
        typescript.createSourceFile(this.resourcePath, source, typescript.ScriptTarget.ES2015, true),
    ];
    const customElementsManifest = create({
        modules,
        plugins: [
            ...litPlugin(),
        ],
    });

    convertCustomElementsManifest(customElementsManifest);

    if (!customElementsManifest.tags || customElementsManifest.tags.length === 0) {
        return callback(null, source, map, meta);
    }

    const result = `import { getCustomElements as __getCustomElements__, setCustomElements as __setCustomElements__ } from '@storybook/web-components';\n${source}

    const __CUSTOM_ELEMENT_JSON__ = ${JSON.stringify(customElementsManifest)};
    const __CUSTOM_ELEMENTS_JSON__ = __getCustomElements__() || {};
    __setCustomElements__({
        ...__CUSTOM_ELEMENTS_JSON__,
        ...__CUSTOM_ELEMENT_JSON__,
        tags: [
            ...(__CUSTOM_ELEMENTS_JSON__.tags || []),
            ...(__CUSTOM_ELEMENT_JSON__.tags || []),
        ],
    });`;

    callback(null, result, map, meta);
};
