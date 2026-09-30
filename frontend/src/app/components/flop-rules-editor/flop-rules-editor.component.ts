import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { Solution } from '../../interfaces/solution';
import { CommonService } from '../../services/common.service';
import { FlopRule, RuleCondition, describeCondition } from '../../services/flop-rules';
import { Street } from '../../services/flop.service';
import { FlopConditionDialogComponent } from '../flop-condition-dialog/flop-condition-dialog.component';

/**
 * Éditeur des règles d'une situation postflop (flop, turn, river) : chaque règle associe des conditions (toutes requises) à une action.
 * Les règles sont testées dans l'ordre ; l'action « Sinon » s'applique quand aucune ne correspond.
 */
@Component({
    selector: 'app-flop-rules-editor',
    standalone: true,
    imports: [FormsModule, NgTemplateOutlet, DropdownModule, SharedModule, FlopConditionDialogComponent],
    templateUrl: './flop-rules-editor.component.html'
})
export class FlopRulesEditorComponent {
    /** Règles de la situation, modifiées sur place. */
    @Input() rules: FlopRule[] = [];
    /** Actions proposées pour les règles. */
    @Input() actions: Solution[] = [];
    /** Toutes les solutions de la situation (couleurs des raises et bets). */
    @Input() solutions: Solution[] = [];
    @Input() defaultSolutionId?: string;
    /** Street de la situation : limite les conditions proposées. */
    @Input() street: Street = 'flop';
    @Output() defaultSolutionIdChange = new EventEmitter<string>();

    readonly describeCondition = describeCondition;

    dialogOpen = false;
    editedRule?: FlopRule;
    editedConditionIndex?: number;

    constructor(public commonService: CommonService) { }

    get editedCondition(): RuleCondition | undefined {
        return this.editedConditionIndex === undefined ? undefined : this.editedRule?.conditions[this.editedConditionIndex];
    }

    actionColor(solutionId: string | undefined): string {
        const solution = this.solutions.find(item => item.id === solutionId);
        return this.commonService.solutionColor(solution, this.solutions);
    }

    addRule() {
        const nextIndex = Math.max(0, ...this.rules.map(rule => Number(rule.id.replace('rule_', '')) || 0)) + 1;
        const rule: FlopRule = { id: `rule_${nextIndex}`, conditions: [], solutionId: undefined };
        this.rules.push(rule);
        this.openCondition(rule);
    }

    removeRule(index: number) {
        this.rules.splice(index, 1);
    }

    /**
     * Déplace une règle vers le haut (-1) ou le bas (1) : l'ordre détermine la priorité.
     */
    moveRule(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= this.rules.length) return;
        [this.rules[index], this.rules[target]] = [this.rules[target], this.rules[index]];
    }

    /**
     * Ouvre le dialogue de condition pour en ajouter une à la règle, ou modifier celle d'index donné.
     */
    openCondition(rule: FlopRule, conditionIndex?: number) {
        this.editedRule = rule;
        this.editedConditionIndex = conditionIndex;
        this.dialogOpen = true;
    }

    removeCondition(rule: FlopRule, conditionIndex: number) {
        rule.conditions.splice(conditionIndex, 1);
    }

    onConditionSaved(condition: RuleCondition) {
        if (this.editedRule) {
            if (this.editedConditionIndex === undefined) this.editedRule.conditions.push(condition);
            else this.editedRule.conditions[this.editedConditionIndex] = condition;
        }
        this.closeDialog();
    }

    closeDialog() {
        this.dialogOpen = false;
        this.editedRule = undefined;
        this.editedConditionIndex = undefined;
    }
}
