module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    commonjs: true,
  },
  plugins: [
    'html',
  ],
  // 'extends': 'eslint:recommended',
  rules: {
    // 들여쓰기 2칸 공백
    'indent': [
      'error',
      2,
      // switch-case에서도 들여쓰기를 사용
      {
        SwitchCase : 1,
      }
    ],
    // 작은 따옴표를 사용.
    quotes: [
      'warn',
      'single',
    ],
    // object literal에서 따옴표 안 써도 됨.
    'quote-props': [
      'error',
      'as-needed',
    ],
    // 세미콜론
    'semi': [
      'error',
      'always',
    ],
    // 중괄호 한 줄에
    'brace-style': [
      'error',
      '1tbs',
    ],
    // if/for 등 키워드에 공백
    'keyword-spacing': [
      'error',
      {
        before: true,
        after: true,
      }
    ],
    // typeof나 연산자에 공백
    'space-unary-ops': [
      'error',
    ],
    'space-infix-ops': [
      'error',
    ],
    // () 괄호에 공백 제거
    'space-in-parens': [
      'error',
    ],
    // function에 공백
    'space-before-function-paren': [
      'error',
      'always',
    ],
    // typesafe한 비교
    'eqeqeq': [
      'error',
    ],
    'no-undef': [
      'error',
    ],
    // 여러줄 object/array엔 쉼표(,)
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    // 화살표함수(=>)의 괄호사용 여부
    'arrow-parens': [
      'error',
      'as-needed',
    ],
    // 화살표함수 공백
    'arrow-spacing': [
      'error',
      {
        before: true,
        after: true,
      }
    ],
    // 중괄호 일관적으로
    'curly': [
      'error',
      'multi-line',
      'consistent',
    ],
  },
};
