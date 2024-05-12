// 判断是arm 还是 x86
export const isARM = process.arch === 'arm' || process.arch === 'arm64';
export const isX86 = process.arch === 'x64' || process.arch === 'ia32';
