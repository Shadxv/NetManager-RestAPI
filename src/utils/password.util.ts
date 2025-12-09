'use strict';

import * as crypto from 'crypto';

export function generateRandomPassword(length: number = 24): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-=_+[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + digits + symbols;

    if (length < 10) {
        throw new Error('Length cannot be lower than 10 chars.');
    }

    let password = '';

    for (let i = 0; i < length; i++) {
        password += selectRandomChar(allChars);
    }

    return shuffleString(password);
}

function selectRandomChar(chars: string): string {
    const randomIndex = crypto.randomInt(chars.length);
    return chars[randomIndex];
}

function shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}
