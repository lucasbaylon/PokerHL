import { BoardCondition, matchBoardCondition } from './flop-rules';
import { BoardFilter, FlopService, classifyFlop } from './flop.service';
import { evaluateBoard } from './hand-evaluator';

describe('FlopService.randomBoard', () => {
    let service: FlopService;

    beforeEach(() => {
        service = new FlopService();
    });

    const matches = (condition: BoardCondition, board: ReturnType<FlopService['randomBoard']>) =>
        matchBoardCondition(condition, evaluateBoard(board));

    it('tire une turn qui respecte le filtre du flop et les conditions de la turn', () => {
        const overcard: BoardCondition = { kind: 'board', attr: 'newCardVs', op: '>', ref: 'top' };
        const filter: BoardFilter = { flopTypes: ['dry_2_high', 'dry_1_high'], turnConditions: [overcard] };
        for (let i = 0; i < 20; i++) {
            const board = service.randomBoard(filter, 'turn');
            expect(board.length).toBe(4);
            expect(['dry_2_high', 'dry_1_high']).toContain(classifyFlop(board.slice(0, 3)));
            expect(matches(overcard, board)).toBeTrue();
        }
    });

    it('tire une river qui respecte les conditions de la turn et de la river', () => {
        const pairedTurn: BoardCondition = { kind: 'board', attr: 'newCardPairs', ref: 'any' };
        const doublePaired: BoardCondition = { kind: 'board', attr: 'pairing', pairing: 'doublePaired' };
        const filter: BoardFilter = { flopTypes: ['low'], turnConditions: [pairedTurn], riverConditions: [doublePaired] };
        for (let i = 0; i < 20; i++) {
            const board = service.randomBoard(filter, 'river');
            expect(board.length).toBe(5);
            expect(matches(pairedTurn, board.slice(0, 4))).toBeTrue();
            expect(matches(doublePaired, board)).toBeTrue();
        }
    });

    it('trouve les boards rares (couleur sur le board) et exclut les cartes du héros', () => {
        const fiveFlush: BoardCondition = { kind: 'board', attr: 'suitCount', op: '=', n: 5 };
        const hero = [{ value: 'A', color: 'spade' as const }, { value: 'K', color: 'spade' as const }];
        const board = service.randomBoard({ flopTypes: ['mono_2_high', 'other'], riverConditions: [fiveFlush] }, 'river', hero);
        expect(board.length).toBe(5);
        expect(matches(fiveFlush, board)).toBeTrue();
        expect(board.some(card => hero.some(item => item.value === card.value && item.color === card.color))).toBeFalse();
    });

    it('renvoie un board vide quand aucune turn ne correspond', () => {
        const impossible: BoardCondition = { kind: 'board', attr: 'newCardRank', op: '>', rank: 14 };
        expect(service.randomBoard({ flopTypes: ['low'], turnConditions: [impossible] }, 'turn')).toEqual([]);
    });
});
