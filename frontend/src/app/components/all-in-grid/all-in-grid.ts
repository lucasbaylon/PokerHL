import { Situation } from '../../interfaces/situation';

const ranks = 'AKQJT98765432'.split('');
const stacks = Array.from({ length: 30 }, (_, i) => 15 - i / 2);
const format = (value: number) => value.toString().replace('.', ',');

export function thresholdColor(stack: number): string {
    // Continuous gradient from light pink (0.5 BB) to burgundy (15 BB).
    const stops = [[255, 228, 230], [253, 164, 175], [244, 63, 94], [128, 0, 32]];
    const progress = (Math.max(0.5, Math.min(15, stack)) - 0.5) / 14.5 * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(progress));
    const fraction = progress - index;
    const rgb = stops[index].map((value, i) => Math.round(value + (stops[index + 1][i] - value) * fraction));
    return `rgb(${rgb.join(',')})`;
}

function thresholdTextColor(stack: number): string {
    const channels = thresholdColor(stack).match(/\d+/g)!.map(value => {
        const channel = Number(value) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
}

export function buildAllInGrid(situations: Situation[]) {
    const byStack = new Map<number, Situation[]>();
    for (const situation of situations) {
        const stack = Number(situation.stack);
        if (!stacks.includes(stack)) continue;
        byStack.set(stack, [...(byStack.get(stack) || []), situation]);
    }
    const rows = ranks.map((rank, row) => ranks.map((other, col) => {
        const hand = row === col ? rank + other : row < col ? rank + other + 's' : other + rank + 'o';
        const states = stacks.map(stack => {
            const ranges = byStack.get(stack) || [];
            const values = ranges.map(range => {
                const card = range.situations.flat().find(card => card.card === hand);
                if (!card) return undefined;
                if (!card.solution) return false;
                const solution = range.solutions.find(solution => solution.id === card.solution);
                if (!solution) return undefined;
                if (solution.type === 'unique') return solution.action ? solution.action === 'all-in' : undefined;
                if (solution.type !== 'mixed' || !solution.colorList?.length) return undefined;
                const parts = solution.colorList.filter(part => (part.percent || 0) > 0);
                if (!parts.length) return undefined;
                const actions = parts.map(part => range.solutions.find(item => item.id === part.color)?.action);
                if (actions.includes(undefined)) return undefined;
                const allInPercent = parts.reduce((total, part, index) =>
                    total + (actions[index] === 'all-in' ? part.percent || 0 : 0), 0);
                const totalPercent = parts.reduce((total, part) => total + (part.percent || 0), 0);
                return Math.abs(totalPercent - 100) < 0.000001
                    && Math.abs(allInPercent - 100) < 0.000001;
            });
            // Conflicting duplicate ranges cannot establish a reliable threshold.
            return values.length && values.every(value => value === values[0]) ? values[0] : undefined;
        });
        const yes = stacks.filter((_, i) => states[i] === true);
        const threshold = yes[0];
        const firstAllIn = states.indexOf(true);
        const discontinuous = firstAllIn >= 0 && states.slice(firstAllIn + 1).includes(false);
        const label = (threshold === undefined ? '—' : format(threshold))
            + (discontinuous ? '*' : '');
        const detail = `${hand} — All-in : ${yes.length ? yes.map(format).join(' ; ') + ' BB' : 'aucun observé'}.`
            + (discontinuous ? ' Attention : all-in non continu aux profondeurs inférieures.' : '');
        const base = threshold === undefined ? '#e2e8f0' : thresholdColor(threshold);
        return {
            hand, label, detail,
            background: discontinuous ? `repeating-linear-gradient(135deg, transparent 0px, transparent 4px, rgba(0,0,0,0.18) 4px, rgba(0,0,0,0.18) 6px), linear-gradient(${base}, ${base})` : base,
            foreground: threshold === undefined ? '#000000' : thresholdTextColor(threshold),
            labelBackground: discontinuous ? base : 'transparent'
        };
    }));
    return { rows };
}
