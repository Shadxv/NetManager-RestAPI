'use strict';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

export function durationToMilliseconds(durationString: string = '1d'): number {
    const match = durationString.match(/^(\d+)([smhdMy])$/i);

    if (!match) {
        throw new Error(`Cannot parse this ${durationString} expresion into duration.`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    let milliseconds = 0;

    switch (unit) {
        case 's':
            milliseconds = value * MS_PER_SECOND;
            break;
        case 'm':
            milliseconds = value * MS_PER_MINUTE;
            break;
        case 'h':
            milliseconds = value * MS_PER_HOUR;
            break;
        case 'd':
            milliseconds = value * MS_PER_DAY;
            break;
        case 'M':
            milliseconds = value * MS_PER_MONTH;
            break;
        case 'y':
            milliseconds = value * MS_PER_YEAR;
            break;
        default:
            throw new Error(`Unknown unit of time: ${unit}.`);
    }

    return milliseconds;
}

export function calculateExpirationDate(durationString?: string): Date {
    let ms: number;
    try {
        ms = durationString ? durationToMilliseconds(durationString) : durationToMilliseconds();
    } catch (e) {
        ms = durationToMilliseconds();
    }
    return new Date(Date.now() + ms);
}
