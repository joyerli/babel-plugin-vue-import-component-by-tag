const _ = require('lodash');
const { addDefault, addSideEffect } = require('@babel/helper-module-imports');
const render = require('json-templater/string');
const pathLib = require('path');
const { get: getTags } = require('vue-record-tags-loader/lib/store');
const anymatch = require('anymatch');

function posixPath(path) {
  if (!path) {
    return null;
  }
  return path.replace(/\\/ig, '/');
}

const registerPath = pathLib.posix.join(posixPath(__dirname), 'runtime', 'register.js');
function isExcludeFile(state) {
  const {
    filename: filePath,
    opts: {
      exclude,
    } = {},
  } = state;
  return exclude && anymatch(exclude, posixPath(filePath));
}

module.exports = (babel) => {
  const { types: t, template } = babel;
  let tags = [];
  return {
    visitor: {
      Program(root, state) {
        if (isExcludeFile(state)) {
          return;
        }
        tags = getTags(state.filename) || [];
      },
      JSXOpeningElement(path, state) {
        if (isExcludeFile(state)) {
          return;
        }
        path.traverse({
          JSXIdentifier(subPath) {
            const name = _.get(subPath.node, 'name');
            tags.push(name);
          },
        });
      },
      ExportDefaultDeclaration(_path, state) {
        if (isExcludeFile(state)) {
          return;
        }

        const path = _path;
        const _tags = tags.filter((tag) => tag);
        if (_.isEmpty(_tags)) {
          return;
        }

        const {
          lib = () => false,
          style = () => false,
        } = state.opts || {};
        const {
          filename: filePath,
        } = state;

        const components = _tags.map((tag) => ({
          lib: lib(tag, filePath),
          style: style(tag, filePath),
          tag,
        }))
          .filter((component) => component.lib || component.style)
          .map((_component) => {
            const component = _component;
            if (component.lib) {
              const { name: importName } = addDefault(path, component.lib);
              component.code = render(`{
                tag: '{{tag}}',
                component: {{componentName}},
              }`, {
                tag: component.tag,
                componentName: importName,
              });
            }
            if (component.style) {
              addSideEffect(path, component.style);
            }
            return component;
          });
        const { name: registerName } = addDefault(path, registerPath);
        const componentsCode = `[${components.map((component) => component.code).join(',')}]`;

        const exportVarNode = path.scope.generateUidIdentifier('component');
        path.insertBefore(t.variableDeclaration('const', [
          t.variableDeclarator(exportVarNode, path.node.declaration),
        ]));

        const buildExtendComponents = template(`
          const components = %%exportName%%.components || {};
          ${registerName}(${componentsCode}, components);
          %%exportName%%.components = components;
        `);

        const componentsNode = buildExtendComponents({
          exportName: exportVarNode,
        });
        path.insertBefore(componentsNode);

        path.node.declaration = exportVarNode;
      },
    },
  };
};
