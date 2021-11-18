const babel = require('@babel/core');
const _ = require('lodash');
const plugin = require('../index');
const makeStore = require('./__mocks__/store.mock');

jest.mock('vue-record-tags-loader/lib/store', () => require('./__mocks__/store.mock'));

const example = `
import { Button } from 'element-ui';

export default {
  name: 'About',
  /* name: joyer */
  components: {
    [Button.name]: Button,
  },
};
`;

function isElTag(tag) {
  return _.startsWith(tag, 'el-');
}

function isCdTag(tag) {
  return _.startsWith(tag, 'cd-');
}

function isMktTag(tag) {
  return _.startsWith(tag, 'mkt-');
}

it('自动导入', () => {
  makeStore.set('path/to/file.vue', ['section', 'cd-panel', 'el-row', 'el-col', 'mkt-icon',
    'cd-text-action', 'span', 'el-form', 'el-form-item', 'cd-input-money',
    'div', 'cd-button', 'CdButton', 'md-agreement']);

  const { code } = babel.transform(example, {
    filename: 'path/to/file.vue',
    sourceType: 'module',
    plugins: [[plugin, {
      lib(tag) {
        if (isElTag(tag)) {
          return `element-ui/lib/${tag.replace('el-', '')}`;
        }
        if (isCdTag(tag)) {
          return `@candy/ui/lib/component/${tag}`;
        }
        if (isMktTag(tag)) {
          return `comp@/${tag}`;
        }
        return null;
      },
      style(tag) {
        if (isElTag(tag)) {
          const label = tag.replace('el-', '');
          return `element-ui/lib/theme-chalk/${label}.css`;
        }
        return null;
      },
    }]],
  });
  const resetCode = code.replace(/".*babel-plugin-vue-import-component-by-tag/g, '"babel-plugin-vue-import-component-by-tag');
  expect(resetCode).toMatchSnapshot();
});
it('排查指定文件不自动导入', () => {
  makeStore.set('path/to/file.vue', ['section', 'cd-panel', 'el-row', 'el-col', 'mkt-icon',
    'cd-text-action', 'span', 'el-form', 'el-form-item', 'cd-input-money',
    'div', 'cd-button', 'CdButton', 'md-agreement']);

  const { code } = babel.transform(example, {
    filename: '/path/to/file.vue',
    sourceType: 'module',
    plugins: [[plugin, {
      exclude: ['**/to/file.vue'],
      lib(tag) {
        if (isElTag(tag)) {
          return `element-ui/lib/${tag.replace('el-', '')}`;
        }
        if (isCdTag(tag)) {
          return `@candy/ui/lib/component/${tag}`;
        }
        if (isMktTag(tag)) {
          return `comp@/${tag}`;
        }
        return null;
      },
      style(tag) {
        if (isElTag(tag)) {
          const label = tag.replace('el-', '');
          return `element-ui/lib/theme-chalk/${label}.css`;
        }
        return null;
      },
    }]],
  });
  expect(code).toMatchSnapshot();
});
