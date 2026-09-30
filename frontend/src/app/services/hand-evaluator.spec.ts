import { PlayingCard, Suit, evaluateBoard, evaluateHand } from './hand-evaluator';

const SUIT_CODES: Record<string, Suit> = { s: 'spade', h: 'heart', d: 'diamond', c: 'club' };

/** Cartes à partir d'une notation courte : 'Js 9h 4d'. */
function cards(notation: string): PlayingCard[] {
    return notation.split(' ').map(card => ({ value: card[0], color: SUIT_CODES[card[1]] }));
}

describe('evaluateBoard', () => {
    it('décrit la turn par rapport au flop (overcard qui rend la quinte possible)', () => {
        const board = evaluateBoard(cards('Js 9h 4d Kc'));
        expect(board.runout?.rank).toBe(13);
        expect(board.runout?.previousRanks).toEqual([11, 9, 4]);
        expect(board.runout?.previous.straightMaxBefore).toBe(2);
        expect(board.straightMax).toBe(3);
    });

    it('n\'a pas de dernière carte au flop', () => {
        expect(evaluateBoard(cards('Js 9h 4d')).runout).toBeUndefined();
    });

    it('compte les cartes de la même couleur et à la quinte', () => {
        expect(evaluateBoard(cards('Qs 7s 6s 3s')).suitMax).toBe(4);
        expect(evaluateBoard(cards('Jc 9d 8h Ts')).straightMax).toBe(4);
        expect(evaluateBoard(cards('Jc 9d 8h Ts')).fourInRow).toBeTrue();
        expect(evaluateBoard(cards('Jc 9d 4h 8s Qd')).fourInRow).toBeFalse();
        expect(evaluateBoard(cards('5s 6h 7d 8c 9s')).straightMax).toBe(5);
    });

    it('classe les paires du board', () => {
        expect(evaluateBoard(cards('Kd 7h 2c 9s')).pairing).toBe('unpaired');
        expect(evaluateBoard(cards('Kd 7h 2c 7s')).pairing).toBe('paired');
        expect(evaluateBoard(cards('8d 3c 3h 8s')).pairing).toBe('doublePaired');
        expect(evaluateBoard(cards('7d 7h Kc 7s')).pairing).toBe('trips');
        expect(evaluateBoard(cards('Ts 5h 5d 5c Td')).pairing).toBe('fullHouse');
        expect(evaluateBoard(cards('4d 4h 3s 4s 4c')).pairing).toBe('quads');
    });

    it('donne la position TH des cartes tombées depuis le flop', () => {
        // Flop Q73 : cartes absentes A, K, J… ; le J est la 3e meilleure
        const board = evaluateBoard(cards('Qh 7d 3c 3s Jh'));
        expect(board.runout?.flop.th).toBe(3);
        expect(board.runout?.previous.th).toBe(3);
    });
});

describe('evaluateHand', () => {
    it('classe les 4e et 5e paires et les paires servies sous le board à la river', () => {
        const board = cards('Ks Th 7d 4c 2s');
        expect(evaluateHand(cards('4h Ac'), board).level).toBe('fourth_pair');
        expect(evaluateHand(cards('2h Ac'), board).level).toBe('fifth_pair');
        expect(evaluateHand(cards('5h 5d'), board).level).toBe('pp_below_third');
        expect(evaluateHand(cards('3h 3d'), board).level).toBe('pp_below_fourth');
    });

    it('détecte le kicker qui joue sur un board pairé', () => {
        const board = cards('9s 4h 3d 9c Ts');
        const winning = evaluateHand(cards('Jd 4c'), board);
        expect(winning.level).toBe('second_pair');
        expect(winning.kickerPlays).toBeTrue();
        expect(evaluateHand(cards('5d 4c'), board).kickerPlays).toBeFalse();
    });

    it('classe les fulls parmi les fulls possibles', () => {
        const board = cards('Ts 5h 5d 5c 2s');
        const aces = evaluateHand(cards('Ac Ad'), board);
        expect(aces.level).toBe('full_house');
        expect(aces.strength?.top).toBe(2);
        expect(evaluateHand(cards('Th Td'), board).strength?.top).toBe(1);
        expect(evaluateHand(cards('2h 2d'), board).strength?.bottom).toBe(1);
    });

    it('considère que le héros joue le board quand ses cartes n\'améliorent rien', () => {
        const board = cards('5s 6h 7d 8c 9s');
        expect(evaluateHand(cards('Ad Kc'), board).level).toBe('nothing');
        expect(evaluateHand(cards('9d 9h'), board).level).toBe('nothing');
        expect(evaluateHand(cards('Td 2c'), board).level).toBe('straight');
    });

    it('ne garde que la plus haute carte sur un carré du board', () => {
        const hand = evaluateHand(cards('Ac Kd'), cards('4d 4h 3s 4s 4c'));
        expect(hand.level).toBe('nothing');
        expect(hand.th).toBe(1);
    });

    it('n\'a plus de tirage à la river', () => {
        const turn = evaluateHand(cards('As 3h'), cards('Ks Ts 7s 4d'));
        expect(turn.fd).toBeTrue();
        const river = evaluateHand(cards('As 3h'), cards('Ks Ts 7h 4d 2c'));
        expect(river.fd).toBeFalse();
        expect(river.oesd).toBeFalse();
        expect(river.gutshot).toBeFalse();
    });

    it('compte une couleur du héros seulement si elle bat la couleur du board', () => {
        const board = cards('As Ks Qs Js 9s');
        expect(evaluateHand(cards('2s 3h'), board).level).toBe('nothing');
        expect(evaluateHand(cards('Ts 3h'), board).level).toBe('straight_flush');
    });
});
