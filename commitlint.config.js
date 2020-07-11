const maxLineLength = 72;

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-line-length': [2, 'always', maxLineLength],
        'footer-max-line-length': [2, 'always', maxLineLength],
        'header-max-length': [2, 'always', maxLineLength],
    },
};
