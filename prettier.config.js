module.exports = {
    singleQuote: true,
    trailingComma: 'all',
    tabWidth: 4,
    overrides: [
        {
            files: '*.ts',
            options: {
                parser: 'typescript',
            },
        },
    ],
};
