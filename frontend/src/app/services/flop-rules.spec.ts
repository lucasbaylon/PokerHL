import { BoardCondition, RuleCondition, describeCondition, matchBoardCondition, matchCondition, resolveAction } from './flop-rules';
import { PlayingCard, Suit, evaluateBoard, evaluateHand } from './hand-evaluator';

const SUIT_CODES: Record<string, Suit> = { s: 'spade', h: 'heart', d: 'diamond', c: 'club' };

/** Cartes à partir d'une notation courte : 'Js 9h 4d'. */
function cards(notation: string): PlayingCard[] {
    return notation.split(' ').map(card => ({ value: card[0], color: SUIT_CODES[card[1]] }));
}

function onBoard(condition: BoardCondition, notation: string): boolean {
    return matchBoardCondition(condition, evaluateBoard(cards(notation)));
}

describe('conditions de board turn et river', () => {
    it('situe la dernière carte par rapport au board précédent', () => {
        expect(onBoard({ kind: 'board', attr: 'newCardVs', op: '>', ref: 'top' }, 'Js 9h 4d Kc')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardVs', op: '>', ref: 'top' }, 'As 9h 4d Kc')).toBeFalse();
        expect(onBoard({ kind: 'board', attr: 'newCardVs', op: '<', ref: 'second' }, 'Js 9h 4d 2c')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardRank', op: '>=', rank: 9 }, '8s 8h 7d Tc')).toBeTrue();
    });

    it('reconnaît la carte qui paire le board', () => {
        expect(onBoard({ kind: 'board', attr: 'newCardPairs', ref: 'second' }, 'Js 9h 4d 9c')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardPairs', ref: 'top' }, 'Js 9h 4d 9c')).toBeFalse();
        expect(onBoard({ kind: 'board', attr: 'newCardPairs', ref: 'any' }, 'Js 9h 4d 2c')).toBeFalse();
    });

    it('reconnaît la carte qui rend la quinte ou la couleur possible', () => {
        expect(onBoard({ kind: 'board', attr: 'newCardStraight', n: 3 }, '8s 8h 7d Tc')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardStraight', n: 3 }, 'Js 9h 4d 2c')).toBeFalse();
        expect(onBoard({ kind: 'board', attr: 'newCardSuits', n: 3 }, 'Js 9s 4d Ks')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardSuits', n: 3 }, 'Js 9h 4d Ks')).toBeFalse();
        // Tirage couleur du flop arrivé à la river : compté depuis le flop
        expect(onBoard({ kind: 'board', attr: 'newCardSuits', n: 3, from: 'flop' }, 'Js 9s 4d 2c 5s')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'newCardSuits', n: 3, from: 'flop' }, 'Js 9s 4d 2c 5h')).toBeFalse();
    });

    it('reconnaît une carte haute (TH) tombée depuis le flop', () => {
        const condition: BoardCondition = { kind: 'board', attr: 'newCardTh', op: '<=', n: 3, from: 'flop' };
        expect(onBoard(condition, 'Qh 7d 3c 3s Jh')).toBeTrue();
        expect(onBoard(condition, 'Qh 7d 3c 3s 2h')).toBeFalse();
    });

    it('mesure l\'écart entre la top pair et la 2e paire (cartes non pairées)', () => {
        expect(onBoard({ kind: 'board', attr: 'pairGap', op: '>=', n: 4 }, 'Qs 7h 5d 4c')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'pairGap', op: '>=', n: 4 }, 'Js 9h 5d 4c')).toBeFalse();
        // Q466 : top pair Q, 2e paire 4
        expect(onBoard({ kind: 'board', attr: 'pairGap', op: '=', n: 7 }, 'Qs 6h 4d 6c')).toBeTrue();
    });

    it('sait si une carte du board était déjà au flop', () => {
        expect(onBoard({ kind: 'board', attr: 'fromFlop', ref: 'third' }, 'Qs Th 7d 3c 2h')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'fromFlop', ref: 'third' }, 'Js 9h 3d 7c 2h')).toBeFalse();
    });

    it('reconnaît le tirage couleur du flop arrivé (et pas une autre couleur)', () => {
        const condition: BoardCondition = { kind: 'board', attr: 'flopFlushDraw' };
        expect(onBoard(condition, 'Th 9h 5c 5d Kh')).toBeTrue();
        // Flop cœur-cœur-trèfle, turn et river trèfle : trois trèfles mais le tirage du flop (cœur) n'est pas arrivé
        expect(onBoard(condition, 'Th 9h 5c 2c Kc')).toBeFalse();
    });

    it('filtre la structure du board', () => {
        expect(onBoard({ kind: 'board', attr: 'pairing', pairing: 'doublePaired' }, '8d 3c 3h 8s')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'suitCount', op: '=', n: 4 }, 'Qs 7s 6s 3s')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'straightCount', op: '>=', n: 4 }, 'Jc 9d 8h Ts')).toBeTrue();
        expect(onBoard({ kind: 'board', attr: 'fourInRow' }, 'Jc 9d 8h Ts')).toBeTrue();
    });

    it('rend fausses les conditions sur la dernière carte au flop', () => {
        expect(onBoard({ kind: 'board', attr: 'newCardRank', op: '>=', rank: 2 }, 'Js 9h 4d')).toBeFalse();
        expect(onBoard({ kind: 'board', attr: 'newCardRank', op: '>=', rank: 2, negate: true }, 'Js 9h 4d')).toBeTrue();
    });
});

