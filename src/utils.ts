export function escapePath(path: string): string {
    // 需要转义的特殊字符列表
    const specialChars = [
        ' ', // 空格
        '(', // 左括号
        ')', // 右括号
        '[', // 左方括号
        ']', // 右方括号
        '{', // 左花括号
        '}', // 右花括号
        '\'', // 单引号
        '"', // 双引号
        '`', // 反引号
        '!', // 感叹号
        '@', // at符号
        '#', // 井号
        '$', // 美元符号
        '&', // 与符号
        '*', // 星号
        '+', // 加号
        ',', // 逗号
        ';', // 分号
        '=', // 等号
        '?', // 问号
        '^', // 尖号
        '|', // 竖线
        '<', // 小于号
        '>', // 大于号
        '~', // 波浪号
        '\\' // 反斜杠
    ];

    // 创建正则表达式模式
    const pattern = new RegExp(
        '([' + specialChars.map(c => '\\' + c).join('') + '])',
        'g'
    );

    // 替换所有特殊字符
    return path.replace(pattern, '\\$1');
}