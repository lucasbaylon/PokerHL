import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { LexiconEntry, LEXICON_ENTRIES } from './lexicon-entries';

interface LexiconGroup {
    letter: string;
    entries: LexiconEntry[];
}

interface LexiconEntryView extends LexiconEntry {
    animationDelay: string;
}

interface LexiconGroupView {
    letter: string;
    entries: LexiconEntryView[];
    animationDelay: string;
}

@Component({
    selector: 'app-lexicon',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule],
    templateUrl: './lexicon.component.html'
})
export class LexiconComponent {

    query = '';
    selectedLetter = '';
    animationRun = 0;
    private readonly letterOverrides = new Map<string, string>([
        ['+ (plus)', 'P'],
        ['A chip and a chair', 'C'],
        ['Se coucher', 'C']
    ]);
    private readonly groups = this.buildGroups(LEXICON_ENTRIES);

    get filteredGroups(): LexiconGroupView[] {
        const query = this.normalizeTerm(this.query);
        let visibleIndex = 0;

        return this.groups
            .filter((group) => !this.selectedLetter || group.letter === this.selectedLetter)
            .map((group) => {
                const entries = query
                    ? group.entries.filter((entry) =>
                        this.normalizeTerm(`${entry.term} ${entry.definition}`).includes(query)
                    )
                    : group.entries;

                return {
                    letter: group.letter,
                    animationDelay: `${Math.min(700, 100 + visibleIndex++ * 25)}ms`,
                    entries: entries.map((entry) => ({
                        ...entry,
                        animationDelay: `${Math.min(700, 100 + visibleIndex++ * 25)}ms`
                    }))
                };
            })
            .filter((group) => group.entries.length > 0);
    }

    get visibleTermsCount(): number {
        return this.filteredGroups.reduce((count, group) => count + group.entries.length, 0);
    }

    get letters(): string[] {
        return this.groups.map((group) => group.letter);
    }

    get animationName(): string {
        return this.animationRun % 2 === 0 ? 'appear' : 'appear-alt';
    }

    selectLetter(letter: string): void {
        this.selectedLetter = this.selectedLetter === letter ? '' : letter;
        this.restartAnimations();
    }

    clearLetter(): void {
        this.selectedLetter = '';
        this.restartAnimations();
    }

    restartAnimations(): void {
        this.animationRun++;
    }

    private buildGroups(entries: LexiconEntry[]): LexiconGroup[] {
        const groups = new Map<string, LexiconEntry[]>();

        entries.forEach((entry) => {
            const letter = this.getLetter(entry.term);
            const existingEntries = groups.get(letter) ?? [];
            existingEntries.push(entry);
            groups.set(letter, existingEntries);
        });

        return Array.from(groups, ([letter, entries]) => ({ letter, entries }));
    }

    private getLetter(term: string): string {
        const override = this.letterOverrides.get(term);

        if (override) {
            return override;
        }

        return this.normalizeTerm(term).charAt(0).toUpperCase();
    }

    private normalizeTerm(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
}