describe('conditions de main turn et river', () => {
    it('applique le rang parmi les mains possibles et le kicker qui joue', () => {
        const bestFull: RuleCondition = { kind: 'made', op: '>=', level: 'full_house', strength: { mode: 'top', n: 1 } };
        const board = cards('Ts 5h 5d 5c 2s');
        expect(matchCondition(bestFull, evaluateHand(cards('Th Td'), board))).toBeTrue();
        expect(matchCondition(bestFull, evaluateHand(cards('Ac Ad'), board))).toBeFalse();
        // Un carré reste au-dessus d'un full, quel que soit le rang du full
        expect(matchCondition(bestFull, evaluateHand(cards('5s 2c'), board))).toBeTrue();

        const kicker: RuleCondition = { kind: 'kickerPlays' };
        expect(matchCondition(kicker, evaluateHand(cards('Jd 4c'), cards('9s 4h 3d 9c Ts')))).toBeTrue();
    });

    it('compare une paire servie aux paires du board comptées sur les cartes non pairées', () => {
        // J94J : top pair = 9, 2e paire = 4 ; 66 est entre les deux
        const between: RuleCondition[] = [
            { kind: 'heroCard', card: 'low', op: '>', ref: 'secondPair' },
            { kind: 'heroCard', card: 'low', op: '<', ref: 'topPair' }
        ];
        const board = cards('Js 9h 4d Jc');
        expect(between.every(condition => matchCondition(condition, evaluateHand(cards('6s 6h'), board)))).toBeTrue();
        expect(between.every(condition => matchCondition(condition, evaluateHand(cards('Ts Th'), board)))).toBeFalse();
    });

    it('résout la première règle remplie', () => {
        const rules = [
            { id: 'rule_1', conditions: [{ kind: 'made', op: '>=', level: 'top_pair' } as RuleCondition], solutionId: 'bet75' },
            { id: 'rule_2', conditions: [{ kind: 'made', op: '=', level: 'nothing' } as RuleCondition, { kind: 'th', op: '>', n: 2 } as RuleCondition], solutionId: 'bluff' }
        ];
        expect(resolveAction(rules, 'check', evaluateHand(cards('Ks Qd'), cards('Kh 9c 4d 2s'))).solutionId).toBe('bet75');
        expect(resolveAction(rules, 'check', evaluateHand(cards('8s 6d'), cards('Kh 9c 4d 2s'))).solutionId).toBe('bluff');
        expect(resolveAction(rules, 'check', evaluateHand(cards('As 6d'), cards('Kh 9c 4d 2s'))).solutionId).toBe('check');
    });

    it('décrit les nouvelles conditions', () => {
        const conditions: RuleCondition[] = [
            { kind: 'kickerPlays' },
            { kind: 'board', attr: 'pairing', pairing: 'trips' },
            { kind: 'board', attr: 'newCardVs', op: '>', ref: 'top' },
            { kind: 'board', attr: 'newCardSuits', n: 3, from: 'flop' },
            { kind: 'board', attr: 'newCardTh', op: '<=', n: 3 },
            { kind: 'made', op: '=', level: 'straight', strength: { mode: 'top', n: 1 } }
        ];
        conditions.forEach(condition => expect(describeCondition(condition)).toBeTruthy());
    });
});
