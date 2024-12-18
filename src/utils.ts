export function escapePath(path: string): string {
    // List of special characters that need to be escaped
    const specialChars = [
        ' ', // Space
        '(', // Left parenthesis
        ')', // Right parenthesis
        '[', // Left square bracket
        ']', // Right square bracket
        '{', // Left curly brace
        '}', // Right curly brace
        '\'', // Single quote
        '"', // Double quote
        '`', // Backtick
        '!', // Exclamation mark
        '@', // At sign
        '#', // Hash
        '$', // Dollar sign
        '&', // Ampersand
        '*', // Asterisk
        '+', // Plus sign
        ',', // Comma
        ';', // Semicolon
        '=', // Equals sign
        '?', // Question mark
        '^', // Caret
        '|', // Vertical bar
        '<', // Less than sign
        '>', // Greater than sign
        '~', // Tilde
        '\\' // Backslash
    ];

    // Create regular expression pattern
    const pattern = new RegExp(
        '([' + specialChars.map(c => '\\' + c).join('') + '])',
        'g'
    );

    // Replace all special characters
    return path.replace(pattern, '\\$1');
}
